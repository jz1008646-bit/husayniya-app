import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  BookOpen,
  Headphones,
  X,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  Search,
  Loader2,
} from 'lucide-react';
import { QURAN_CATALOG } from '../data/quranCatalog';
import { QURAN_SURAHS } from '../data/quranData';
import { QuranAyah, QuranSurahMeta } from '../types';
import { speakArabicText, stopArabicSpeech } from '../utils/audioEngine';
import { getApiUrl } from '../utils/apiClient';
import quranManuscriptImg from '../assets/images/quran_manuscript_cover_1794596208654.jpg';

type ReciterId = 'parhizgar' | 'mansoori' | 'basit_mujawwad' | 'minshawi_mujawwad';

interface ReciterInfo {
  id: ReciterId;
  name: string;
  tag: string;
  folder: string;
}

const RECITERS: ReciterInfo[] = [
  {
    id: 'parhizgar',
    name: 'الحاج شهريار برهيزكار',
    tag: 'تلاوة شيعية مرتلة',
    folder: 'Parhizgar_48kbps',
  },
  {
    id: 'mansoori',
    name: 'الحاج كريم منصوري',
    tag: 'تلاوة شيعية دولية',
    folder: 'Karim_Mansoori_40kbps',
  },
  {
    id: 'basit_mujawwad',
    name: 'الشيخ عبد الباسط (المجود)',
    tag: 'الطور العراقي والمجالس',
    folder: 'Abdul_Basit_Mujawwad_128kbps',
  },
  {
    id: 'minshawi_mujawwad',
    name: 'الشيخ المنشاوي (المجود)',
    tag: 'تلاوة خاشعة مجودة',
    folder: 'Minshawy_Mujawwad_192kbps',
  },
];

function buildEveryAyahUrl(folder: string, surahId: number, ayahNumber: number): string {
  const s = String(surahId).padStart(3, '0');
  const a = String(ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${s}${a}.mp3`;
}

function normalizeArabicForSearch(str: string): string {
  return str
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .trim();
}

export const QuranView: React.FC = () => {
  const [selectedMeta, setSelectedMeta] = useState<QuranSurahMeta>(QURAN_CATALOG[0]);
  const [ayahs, setAyahs] = useState<QuranAyah[]>(QURAN_SURAHS[0]?.ayahs || []);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [surahError, setSurahError] = useState('');

  const [surahFilter, setSurahFilter] = useState<'all' | 'tiwal' | 'miin' | 'mufassal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [reciter, setReciter] = useState<ReciterId>('parhizgar');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [audioStatusNote, setAudioStatusNote] = useState<string>('');

  const [activeAyah, setActiveAyah] = useState<QuranAyah | null>(null);
  const [copiedAyah, setCopiedAyah] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const singleAyahAudioRef = useRef<HTMLAudioElement | null>(null);
  const clientCacheRef = useRef<Map<number, QuranAyah[]>>(new Map());
  const isPlayingRef = useRef(false);
  const playingIndexRef = useRef(0);

  isPlayingRef.current = isPlaying;
  playingIndexRef.current = playingAyahIndex;

  const activeReciterInfo = useMemo(
    () => RECITERS.find((r) => r.id === reciter) || RECITERS[0],
    [reciter]
  );

  // Load full Surah (All 114 Surahs including طوال السور) with exact Tashkeel
  useEffect(() => {
    let cancelled = false;

    const loadSurah = async () => {
      setSurahError('');
      setActiveAyah(null);
      setIsPlaying(false);
      setPlayingAyahIndex(0);
      setAudioStatusNote('');
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopArabicSpeech();

      const cached = clientCacheRef.current.get(selectedMeta.id);
      if (cached) {
        setAyahs(cached);
        setLoadingSurah(false);
        return;
      }

      setLoadingSurah(true);
      try {
        let loadedAyahs: QuranAyah[] | null = null;
        try {
          const res = await fetch(getApiUrl(`/api/quran/surah/${selectedMeta.id}`));
          if (res.ok) {
            const data = (await res.json()) as { ayahs?: QuranAyah[] };
            if (Array.isArray(data.ayahs) && data.ayahs.length > 0) {
              loadedAyahs = data.ayahs;
            }
          }
        } catch {
          // Will try direct public Quran API below
        }

        if (!loadedAyahs) {
          const directRes = await fetch(
            `https://api.alquran.cloud/v1/surah/${selectedMeta.id}/editions/quran-uthmani,ar.muyassar`
          );
          if (directRes.ok) {
            const json = (await directRes.json()) as {
              data?: Array<{
                ayahs?: Array<{ numberInSurah: number; text: string }>;
              }>;
            };
            const uthmani = json.data?.[0];
            const muyassar = json.data?.[1];
            if (uthmani && Array.isArray(uthmani.ayahs) && uthmani.ayahs.length > 0) {
              loadedAyahs = uthmani.ayahs.map((a, idx) => ({
                number: a.numberInSurah,
                text: a.text,
                tafsir: muyassar?.ayahs?.[idx]?.text || 'آية من كتاب الله الحكيم.',
              }));
            }
          }
        }

        if (!loadedAyahs) {
          throw new Error('تعذر تحميل السورة');
        }

        if (!cancelled) {
          clientCacheRef.current.set(selectedMeta.id, loadedAyahs);
          setAyahs(loadedAyahs);
        }
      } catch {
        const fallback = QURAN_SURAHS.find((s) => s.id === selectedMeta.id);
        if (!cancelled) {
          if (fallback) {
            setAyahs(fallback.ayahs);
          } else {
            setSurahError('تعذر تحميل آيات هذه السورة الآن، تأكد من الاتصال بالإنترنت.');
          }
        }
      } finally {
        if (!cancelled) setLoadingSurah(false);
      }
    };

    void loadSurah();
    return () => {
      cancelled = true;
    };
  }, [selectedMeta.id]);

  // Stop audio on reciter change cleanly
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (singleAyahAudioRef.current) {
      singleAyahAudioRef.current.pause();
    }
    stopArabicSpeech();
    setIsPlaying(false);
    setAudioStatusNote('');
  }, [reciter]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      singleAyahAudioRef.current?.pause();
      stopArabicSpeech();
    };
  }, []);

  const playAyahAtIndex = async (idx: number) => {
    const audio = audioRef.current;
    const targetAyah = ayahs[idx];
    if (!audio || !targetAyah) {
      setIsPlaying(false);
      return;
    }

    const url = buildEveryAyahUrl(activeReciterInfo.folder, selectedMeta.id, targetAyah.number);
    setPlayingAyahIndex(idx);
    setAudioStatusNote(`يتلو الآن: ${activeReciterInfo.name} · الآية ${targetAyah.number}`);
    audio.src = url;
    audio.muted = isMuted;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // Fallback to Arabic TTS for this Ayah if network blocks MP3
      setIsPlaying(true);
      speakArabicText(targetAyah.text, {
        rate: 0.78,
        onEnd: () => {
          if (isPlayingRef.current && idx + 1 < ayahs.length) {
            void playAyahAtIndex(idx + 1);
          } else {
            setIsPlaying(false);
          }
        },
        onError: () => setIsPlaying(false),
      });
    }
  };

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || ayahs.length === 0) return;

    if (isPlaying) {
      audio.pause();
      stopArabicSpeech();
      setIsPlaying(false);
      setAudioStatusNote('تم إيقاف التلاوة مؤقتاً');
      return;
    }

    await playAyahAtIndex(playingAyahIndex);
  };

  const handlePrevNextSurah = (dir: -1 | 1) => {
    const idx = QURAN_CATALOG.findIndex((s) => s.id === selectedMeta.id);
    const nextIdx = (idx + dir + QURAN_CATALOG.length) % QURAN_CATALOG.length;
    setSelectedMeta(QURAN_CATALOG[nextIdx]);
  };

  const toggleMute = () => {
    const next = !isMuted;
    if (audioRef.current) audioRef.current.muted = next;
    if (singleAyahAudioRef.current) singleAyahAudioRef.current.muted = next;
    setIsMuted(next);
  };

  const handleCopySingleAyah = async (ayah: QuranAyah) => {
    try {
      await navigator.clipboard.writeText(
        `﴿${ayah.text}﴾ [${selectedMeta.name} — الآية ${ayah.number}]`
      );
      setCopiedAyah(true);
      setTimeout(() => setCopiedAyah(false), 2000);
    } catch {
      setCopiedAyah(false);
    }
  };

  const handleSpeakSingleAyah = async (ayah: QuranAyah) => {
    // Pause sequential Surah player first
    if (audioRef.current) audioRef.current.pause();
    stopArabicSpeech();
    setIsPlaying(false);

    const singleAudio = singleAyahAudioRef.current;
    const url = buildEveryAyahUrl(activeReciterInfo.folder, selectedMeta.id, ayah.number);
    if (singleAudio) {
      singleAudio.src = url;
      singleAudio.muted = isMuted;
      try {
        await singleAudio.play();
        return;
      } catch {
        // Fallback below
      }
    }
    speakArabicText(ayah.text, { rate: 0.78 });
  };

  const handleStepAyah = (dir: -1 | 1) => {
    if (!activeAyah) return;
    const idx = ayahs.findIndex((a) => a.number === activeAyah.number);
    if (idx === -1) return;
    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < ayahs.length) {
      setActiveAyah(ayahs[nextIdx]);
      setCopiedAyah(false);
    }
  };

  const filteredCatalog = useMemo(() => {
    const q = normalizeArabicForSearch(searchQuery);
    return QURAN_CATALOG.filter((s) => {
      const matchesGroup =
        surahFilter === 'all'
          ? true
          : surahFilter === 'tiwal'
          ? s.id >= 2 && s.id <= 10
          : surahFilter === 'miin'
          ? s.id >= 11 && s.id <= 35
          : s.id >= 36;
      const matchesSearch =
        !q ||
        normalizeArabicForSearch(s.name).includes(q) ||
        String(s.id) === q;
      return matchesGroup && matchesSearch;
    });
  }, [surahFilter, searchQuery]);

  const showStandaloneBasmala =
    selectedMeta.id !== 1 &&
    selectedMeta.id !== 9 &&
    !(ayahs[0]?.text || '').trim().startsWith('بِسْمِ');

  return (
    <div className="space-y-6">
      {/* Sequential Surah Audio Element */}
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => {
          const nextIdx = playingIndexRef.current + 1;
          if (isPlayingRef.current && nextIdx < ayahs.length) {
            void playAyahAtIndex(nextIdx);
          } else {
            setIsPlaying(false);
            setPlayingAyahIndex(0);
            setAudioStatusNote('تمّت تلاوة السورة الكريمة بحمد الله');
          }
        }}
        onError={() => {
          if (isPlayingRef.current) {
            const currentAyah = ayahs[playingIndexRef.current];
            if (currentAyah) {
              speakArabicText(currentAyah.text, {
                rate: 0.78,
                onEnd: () => {
                  const nextIdx = playingIndexRef.current + 1;
                  if (isPlayingRef.current && nextIdx < ayahs.length) {
                    void playAyahAtIndex(nextIdx);
                  } else {
                    setIsPlaying(false);
                  }
                },
              });
            }
          }
        }}
      />
      <audio ref={singleAyahAudioRef} preload="none" />

      {/* Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden">
        <div className="lg:col-span-5 relative min-h-[210px] bg-[#182620]">
          {!imgError ? (
            <img
              src={quranManuscriptImg}
              alt="المصحف الشريف على الرحلة الخشبية"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F5132] to-[#1C1917]">
              <BookOpen className="w-16 h-16 text-amber-300/40" />
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
              المصحف الشريف كاملاً (١١٤ سورة) · تلاوة بأصوات شيعية ونص بالتشكيل الدقيق
            </p>
            <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
              {selectedMeta.name}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
              {selectedMeta.revelationType} · {selectedMeta.ayahCount} آية · اضغط على أي آية لعرضها بالتشكيل الكامل والتفسير
            </p>
          </div>

          {/* Shia & Classical Reciter Toggle */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 block">
              اختر صوت القارئ:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {RECITERS.map((rec) => {
                const active = reciter === rec.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => setReciter(rec.id)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors text-right ${
                      active
                        ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                        : 'bg-[#FAF8F4] dark:bg-[#0B1117] text-stone-700 dark:text-stone-300 border border-[#E7E1D6] dark:border-[#1F2B37] hover:bg-stone-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="block">{rec.name}</span>
                    <span
                      className={`text-[10px] font-normal ${
                        active ? 'text-emerald-100' : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {rec.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio Player Bar */}
          <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrevNextSurah(-1)}
                  aria-label="السورة السابقة"
                  className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={loadingSurah || ayahs.length === 0}
                  onClick={handleTogglePlay}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-60"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'إيقاف التلاوة' : 'استماع للسورة آية بآية'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrevNextSurah(1)}
                  aria-label="السورة التالية"
                  className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {audioStatusNote && (
              <p className="text-xs text-[#0F5132] dark:text-emerald-400 font-medium tabular-nums">
                {audioStatusNote}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Full 114-Surah Catalog + Interactive Clickable Ayah Mushaf */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-4 space-y-3">
            <h2 className="text-sm font-bold text-stone-800 dark:text-stone-200 tabular-nums">
              فهرس المصحف الشريف ({QURAN_CATALOG.length} سورة)
            </h2>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم السورة أو رقمها..."
                className="w-full min-h-[42px] pr-9 pl-3 py-1.5 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-xs md:text-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'الكل (١١٤)' },
                { id: 'tiwal', label: 'طوال السور' },
                { id: 'miin', label: 'المئون' },
                { id: 'mufassal', label: 'المثاني والمفصّل' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSurahFilter(tab.id as typeof surahFilter)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    surahFilter === tab.id
                      ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                      : 'bg-[#FAF8F4] dark:bg-[#0B1117] text-stone-700 dark:text-stone-300 border border-[#E7E1D6] dark:border-[#1F2B37]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-h-[540px] overflow-y-auto space-y-1.5 pl-1">
              {filteredCatalog.map((surah) => {
                const active = surah.id === selectedMeta.id;
                return (
                  <button
                    key={surah.id}
                    type="button"
                    onClick={() => setSelectedMeta(surah)}
                    className={`min-h-[50px] w-full text-right p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                      active
                        ? 'border-[#0F5132] dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                        : 'border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] hover:bg-stone-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center text-xs font-bold tabular-nums text-[#0F5132] dark:text-emerald-400 shrink-0">
                        {surah.id}
                      </span>
                      <div className="min-w-0">
                        <p className="font-amiri text-base font-bold text-stone-900 dark:text-white truncate">
                          {surah.name}
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                          {surah.revelationType} · {surah.ayahCount} آية
                        </p>
                      </div>
                    </div>
                    <Headphones
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[#0F5132] dark:text-emerald-400' : 'text-stone-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Mushaf Reader: Every Ayah is clickable to open exact vowelized Ayah Window */}
        <section className="lg:col-span-8 rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              انقر على أي آية لعرضها بالتشكيل الكامل مع التفسير والاستماع إليها منفردة
            </p>
            <span className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400 tabular-nums">
              {selectedMeta.name} ({ayahs.length} آية)
            </span>
          </div>

          {loadingSurah ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-sm text-stone-500">
              <Loader2 className="w-7 h-7 animate-spin text-[#0F5132]" />
              <span>جارٍ تحميل السورة الكريمة بالتشكيل الكامل...</span>
            </div>
          ) : surahError ? (
            <div className="py-12 text-center text-sm text-rose-600 font-semibold">{surahError}</div>
          ) : (
            <>
              {showStandaloneBasmala && (
                <div className="text-center pb-2">
                  <p className="font-amiri text-2xl md:text-3xl text-[#0F5132] dark:text-emerald-400 font-bold">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {ayahs.map((ayah, idx) => {
                  const isCurrentPlaying = isPlaying && playingAyahIndex === idx;
                  return (
                    <div
                      key={ayah.number}
                      className={`rounded-xl border transition-colors p-4 flex items-start justify-between gap-3 ${
                        isCurrentPlaying
                          ? 'border-[#0F5132] bg-emerald-50/70 dark:bg-emerald-950/40'
                          : 'border-transparent hover:border-[#0F5132]/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/25'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAyah(ayah);
                          setCopiedAyah(false);
                        }}
                        className="flex-1 text-right cursor-pointer"
                      >
                        <span className="font-amiri text-2xl md:text-3xl leading-[2.15] text-stone-900 dark:text-stone-100">
                          {ayah.text}
                        </span>
                      </button>

                      <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAyah(ayah);
                            setCopiedAyah(false);
                          }}
                          title="فتح نافذة الآية"
                          className="inline-flex items-center justify-center w-9 h-9 text-xs font-cairo font-bold rounded-full border border-amber-600/40 text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 tabular-nums hover:bg-[#0F5132] hover:text-white cursor-pointer transition-colors"
                        >
                          {ayah.number}
                        </button>
                        <button
                          type="button"
                          onClick={() => void playAyahAtIndex(idx)}
                          aria-label={`استماع للآية ${ayah.number}`}
                          title="تشغيل التلاوة من هذه الآية"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:text-[#0F5132] hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#E7E1D6] dark:border-[#1F2B37] text-center">
                <p className="font-amiri text-lg font-bold text-stone-600 dark:text-stone-400">
                  صَدَقَ اللَّهُ الْعَلِيُّ الْعَظِيمُ
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Ayah Detail Modal Window (Opens on Ayah Click with 100% Exact Full Tashkeel) */}
      {activeAyah && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveAyah(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
              <div>
                <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                  {selectedMeta.name} · الآية {activeAyah.number}
                </p>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                  نص الآية الكريمة بالتشكيل الكامل والتفسير
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAyah(null)}
                aria-label="إغلاق نافذة الآية"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exact Vowelized Ayah Display */}
            <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-6 text-center">
              <p className="font-amiri text-3xl md:text-4xl leading-[2.3] text-stone-900 dark:text-white">
                ﴿{activeAyah.text}﴾
              </p>
            </div>

            {/* Tafsir */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#0F5132] dark:text-emerald-400">
                المعنى والتفسير الميسّر:
              </p>
              <p className="text-sm md:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                {activeAyah.tafsir}
              </p>
            </div>

            {/* Actions & Ayah Stepping */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E7E1D6] dark:border-[#1F2B37]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSpeakSingleAyah(activeAyah)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>تلاوة بصوت {activeReciterInfo.name.split(' ').slice(0, 2).join(' ')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopySingleAyah(activeAyah)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {copiedAyah ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedAyah ? 'تم النسخ' : 'نسخ الآية'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStepAyah(-1)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-1 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابقة</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStepAyah(1)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-1 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <span>التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
