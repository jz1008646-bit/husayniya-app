import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, RotateCcw, ListChecks, ChevronDown, ChevronUp } from 'lucide-react';
import { NAWAFIL_DATA } from '../data/nawafilData';

export const NawafilView: React.FC = () => {
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('husayni_nawafil_today');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expandedId, setExpandedId] = useState<string>(NAWAFIL_DATA[0].id);

  useEffect(() => {
    try {
      localStorage.setItem('husayni_nawafil_today', JSON.stringify(completedIds));
    } catch {
      // Ignore storage error
    }
  }, [completedIds]);

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Compute total completed rakahs (note: Wateera is 2 rakahs seated counted as 1 in the 51 total, or display actual rakahs)
  const completedRakahs = NAWAFIL_DATA.reduce((sum, item) => {
    if (!completedIds.includes(item.id)) return sum;
    return sum + (item.id === 'nafila_isha' ? 1 : item.rakahs);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
            النوافل اليومية وصلاة الليل
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            مجموع الصلوات اليومية في مذهب أهل البيت ٥١ ركعة (١٧ ركعة فريضة + ٣٤ ركعة نافلة)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCompletedIds([])}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800 self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تصفير سجل اليوم</span>
        </button>
      </div>

      {/* Daily Progress Summary Bar */}
      <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-[#0F5132] dark:text-emerald-400" />
            <h2 className="text-base font-bold text-stone-900 dark:text-white">
              إنجاز النوافل اليوم
            </h2>
          </div>
          <span className="text-sm font-bold tabular-nums text-[#0F5132] dark:text-emerald-400">
            {completedRakahs} / 34 ركعة
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-[#0F5132] dark:bg-emerald-500 transition-all duration-300"
            style={{ width: `${Math.min(100, (completedRakahs / 34) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          تُحسب نافلة العشاء (الوتيرة) ركعتين من جلوس وتعدّان بركعة واحدة في حساب الـ ٣٤ ركعة نافلة.
        </p>
      </section>

      {/* Nawafil List */}
      <div className="space-y-3">
        {NAWAFIL_DATA.map((item) => {
          const isDone = completedIds.includes(item.id);
          const isExpanded = expandedId === item.id;

          return (
            <article
              key={item.id}
              className={`rounded-2xl border transition-colors bg-white dark:bg-[#121A22] ${
                isDone
                  ? 'border-[#0F5132]/50 dark:border-emerald-600/50'
                  : 'border-[#E7E1D6] dark:border-[#1F2B37]'
              }`}
            >
              <div className="p-4 md:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleCompleted(item.id)}
                    aria-label={isDone ? 'إلغاء الإنجاز' : 'تحديد كمنجزة'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                  >
                    {isDone ? (
                      <CheckSquare className="w-6 h-6 text-[#0F5132] dark:text-emerald-400" />
                    ) : (
                      <Square className="w-6 h-6 text-stone-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? '' : item.id)}
                    className="flex-1 text-right cursor-pointer min-h-[44px] flex flex-col justify-center"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-amiri text-xl font-bold text-stone-900 dark:text-white">
                        {item.name}
                      </h3>
                      <span className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400 tabular-nums">
                        · {item.rakahs} ركعات
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {item.timing}
                    </p>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? '' : item.id)}
                  aria-label="عرض التفاصيل"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-500" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="px-6 pb-6 pt-3 border-t border-[#E7E1D6] dark:border-[#1F2B37] space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117]">
                      <p className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        الكيفية:
                      </p>
                      <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        {item.method}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117]">
                      <p className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                        الفضل والثواب:
                      </p>
                      <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                        {item.virtue}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      خطوات الأداء:
                    </p>
                    <ul className="space-y-1.5 text-sm text-stone-700 dark:text-stone-300 list-disc list-inside">
                      {item.steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};
