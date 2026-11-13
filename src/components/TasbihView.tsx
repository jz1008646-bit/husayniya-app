import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, CheckCircle2, Sparkles } from 'lucide-react';
import { playTasbihClick, playPhaseCompleteChime } from '../utils/audioEngine';

interface TasbihViewProps {
  dailyTotal: number;
  onIncrementDaily: () => void;
}

interface DhikrPreset {
  id: string;
  title: string;
  arabic: string;
  target: number;
  isZahra?: boolean;
}

const DHIKR_PRESETS: DhikrPreset[] = [
  {
    id: 'zahra',
    title: 'تسبيحة السيدة الزهراء (عليها السلام)',
    arabic: 'اللَّهُ أَكْبَرُ (٣٤) · الْحَمْدُ لِلَّهِ (٣٣) · سُبْحَانَ اللَّهِ (٣٣)',
    target: 100,
    isZahra: true,
  },
  {
    id: 'salawat',
    title: 'الصلوات المحمدية',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ',
    target: 100,
  },
  {
    id: 'istighfar',
    title: 'الاستغفار والتوبة',
    arabic: 'أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ',
    target: 70,
  },
  {
    id: 'hawqala',
    title: 'التوكل والتفويض',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    target: 33,
  },
  {
    id: 'husayn',
    title: 'نداء كربلاء',
    arabic: 'يَا أَبَا عَبْدِ اللَّهِ الْحُسَيْنُ عَلَيْكَ السَّلَامُ',
    target: 100,
  },
];

export const TasbihView: React.FC<TasbihViewProps> = ({ dailyTotal, onIncrementDaily }) => {
  const [selectedPreset, setSelectedPreset] = useState<DhikrPreset>(DHIKR_PRESETS[0]);
  const [count, setCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [completedMessage, setCompletedMessage] = useState<string>('');

  const getZahraPhase = (c: number) => {
    if (c < 34) {
      return {
        label: 'اللَّهُ أَكْبَرُ',
        phaseCount: c,
        phaseTarget: 34,
        stepName: 'المرحلة الأولى من ٣',
      };
    }
    if (c < 67) {
      return {
        label: 'الْحَمْدُ لِلَّهِ',
        phaseCount: c - 34,
        phaseTarget: 33,
        stepName: 'المرحلة الثانية من ٣',
      };
    }
    return {
      label: 'سُبْحَانَ اللَّهِ',
      phaseCount: Math.min(c - 67, 33),
      phaseTarget: 33,
      stepName: 'المرحلة الثالثة من ٣',
    };
  };

  const zahraInfo = selectedPreset.isZahra ? getZahraPhase(count) : null;
  const activeDisplayText = zahraInfo ? zahraInfo.label : selectedPreset.arabic;
  const activeNumerator = zahraInfo ? zahraInfo.phaseCount : count;
  const activeDenominator = zahraInfo ? zahraInfo.phaseTarget : selectedPreset.target;

  const progress = Math.min(1, count / selectedPreset.target);
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const handleTap = () => {
    if (soundEnabled) {
      playTasbihClick();
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }

    const nextCount = count + 1;
    onIncrementDaily();

    if (selectedPreset.isZahra) {
      if (nextCount === 34 || nextCount === 67 || nextCount === 100) {
        if (soundEnabled) playPhaseCompleteChime();
      }
      if (nextCount >= 100) {
        setCount(100);
        setCompletedMessage('تقبل الله طاعتكم، أتممتم تسبيحة السيدة فاطمة الزهراء (عليها السلام).');
        return;
      }
    } else if (nextCount >= selectedPreset.target) {
      if (soundEnabled) playPhaseCompleteChime();
      setCount(selectedPreset.target);
      setCompletedMessage(`أتممتم ${selectedPreset.target} تسبيحة بنجاح.`);
      return;
    }

    setCompletedMessage('');
    setCount(nextCount);
  };

  const handleReset = () => {
    setCount(0);
    setCompletedMessage('');
  };

  const handleSelectPreset = (preset: DhikrPreset) => {
    setSelectedPreset(preset);
    setCount(0);
    setCompletedMessage('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
            التسبيحات والمسبحة الإلكترونية
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            تسبيحة السيدة فاطمة الزهراء (عليها السلام) والأذكار المأثورة بعد كل صلاة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            <span>{soundEnabled ? 'الصوت مفعل' : 'الصوت صامت'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تصفير</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Presets Sidebar */}
        <aside className="lg:col-span-4 space-y-2.5">
          {DHIKR_PRESETS.map((preset) => {
            const active = selectedPreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`w-full text-right p-4 rounded-2xl border transition-colors cursor-pointer min-h-[64px] ${
                  active
                    ? 'border-[#0F5132] dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] hover:bg-stone-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-stone-900 dark:text-white">
                    {preset.title}
                  </p>
                  <span className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400 tabular-nums">
                    {preset.target}
                  </span>
                </div>
                <p className="font-amiri text-base text-stone-600 dark:text-stone-400 mt-1">
                  {preset.arabic}
                </p>
              </button>
            );
          })}
        </aside>

        {/* Main Interactive Subha Dial */}
        <section className="lg:col-span-8 rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-10 flex flex-col items-center text-center space-y-6">
          <div className="space-y-1.5 max-w-xl">
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              {zahraInfo ? `${selectedPreset.title} · ${zahraInfo.stepName}` : selectedPreset.title}
            </p>
            <h2 className="font-amiri text-3xl md:text-4xl font-bold text-[#0F5132] dark:text-emerald-400">
              {activeDisplayText}
            </h2>
          </div>

          {/* Interactive SVG Progress Ring + Tactile Counter Button */}
          <button
            type="button"
            onClick={handleTap}
            aria-label="اضغط للتسبيح"
            className="relative w-60 h-60 rounded-full flex items-center justify-center cursor-pointer select-none active:scale-[0.97] transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          >
            <svg className="w-60 h-60 -rotate-90" viewBox="0 0 240 240">
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-stone-200 dark:text-slate-800"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-[#0F5132] dark:text-emerald-500 transition-[stroke-dashoffset] duration-150"
              />
            </svg>

            <div className="absolute inset-5 rounded-full bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] flex flex-col items-center justify-center shadow-inner">
              <span className="text-5xl font-bold tabular-nums text-stone-900 dark:text-white">
                {activeNumerator}
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1 tabular-nums">
                من {activeDenominator}
              </span>
              <span className="text-[11px] font-semibold text-[#0F5132] dark:text-emerald-400 mt-3 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>اضغط للتسبيح</span>
              </span>
            </div>
          </button>

          {completedMessage && (
            <div className="w-full max-w-md rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-[#0F5132]/30 p-3.5 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-[#0F5132] dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{completedMessage}</span>
            </div>
          )}

          {/* Metrics Row */}
          <div className="w-full max-w-md grid grid-cols-2 gap-4 pt-4 border-t border-[#E7E1D6] dark:border-[#1F2B37]">
            <div className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117]">
              <p className="text-xs text-stone-500 dark:text-stone-400">المجموع في هذه الجلسة</p>
              <p className="text-xl font-bold tabular-nums text-stone-900 dark:text-white mt-0.5">
                {count} / {selectedPreset.target}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117]">
              <p className="text-xs text-stone-500 dark:text-stone-400">إجمالي تسبيحات اليوم</p>
              <p className="text-xl font-bold tabular-nums text-[#0F5132] dark:text-emerald-400 mt-0.5">
                {dailyTotal}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
