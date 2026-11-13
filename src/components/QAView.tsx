import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Copy, Check, HelpCircle } from 'lucide-react';
import { QA_DATA } from '../data/qaAndQuizData';

export const QAView: React.FC = () => {
  const [category, setCategory] = useState<'الكل' | 'فقهية' | 'عقائدية' | 'قرآنية' | 'منطق ونحو'>('الكل');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string>(QA_DATA[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories: Array<'الكل' | 'فقهية' | 'عقائدية' | 'قرآنية' | 'منطق ونحو'> = [
    'الكل',
    'فقهية',
    'عقائدية',
    'قرآنية',
    'منطق ونحو',
  ];

  const filtered = QA_DATA.filter((item) => {
    const matchesCat = category === 'الكل' || item.category === category;
    const q = search.trim();
    const matchesQuery = !q || item.question.includes(q) || item.answer.includes(q);
    return matchesCat && matchesQuery;
  });

  const handleCopyQA = async (id: string, question: string, answer: string, reference: string) => {
    try {
      await navigator.clipboard.writeText(`${question}\n\nالإجابة:\n${answer}\n\nالمصدر: ${reference}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
            الأسئلة والأجوبة العلمية والدينية
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            إجابات ميسّرة وموثقة في المسائل الفقهية والعقائدية والقرآنية واللغوية
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الأسئلة والأجوبة..."
            className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/40"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              category === cat
                ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-8 text-center text-sm text-stone-500 dark:text-stone-400">
            لا توجد أسئلة مطابقة لبحثك.
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = openId === item.id;
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? '' : item.id)}
                  className="w-full text-right p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors min-h-[64px]"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-[#0F5132] dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block">
                        مسألة {item.category}
                      </span>
                      <h2 className="text-sm md:text-base font-bold text-stone-900 dark:text-white leading-snug">
                        {item.question}
                      </h2>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-stone-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-3 border-t border-[#E7E1D6] dark:border-[#1F2B37] space-y-4">
                    <p className="text-sm md:text-base text-stone-800 dark:text-stone-200 leading-[1.9]">
                      {item.answer}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        المصدر: {item.reference}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyQA(item.id, item.question, item.answer, item.reference)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span>{copiedId === item.id ? 'تم النسخ' : 'نسخ الفائدة'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
