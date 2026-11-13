import React, { useState, useEffect } from 'react';
import {
  Search,
  Heart,
  Copy,
  Check,
  Volume2,
  Square,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Quote,
  X,
} from 'lucide-react';
import { DUAS_DATA, HADITHS_DATA } from '../data/duasData';
import { DuaItem, HadithItem } from '../types';
import { speakArabicText, stopArabicSpeech } from '../utils/audioEngine';

export const DuasView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'duas' | 'hadiths'>('duas');
  const [selectedCategory, setSelectedCategory] = useState<'الكل' | 'أدعية' | 'زيارات' | 'مناجاة' | 'المفضلة'>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDua, setActiveDua] = useState<DuaItem>(DUAS_DATA[0]);
  const [activeHadithModal, setActiveHadithModal] = useState<HadithItem | null>(null);
  const [fontSize, setFontSize] = useState<number>(22);
  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('husayni_fav_duas');
      return saved ? JSON.parse(saved) : ['kumayl', 'ashura'];
    } catch {
      return ['kumayl', 'ashura'];
    }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeParagraphIdx, setActiveParagraphIdx] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('husayni_fav_duas', JSON.stringify(favorites));
    } catch {
      // Ignore storage errors
    }
  }, [favorites]);

  useEffect(() => {
    return () => {
      stopArabicSpeech();
    };
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredDuas = DUAS_DATA.filter((item) => {
    const matchesSearch =
      item.title.includes(searchQuery.trim()) ||
      item.occasion.includes(searchQuery.trim()) ||
      item.intro.includes(searchQuery.trim());
    if (!matchesSearch) return false;
    if (selectedCategory === 'الكل') return true;
    if (selectedCategory === 'المفضلة') return favorites.includes(item.id);
    return item.category === selectedCategory;
  });

  const filteredHadiths = HADITHS_DATA.filter((h) => {
    const q = searchQuery.trim();
    return !q || h.title.includes(q) || h.arabicText.includes(q) || h.narrator.includes(q);
  });

  const handleCopy = async (textToCopy?: string) => {
    const fullText =
      textToCopy || `${activeDua.title}\n\n${activeDua.paragraphs.join('\n\n')}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleReadParagraphs = (startIndex = 0) => {
    if (isSpeaking && startIndex === 0) {
      stopArabicSpeech();
      setIsSpeaking(false);
      setActiveParagraphIdx(null);
      return;
    }

    const playNext = (idx: number) => {
      if (idx >= activeDua.paragraphs.length) {
        setIsSpeaking(false);
        setActiveParagraphIdx(null);
        return;
      }
      setIsSpeaking(true);
      setActiveParagraphIdx(idx);
      const started = speakArabicText(activeDua.paragraphs[idx], {
        rate: 0.84,
        onEnd: () => playNext(idx + 1),
        onError: () => {
          setIsSpeaking(false);
          setActiveParagraphIdx(null);
        },
      });
      if (!started) {
        setIsSpeaking(false);
        setActiveParagraphIdx(null);
      }
    };

    playNext(startIndex);
  };

  const handleSelectDua = (dua: DuaItem) => {
    stopArabicSpeech();
    setIsSpeaking(false);
    setActiveParagraphIdx(null);
    setActiveDua(dua);
  };

  const categories: Array<'الكل' | 'أدعية' | 'زيارات' | 'مناجاة' | 'المفضلة'> = [
    'الكل',
    'أدعية',
    'زيارات',
    'مناجاة',
    'المفضلة',
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Mode Switch */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
            الأدعية والزيارات والأحاديث الموثقة
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('duas')}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'duas'
                  ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                  : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
              }`}
            >
              الأدعية والزيارات ({DUAS_DATA.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('hadiths')}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                viewMode === 'hadiths'
                  ? 'bg-[#881337] text-white dark:bg-rose-700'
                  : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
              }`}
            >
              الأحاديث النبوية وأهل البيت ({HADITHS_DATA.length})
            </button>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === 'duas' ? 'ابحث عن دعاء أو زيارة...' : 'ابحث في الأحاديث...'}
            className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/40"
          />
        </div>
      </div>

      {viewMode === 'duas' ? (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                    : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <aside className="lg:col-span-4 space-y-2.5">
              {filteredDuas.length === 0 ? (
                <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 text-center text-sm text-stone-500 dark:text-stone-400">
                  لا توجد نتائج مطابقة لبحثك.
                </div>
              ) : (
                filteredDuas.map((dua) => {
                  const isSelected = activeDua.id === dua.id;
                  const isFav = favorites.includes(dua.id);
                  return (
                    <div
                      key={dua.id}
                      className={`rounded-2xl border transition-colors p-4 flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#0F5132] dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] hover:border-stone-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectDua(dua)}
                        className="flex-1 text-right cursor-pointer min-h-[44px] flex flex-col justify-center"
                      >
                        <h2 className="font-amiri text-lg font-bold text-stone-900 dark:text-white">
                          {dua.title}
                        </h2>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          {dua.category} · {dua.occasion}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(dua.id)}
                        aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isFav ? 'fill-rose-600 text-rose-600' : 'text-stone-400'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </aside>

            <article className="lg:col-span-8 rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <BookOpen className="w-3.5 h-3.5 text-[#0F5132] dark:text-emerald-400" />
                    <span>{activeDua.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeDua.source}</span>
                  </div>
                  <h2 className="font-amiri text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                    {activeDua.title}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReadParagraphs(0)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                      isSpeaking
                        ? 'bg-rose-700 text-white hover:bg-rose-800'
                        : 'bg-[#0F5132] text-white hover:bg-[#0B3D26] dark:bg-emerald-600'
                    }`}
                  >
                    {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span>{isSpeaking ? 'إيقاف القراءة' : 'قراءة صوتية'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.max(16, s - 2))}
                    aria-label="تصغير الخط"
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.min(34, s + 2))}
                    aria-label="تكبير الخط"
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy()}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed bg-[#FAF8F4] dark:bg-[#0B1117] p-4 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37]">
                {activeDua.intro}
              </p>

              <div className="space-y-5">
                {activeDua.paragraphs.map((para, idx) => {
                  const isHighlighted = activeParagraphIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleReadParagraphs(idx)}
                      style={{ fontSize: `${fontSize}px`, lineHeight: 2 }}
                      className={`w-full text-right font-amiri rounded-xl p-4 transition-colors cursor-pointer block ${
                        isHighlighted
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#0F5132] dark:text-emerald-200 border border-[#0F5132]/30'
                          : 'text-stone-900 dark:text-stone-100 hover:bg-stone-50/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {para}
                    </button>
                  );
                })}
              </div>
            </article>
          </div>
        </>
      ) : (
        /* Verified Hadiths Grid - Clicking any opens its window */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredHadiths.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => {
                setActiveHadithModal(h);
                setCopied(false);
              }}
              className="text-right rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 space-y-3 hover:border-[#881337]/60 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#881337] dark:text-rose-400">
                  <Quote className="w-4 h-4" />
                  <span>{h.narrator}</span>
                </div>
                <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                  {h.title}
                </h2>
                <p className="font-amiri text-xl text-stone-800 dark:text-stone-200 leading-relaxed line-clamp-3">
                  {h.arabicText}
                </p>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 pt-2">
                المصدر: {h.source} · اضغط لفتح نافذة الحديث
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Hadith Modal Window */}
      {activeHadithModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveHadithModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
              <div>
                <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
                  {activeHadithModal.narrator}
                </p>
                <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                  {activeHadithModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveHadithModal(null)}
                aria-label="إغلاق نافذة الحديث"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-6">
              <p className="font-amiri text-2xl md:text-3xl leading-[2.1] text-stone-900 dark:text-white">
                {activeHadithModal.arabicText}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#0F5132] dark:text-emerald-400">
                الشرح والفائدة:
              </p>
              <p className="text-sm md:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                {activeHadithModal.explanation}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 pt-1">
                المصدر: {activeHadithModal.source}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E7E1D6] dark:border-[#1F2B37]">
              <button
                type="button"
                onClick={() => speakArabicText(activeHadithModal.arabicText, { rate: 0.82 })}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>قراءة الحديث</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `${activeHadithModal.title}\n${activeHadithModal.narrator}\n${activeHadithModal.arabicText}\n(${activeHadithModal.source})`
                  )
                }
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ' : 'نسخ الحديث'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
