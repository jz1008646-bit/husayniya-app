import React, { useState, useMemo } from 'react';
import {
  BookMarked,
  Search,
  X,
  Layers,
  List,
  Quote,
  GraduationCap,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { LIBRARY_BOOKS_DATA } from '../data/libraryData';
import { LIBRARY_FULL_CHAPTERS } from '../data/libraryFullChapters';
import { LibraryBook } from '../types';
import booksImg from '../assets/images/scholars_hawza_books_1794597211186.jpg';

export const LibraryView: React.FC = () => {
  const [stageFilter, setStageFilter] = useState<'الكل' | LibraryBook['stage']>('الكل');
  const [search, setSearch] = useState('');
  const [activeBook, setActiveBook] = useState<LibraryBook | null>(null);
  const [readerTab, setReaderTab] = useState<'overview' | 'read'>('read');
  const [chapterIndex, setChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [imgError, setImgError] = useState(false);

  const stages: Array<'الكل' | LibraryBook['stage']> = [
    'الكل',
    'المقدمات',
    'السطوح',
    'البحث الخارج',
    'الحديث والتفسير',
    'الأخلاق والأدعية',
  ];

  const filtered = LIBRARY_BOOKS_DATA.filter((book) => {
    const matchesStage = stageFilter === 'الكل' || book.stage === stageFilter;
    const q = search.trim();
    const matchesSearch =
      !q ||
      book.title.includes(q) ||
      book.author.includes(q) ||
      book.subject.includes(q) ||
      book.description.includes(q);
    return matchesStage && matchesSearch;
  });

  const activeFullChapters = useMemo(() => {
    if (!activeBook) return [];
    return activeBook.fullChapters || LIBRARY_FULL_CHAPTERS[activeBook.id] || [];
  }, [activeBook]);

  const handleOpenBook = (book: LibraryBook) => {
    setActiveBook(book);
    setChapterIndex(0);
    setReaderTab((book.fullChapters || LIBRARY_FULL_CHAPTERS[book.id]) ? 'read' : 'overview');
  };

  const fontClass =
    fontSize === 'base'
      ? 'text-base leading-[2]'
      : fontSize === 'lg'
      ? 'text-lg leading-[2.1]'
      : 'text-xl md:text-2xl leading-[2.15]';

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden">
        <div className="lg:col-span-5 relative min-h-[190px] bg-[#182620]">
          {!imgError ? (
            <img
              src={booksImg}
              alt="المكتبة والمناهج الحوزوية"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F5132] to-[#1C1917]">
              <BookMarked className="w-16 h-16 text-amber-300/40" />
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
              خزانة التراث والمنهج الحوزوي · {LIBRARY_BOOKS_DATA.length} كتاباً بنصوص وفصول كاملة
            </p>
            <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
              المكتبة والكتب الحوزوية الكاملة
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              موسوعة الكتب الدراسية الكاملة في مراحل المقدمات والسطوح والبحث الخارج، وأمهات مصادر الحديث والتفسير والأخلاق ونهج البلاغة والصحيفة السجادية. اضغط على أي كتاب لفتح قارئ الفصول الكامل.
            </p>
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن كتاب أو مؤلف..."
              className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/40"
            />
          </div>
        </div>
      </div>

      {/* Stages Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {stages.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStageFilter(st)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              stageFilter === st
                ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-8 text-center text-sm text-stone-500">
            لا توجد كتب مطابقة لبحثك.
          </div>
        ) : (
          filtered.map((book) => {
            const chapterCount = (book.fullChapters || LIBRARY_FULL_CHAPTERS[book.id] || []).length;
            return (
              <button
                key={book.id}
                type="button"
                onClick={() => handleOpenBook(book)}
                className="text-right rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-5 hover:border-[#0F5132]/60 transition-all cursor-pointer flex flex-col justify-between space-y-4 min-h-[205px]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                    <span className="font-semibold text-[#0F5132] dark:text-emerald-400">
                      {book.stage}
                    </span>
                    <span className="tabular-nums">
                      {book.volumes} · {chapterCount} فصول كاملة
                    </span>
                  </div>
                  <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white leading-snug">
                    {book.title}
                  </h2>
                  <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                    تأليف: {book.author}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                    {book.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-between text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                  <span>{book.subject}</span>
                  <span>قراءة الكتاب كاملاً ←</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Full Book Reader & Overview Modal */}
      {activeBook && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveBook(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-[#E7E1D6] dark:border-[#1F2B37] flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {activeBook.stage} · {activeBook.subject} · {activeBook.volumes}
                  </span>
                </p>
                <h3 className="font-amiri text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                  {activeBook.title}
                </h3>
                <p className="text-xs md:text-sm font-medium text-stone-600 dark:text-stone-300">
                  المؤلف: {activeBook.author}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBook(null)}
                aria-label="إغلاق نافذة الكتاب"
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher + Font Controls */}
            <div className="px-5 md:px-6 py-3 bg-[#FAF8F4] dark:bg-[#0B1117] border-b border-[#E7E1D6] dark:border-[#1F2B37] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReaderTab('read')}
                  className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    readerTab === 'read'
                      ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                      : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37]'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>قراءة فصول الكتاب ({activeFullChapters.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReaderTab('overview')}
                  className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    readerTab === 'overview'
                      ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                      : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37]'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>البطاقة والفهرس</span>
                </button>
              </div>

              {readerTab === 'read' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFontSize((prev) => (prev === 'xl' ? 'lg' : 'base'))}
                    aria-label="تصغير الخط"
                    className="min-w-[38px] min-h-[38px] rounded-lg border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] flex items-center justify-center cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize((prev) => (prev === 'base' ? 'lg' : 'xl'))}
                    aria-label="تكبير الخط"
                    className="min-w-[38px] min-h-[38px] rounded-lg border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] flex items-center justify-center cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
              {readerTab === 'read' && activeFullChapters.length > 0 ? (
                <div className="space-y-6">
                  {/* Chapter Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {activeFullChapters.map((ch, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setChapterIndex(idx)}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          chapterIndex === idx
                            ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                            : 'bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {idx + 1}. {ch.title}
                      </button>
                    ))}
                  </div>

                  {/* Active Chapter Full Text */}
                  <article className="rounded-2xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-6 md:p-8 space-y-4">
                    <h4 className="font-amiri text-2xl font-bold text-[#0F5132] dark:text-emerald-400">
                      {activeFullChapters[chapterIndex]?.title}
                    </h4>
                    <div
                      className={`font-amiri text-stone-900 dark:text-stone-100 whitespace-pre-wrap ${fontClass}`}
                    >
                      {activeFullChapters[chapterIndex]?.content}
                    </div>
                  </article>

                  {/* Chapter Navigation */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      disabled={chapterIndex <= 0}
                      onClick={() => setChapterIndex((i) => Math.max(0, i - 1))}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>الفصل السابق</span>
                    </button>

                    <span className="text-xs font-semibold text-stone-500 tabular-nums">
                      الفصل {chapterIndex + 1} من {activeFullChapters.length}
                    </span>

                    <button
                      type="button"
                      disabled={chapterIndex >= activeFullChapters.length - 1}
                      onClick={() =>
                        setChapterIndex((i) => Math.min(activeFullChapters.length - 1, i + 1))
                      }
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <span>الفصل التالي</span>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
                      <span>التعريف بالكتاب وموقعه في المنهج</span>
                    </p>
                    <p className="text-sm md:text-base text-stone-700 dark:text-stone-300 leading-relaxed">
                      {activeBook.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <List className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
                      <span>أبرز الأبواب والفصول</span>
                    </p>
                    <ul className="space-y-1.5 text-sm text-stone-700 dark:text-stone-300 list-disc list-inside bg-[#FAF8F4] dark:bg-[#0B1117] p-4 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37]">
                      {activeBook.chapters.map((ch, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {ch}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 space-y-1">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Quote className="w-4 h-4" />
                      <span>مقتبس من الكتاب</span>
                    </p>
                    <p className="font-amiri text-xl text-stone-900 dark:text-white leading-relaxed">
                      {activeBook.excerpt}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
