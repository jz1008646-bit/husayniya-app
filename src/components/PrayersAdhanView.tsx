import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Volume2,
  Square,
  Clock,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { CityLocation, PrayerSchedule } from '../types';
import { SHIA_CITIES, getNextPrayer } from '../utils/prayerTimes';
import {
  SHIA_ADHAN_PHRASES,
  SHIA_ADHAN_STREAMS,
  playAdhanPhraseTone,
  speakArabicText,
  stopArabicSpeech,
} from '../utils/audioEngine';

interface PrayersAdhanViewProps {
  selectedCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  prayerSchedule: PrayerSchedule;
}

export const PrayersAdhanView: React.FC<PrayersAdhanViewProps> = ({
  selectedCity,
  onSelectCity,
  prayerSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'times' | 'adhan' | 'guide'>('times');
  const [isPlayingAdhan, setIsPlayingAdhan] = useState(false);
  const [adhanMode, setAdhanMode] = useState<'guided' | 'stream'>('guided');
  const [activePhraseIdx, setActivePhraseIdx] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const nextPrayer = getNextPrayer(prayerSchedule, new Date());

  const stopAllAdhan = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    stopArabicSpeech();
    setIsPlayingAdhan(false);
    setActivePhraseIdx(null);
    setStatusMessage('');
  };

  useEffect(() => {
    return () => {
      stopAllAdhan();
    };
  }, []);

  const runGuidedShiaAdhan = (idx = 0) => {
    if (idx >= SHIA_ADHAN_PHRASES.length) {
      stopAllAdhan();
      setStatusMessage('تمّ الأذان الشيعي المبارك');
      return;
    }

    setIsPlayingAdhan(true);
    setActivePhraseIdx(idx);
    const phrase = SHIA_ADHAN_PHRASES[idx];
    const cleanText = phrase.text.replace(/\s*\(.*?\)/g, '');
    const spokenText = Array.from({ length: Math.min(phrase.repeat, 2) })
      .map(() => cleanText)
      .join(' ... ');

    playAdhanPhraseTone(idx);

    const speechStarted = speakArabicText(spokenText, {
      rate: 0.78,
      pitch: 0.95,
      onEnd: () => {
        timerRef.current = window.setTimeout(() => runGuidedShiaAdhan(idx + 1), 350);
      },
      onError: () => {
        timerRef.current = window.setTimeout(() => runGuidedShiaAdhan(idx + 1), phrase.durationMs);
      },
    });

    if (!speechStarted) {
      timerRef.current = window.setTimeout(() => runGuidedShiaAdhan(idx + 1), phrase.durationMs);
    }
  };

  const handleToggleAdhan = async () => {
    if (isPlayingAdhan) {
      stopAllAdhan();
      return;
    }

    if (adhanMode === 'guided') {
      setStatusMessage('يتم الآن ترديد فصول الأذان الشيعي الكامل...');
      runGuidedShiaAdhan(0);
      return;
    }

    // Stream mode with automatic fallback to guided Shia Adhan
    const audio = audioRef.current;
    if (!audio) {
      runGuidedShiaAdhan(0);
      return;
    }

    try {
      setStatusMessage('جارٍ الاتصال ببث الأذان...');
      audio.src = SHIA_ADHAN_STREAMS[0].url;
      await audio.play();
      setIsPlayingAdhan(true);
      setStatusMessage('يتم الآن بث صوت الأذان');
    } catch {
      setStatusMessage('تم التبديل تلقائياً إلى الأذان الصوتي المدمج');
      runGuidedShiaAdhan(0);
    }
  };

  const prayerRows = [
    { key: 'fajr', label: 'أذان الفجر (الصبح)', time: prayerSchedule.fajr, note: 'بداية وقت الفريضة' },
    { key: 'sunrise', label: 'طلوع الشمس', time: prayerSchedule.sunrise, note: 'انتهاء وقت صلاة الصبح' },
    { key: 'dhuhr', label: 'أذان الظهر (الزوال)', time: prayerSchedule.dhuhr, note: 'بداية وقت الظهرين' },
    { key: 'asr', label: 'أذان العصر', time: prayerSchedule.asr, note: 'فضيلة وقت العصر' },
    { key: 'sunset', label: 'غروب الشمس', time: prayerSchedule.sunset, note: 'السقوط الحسي للقرص' },
    { key: 'maghrib', label: 'أذان المغرب الجعفري', time: prayerSchedule.maghrib, note: 'ذهاب الحمرة المشرقية' },
    { key: 'isha', label: 'أذان العشاء', time: prayerSchedule.isha, note: 'فضيلة وقت العشاء' },
    { key: 'midnight', label: 'منتصف الليل الشرعي', time: prayerSchedule.midnight, note: 'نهاية وقت العشاء الاختياري' },
  ];

  const prayerSteps = [
    {
      title: '١. الأذان والإقامة',
      desc: 'يُستحب الأذان والإقامة قبل الفرائض اليومية، وخصوصاً للمنفرد وفي الصلوات الجهرية، وتُقال فيها الشهادة بالولاية قربةً إلى الله و«حي على خير العمل».',
    },
    {
      title: '٢. النية وتكبيرة الإحرام',
      desc: 'يقف المصلي مستقبلاً القبلة ناوياً القربة، ثم يرفع يديه حذاء أذنيه قائلاً: «اللَّهُ أَكْبَرُ» وهي من أركان الصلاة.',
    },
    {
      title: '٣. القراءة والركوع',
      desc: 'يقرأ الفاتحة وسورة كاملة في الركعتين الأولى والثانية (ومخافتةً في الظهر والعصر)، ثم يركع ويقول: «سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ».',
    },
    {
      title: '٤. السجود على التربة والتشهد والتسليم',
      desc: 'يسجد سجدتين على ما يصح السجود عليه (كالتربة الحسينية أو التراب) قائلاً: «سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ»، ثم يتشهد في الثانية والأخيرة ويسلّم.',
    },
  ];

  return (
    <div className="space-y-6">
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => stopAllAdhan()}
        onError={() => {
          if (isPlayingAdhan && adhanMode === 'stream') {
            setStatusMessage('تم التبديل إلى القراءة الصوتية للأذان الشيعي');
            runGuidedShiaAdhan(0);
          }
        }}
      />

      {/* Page Header & City Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
            الصلوات ومواقيت الأذان الشيعي
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            حساب التوقيت الشرعي وفق الفقه الجعفري (ذهاب الحمرة المشرقية للمغرب) مع مشغل الأذان الشيعي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#0F5132] dark:text-emerald-400 shrink-0" />
          <label htmlFor="city-select" className="sr-only">
            اختر المدينة
          </label>
          <select
            id="city-select"
            value={selectedCity.id}
            onChange={(e) => {
              const found = SHIA_CITIES.find((c) => c.id === e.target.value);
              if (found) onSelectCity(found);
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-sm font-semibold text-stone-900 dark:text-white cursor-pointer"
          >
            {SHIA_CITIES.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name} ({city.country})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('times')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'times'
              ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
              : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>مواقيت الصلاة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('adhan')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'adhan'
              ? 'bg-[#881337] text-white dark:bg-rose-700'
              : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>صوت الأذان الشيعي</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'guide'
              ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
              : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>كيفية الصلاة وأحكامها</span>
        </button>
      </div>

      {/* Quick Shia Adhan Player Card (Always visible on Times & Adhan tabs) */}
      {activeTab !== 'guide' && (
        <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
              الأذان الجعفري الكامل · الصلاة القادمة: {nextPrayer.label} ({nextPrayer.time})
            </p>
            <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
              مشغل الأذان الشيعي (صوت)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {statusMessage || 'اضغط للاستماع إلى الأذان الشيعي مع الشهادة الثالثة وحي على خير العمل'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37]">
              <button
                type="button"
                onClick={() => {
                  stopAllAdhan();
                  setAdhanMode('guided');
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  adhanMode === 'guided'
                    ? 'bg-white dark:bg-[#121A22] text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                الأذان التفاعلي الكامل
              </button>
              <button
                type="button"
                onClick={() => {
                  stopAllAdhan();
                  setAdhanMode('stream');
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  adhanMode === 'stream'
                    ? 'bg-white dark:bg-[#121A22] text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                بث صوتي مسجل
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleAdhan}
              className={`min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                isPlayingAdhan
                  ? 'bg-stone-800 text-white hover:bg-stone-900 dark:bg-stone-700'
                  : 'bg-[#881337] text-white hover:bg-[#6D0F2C] dark:bg-rose-700 dark:hover:bg-rose-600'
              }`}
            >
              {isPlayingAdhan ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isPlayingAdhan ? 'إيقاف الأذان' : 'تشغيل الأذان الشيعي'}</span>
            </button>
          </div>
        </section>
      )}

      {/* Tab Content */}
      {activeTab === 'times' && (
        <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              الجدول اليومي لأوقات الصلاة — {selectedCity.name}
            </h3>
            <span className="text-xs font-medium text-[#0F5132] dark:text-emerald-400">
              {nextPrayer.remainingText}
            </span>
          </div>

          <div className="divide-y divide-[#E7E1D6] dark:divide-[#1F2B37]">
            {prayerRows.map((row) => {
              const isNext = row.key === nextPrayer.key;
              return (
                <div
                  key={row.key}
                  className={`px-6 py-4 flex items-center justify-between gap-4 ${
                    isNext ? 'bg-emerald-50/60 dark:bg-emerald-950/30' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm md:text-base font-bold text-stone-900 dark:text-white">
                      {row.label}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {row.note}
                    </p>
                  </div>
                  <div className="text-left">
                    <span
                      className={`text-lg md:text-xl font-bold tabular-nums ${
                        isNext
                          ? 'text-[#0F5132] dark:text-emerald-400'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {row.time}
                    </span>
                    {isNext && (
                      <p className="text-[11px] font-semibold text-[#0F5132] dark:text-emerald-400">
                        القادمة
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'adhan' && (
        <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8 space-y-5">
          <div className="space-y-1">
            <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
              فصول الأذان الشيعي المأثورة
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              اضغط على أي فصل للاستماع إليه مباشرة أو شغّل الأذان كاملاً من الأعلى
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SHIA_ADHAN_PHRASES.map((phrase, idx) => {
              const isCurrent = activePhraseIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    stopAllAdhan();
                    setAdhanMode('guided');
                    runGuidedShiaAdhan(idx);
                  }}
                  className={`min-h-[60px] text-right p-4 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-[#881337] bg-rose-50/70 dark:bg-rose-950/30 dark:border-rose-500'
                      : 'border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] hover:border-stone-400'
                  }`}
                >
                  <span className="font-amiri text-lg md:text-xl font-bold text-stone-900 dark:text-white">
                    {phrase.text}
                  </span>
                  <Volume2
                    className={`w-4 h-4 shrink-0 ${
                      isCurrent ? 'text-[#881337] dark:text-rose-400' : 'text-stone-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'guide' && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prayerSteps.map((step, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 space-y-2"
            >
              <div className="flex items-center gap-2 text-[#0F5132] dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
