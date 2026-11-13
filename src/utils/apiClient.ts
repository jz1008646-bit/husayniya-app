const LOCAL_BLOCKED_PATTERNS: RegExp[] = [
  /(?:https?:\/\/|www\.|t\.me\/|wa\.me\/|instagram\.com|tiktok\.com|snapchat\.com)/i,
  /(?:أغاني|اغاني|موسيقى|مطرب|طرب|رقص|حفلة غنائية|فيلم|مسلسل|سينما|تيك توك|ببجي|فورتنايت|لعبة|كازينو|مراهنات|قمار|كورة|مباراة|دوري|ريال مدريد|برشلونة)/i,
  /(?:حب وغرام|عشق وغرام|تعال خاص|تعارف|سناب شات|بيع وشراء|إعلان ممول|خصم|سعر|تخفيضات|عملات رقمية|فوركس|تداول)/i,
  /(?:شتم|لعن غير جائز|قذف|سبّ|فحش|إباحي|سافل|وقح)/i,
];

export function getApiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function moderateReligiousContent(
  text: string,
  context: 'story' | 'topic' | 'reply' | 'profile'
): Promise<{ allowed: boolean; reason?: string }> {
  const trimmed = text.trim();
  for (const pat of LOCAL_BLOCKED_PATTERNS) {
    if (pat.test(trimmed)) {
      return {
        allowed: false,
        reason:
          'يُحظر نشر أي محتوى خارج الإطار الديني أو الأخلاقي أو العلمي الإسلامي (كالروابط الإعلانية أو الترفيه غير الديني).',
      };
    }
  }

  try {
    const res = await fetch(getApiUrl('/api/moderate-content'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, context }),
    });
    if (!res.ok) {
      return { allowed: true };
    }
    const data = (await res.json()) as { allowed?: boolean; reason?: string };
    return {
      allowed: data.allowed !== false,
      reason: data.reason,
    };
  } catch {
    // Offline / standalone mobile build without backend URL: deterministic check already passed
    return { allowed: true };
  }
}
