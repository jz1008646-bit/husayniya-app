import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface CachedSurahPayload {
  id: number;
  name: string;
  revelationType: 'مكية' | 'مدنية';
  ayahCount: number;
  ayahs: Array<{
    number: number;
    text: string;
    tafsir: string;
  }>;
}

const surahCache = new Map<number, CachedSurahPayload>();

// Fast deterministic guardrail against clearly non-religious / inappropriate content
const BLOCKED_PATTERNS: RegExp[] = [
  /(?:https?:\/\/|www\.|t\.me\/|wa\.me\/|instagram\.com|tiktok\.com|snapchat\.com)/i,
  /(?:أغاني|اغاني|موسيقى|مطرب|طرب|رقص|حفلة غنائية|فيلم|مسلسل|سينما|تيك توك|ببجي|فورتنايت|لعبة|كازينو|مراهنات|قمار|كورة|مباراة|دوري|ريال مدريد|برشلونة)/i,
  /(?:حب وغرام|عشق وغرام|تعال خاص|تعارف|سناب شات|بيع وشراء|إعلان ممول|خصم|سعر|تخفيضات|عملات رقمية|فوركس|تداول)/i,
  /(?:شتم|لعن غير جائز|قذف|سبّ|فحش|إباحي|سافل|وقح)/i,
];

function quickBlockReason(text: string): string | null {
  for (const pat of BLOCKED_PATTERNS) {
    if (pat.test(text)) {
      return 'يُحظر نشر أي محتوى خارج الإطار الديني أو الأخلاقي أو العلمي الإسلامي (كالروابط الإعلانية أو الترفيه غير الديني أو المواضيع الدنيوية الصرفة).';
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Server-side religious content moderation endpoint
  app.post('/api/moderate-content', async (req, res) => {
    try {
      const { text, context } = req.body ?? {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ allowed: false, reason: 'النص فارغ.' });
      }

      const trimmed = text.trim().slice(0, 4500);

      // 1. Deterministic fast block
      const fastReason = quickBlockReason(trimmed);
      if (fastReason) {
        return res.json({ allowed: false, reason: fastReason });
      }

      // 2. Contextual AI religious-framework verification via Gemini
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ allowed: true, reason: '' });
      }

      const contextLabel =
        context === 'story'
          ? 'ستوري ديني'
          : context === 'topic'
          ? 'موضوع في ساحة المناقشة الدينية والعلمية'
          : context === 'reply'
          ? 'رد في نقاش ديني'
          : 'نبذة تعريفية في ملف شخصي داخل تطبيق إسلامي';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `قيّم النص التالي المراد نشره كـ (${contextLabel}) في تطبيق «المدونة الحسينية»:\n\n"""${trimmed}"""`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `أنت مراقب شرعي وعلمي صارم في تطبيق إسلامي حوزوي (المدونة الحسينية).
مهمتك منع وحظر أي محتوى خارج الإطار الديني والإسلامي والأخلاقي.
يُسمح فقط بـ:
- القرآن الكريم، التفسير، الأحاديث الشريفة، الأدعية والزيارات، الأذكار.
- الفقه، العقيدة، أصول الفقه، المنطق، النحو واللغة العربية، الفلسفة الإسلامية، الأخلاق والتربية الروحية.
- سيرة النبي وأهل البيت (عليهم السلام) والصحابة والعلماء، زيارة العتبات المقدسة، والتعارف الدراسي الحوزوي أو التحيات الإسلامية المحترمة المتعلقة بطلب العلم والعبادة.

يُحظر ويُرفض (allowed = false) كل ما يلي:
- أي كلام خارج إطار الدين: مواضيع الرياضة، الأغاني، الأفلام، الألعاب، السياسة الحزبية الدنيوية، الإعلانات التجارية، البيع والشراء، التداول، الغزل، التعارف العاطفي، النكات التافهة، السب أو الطعن أو الإساءة أو الفتنة الطائفية، أو أي روابط وسبام.
- إذا كان النص مجرد حروف عشوائية لا معنى لها، ارفضه.
- إذا كان النص في سياق نبذة شخصية قصيرة، يُسمح بالوصف العلمي أو المهني المحترم أو التعريف بطلب العلم ومحل السكن والاهتمامات الدينية.

أرجع النتيجة بصيغة JSON فقط مع allowed و reason بالعربية الواضحة المختصرة عند الرفض.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              allowed: {
                type: Type.BOOLEAN,
                description: 'true if strictly within Islamic/religious/ethical/Hawza framework, false otherwise.',
              },
              reason: {
                type: Type.STRING,
                description: 'Short clear Arabic explanation when allowed is false.',
              },
            },
            required: ['allowed', 'reason'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{"allowed":true,"reason":""}').trim());
      return res.json({
        allowed: Boolean(parsed.allowed),
        reason:
          typeof parsed.reason === 'string' && parsed.reason.trim()
            ? parsed.reason.trim()
            : 'عذراً، يُسمح فقط بالنشر ضمن الإطار الديني والأخلاقي والعلمي الإسلامي.',
      });
    } catch (err) {
      console.error('Moderation error:', err);
      // Fallback: deterministic check already passed
      return res.json({ allowed: true, reason: '' });
    }
  });

  // Server-side Full 114-Surah Quran Proxy with In-Memory Cache (Full Exact Uthmani Tashkeel + Tafsir)
  app.get('/api/quran/surah/:id', async (req, res) => {
    const surahId = Number(req.params.id);
    if (!Number.isInteger(surahId) || surahId < 1 || surahId > 114) {
      return res.status(400).json({ error: 'رقم السورة غير صحيح.' });
    }

    const cached = surahCache.get(surahId);
    if (cached) {
      return res.json(cached);
    }

    try {
      const apiRes = await fetch(
        `https://api.alquran.cloud/v1/surah/${surahId}/editions/quran-uthmani,ar.muyassar`
      );
      if (!apiRes.ok) {
        return res.status(502).json({ error: 'تعذر جلب نص السورة من الخادم القرآني.' });
      }
      const json = (await apiRes.json()) as {
        data?: Array<{
          number: number;
          name: string;
          revelationType: string;
          numberOfAyahs: number;
          ayahs: Array<{ numberInSurah: number; text: string }>;
        }>;
      };

      const uthmani = json.data?.[0];
      const muyassar = json.data?.[1];
      if (!uthmani || !Array.isArray(uthmani.ayahs)) {
        return res.status(502).json({ error: 'استجابة قرآنية غير مكتملة.' });
      }

      const payload: CachedSurahPayload = {
        id: uthmani.number,
        name: uthmani.name,
        revelationType: uthmani.revelationType === 'Meccan' ? 'مكية' : 'مدنية',
        ayahCount: uthmani.numberOfAyahs,
        ayahs: uthmani.ayahs.map((a, idx) => ({
          number: a.numberInSurah,
          text: a.text,
          tafsir: muyassar?.ayahs?.[idx]?.text || 'آية من كتاب الله الحكيم.',
        })),
      };

      surahCache.set(surahId, payload);
      return res.json(payload);
    } catch (err) {
      console.error('Quran fetch error:', err);
      return res.status(500).json({ error: 'حدث خطأ أثناء تحميل السورة الكريمة.' });
    }
  });

  // Server-side Gemini endpoint for each Religious Figure / Scholar / Companion Bot
  app.post('/api/figure-chat', async (req, res) => {
    try {
      const { figureName, figureRole, figureEra, figureBio, history, message } = req.body ?? {};

      if (!figureName || !message || typeof message !== 'string') {
        return res.status(400).json({ error: 'بيانات المحادثة غير مكتملة.' });
      }

      const fastReason = quickBlockReason(message);
      if (fastReason) {
        return res.json({
          reply: 'عذراً، هذا الملتقى مخصص فقط للأسئلة الدينية والعلمية وسيرة الشخصيات الإسلامية والأخلاق الحوزوية.',
        });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          error: 'مفتاح Gemini غير مهيأ على الخادم حالياً.',
        });
      }

      const systemInstruction = `أنت باحث حوزوي ومؤرخ إسلامي متخصص في سيرة وتراث الشخصية الدينية: "${figureName}" (${figureRole || ''} - ${figureEra || ''}).
نبذة مرجعية عن الشخصية: ${figureBio || ''}

القواعد الصارمة للإجابة:
1. أجب باللغة العربية الفصحى السليمة والرصينة، مع الالتزام بالأدب الإسلامي والتوقير لأهل البيت (عليهم السلام) والصحابة المنتجبين والعلماء الأعلام.
2. قدّم معلومات تاريخية وعلمية دقيقة وموثقة عن سيرة هذه الشخصية، مواقفها، مؤلفاتها، وأقوالها المأثورة.
3. يُحظر الإجابة عن أي موضوع خارج الإطار الديني والعلمي الإسلامي (مثل الأغاني أو الرياضة أو الألعاب أو الترفيه غير الديني)؛ وإن ورد سؤال خارج إطار الدين، اعتذر بأدب وبيّن أن هذا البوت مخصص حصراً للسيرة الدينية والعلوم الإسلامية.
4. اجعل إجابتك واضحة ومقسمة بشكل مريح للقراءة دون إطالة مملة (ما بين 80 إلى 180 كلمة غالباً، أو أكثر إذا طلب السائل التفصيل).`;

      const chatHistory = Array.isArray(history)
        ? history
            .filter(
              (item): item is { role: 'user' | 'model'; text: string } =>
                item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string'
            )
            .slice(-10)
            .map((item) => ({
              role: item.role,
              parts: [{ text: item.text }],
            }))
        : [];

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: message.slice(0, 1000) }] },
        ],
        config: {
          systemInstruction,
        },
      });

      const reply = response.text?.trim() || 'عذراً، لم أتمكن من استحضار الإجابة الآن.';
      return res.json({ reply });
    } catch (err) {
      console.error('Gemini figure-chat error:', err);
      return res.status(500).json({
        error: 'حدث خطأ أثناء الاتصال ببوت السيرة. يرجى المحاولة مجدداً.',
      });
    }
  });

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
