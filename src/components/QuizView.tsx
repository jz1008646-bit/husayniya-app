import React, { useState, useEffect } from 'react';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RotateCcw,
  Award,
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/qaAndQuizData';

type QuizCategory =
  | 'الكل'
  | 'واقعة الطف'
  | 'القرآن والسيرة'
  | 'الفقه والعقيدة'
  | 'المنطق والنحو';

export const QuizView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>('الكل');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('husayni_quiz_best') || 0);
    } catch {
      return 0;
    }
  });

  const activeQuestions =
    selectedCategory === 'الكل'
      ? QUIZ_QUESTIONS
      : QUIZ_QUESTIONS.filter((q) => q.category === selectedCategory);

  const currentQ = activeQuestions[currentIdx];

  useEffect(() => {
    if (finished && score > bestScore) {
      setBestScore(score);
      try {
        localStorage.setItem('husayni_quiz_best', String(score));
      } catch {
        // Ignore storage error
      }
    }
  }, [finished, score, bestScore]);

  const handleCategoryChange = (cat: QuizCategory) => {
    setSelectedCategory(cat);
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
  };

  const handleAnswer = (optionIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);
    if (optionIdx === currentQ.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= activeQuestions.length) {
      setFinished(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
  };

  const categories: QuizCategory[] = [
    'الكل',
    'واقعة الطف',
    'القرآن والسيرة',
    'الفقه والعقيدة',
    'المنطق والنحو',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
            المسابقات الثقافية والعلمية
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            اختبر معلوماتك في سيرة أهل البيت وواقعة الطف والقرآن والفقه والمنطق والنحو
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
          <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="tabular-nums">أعلى نتيجة مسجلة: {bestScore}</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              selectedCategory === cat
                ? 'bg-[#881337] text-white dark:bg-rose-700'
                : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {finished ? (
        <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-8 md:p-12 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
              انتهت المسابقة بنجاح
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400">
              القسم: {selectedCategory}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] inline-block min-w-[220px]">
            <p className="text-xs text-stone-500 dark:text-stone-400">النتيجة النهائية</p>
            <p className="text-4xl font-bold tabular-nums text-[#0F5132] dark:text-emerald-400 mt-1">
              {score} / {activeQuestions.length}
            </p>
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 mt-2">
              {score >= activeQuestions.length * 0.8
                ? 'مستوى ممتاز ومبارك'
                : score >= activeQuestions.length * 0.5
                ? 'مستوى جيد، واصل المطالعة'
                : 'بداية طيبة، راجع الدروس وحاول مجدداً'}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleRestart}
              className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة المسابقة</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8 space-y-6 max-w-3xl mx-auto">
          {/* Progress Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400 tabular-nums">
              <span>
                السؤال {currentIdx + 1} من {activeQuestions.length} · {currentQ.category}
              </span>
              <span className="text-[#0F5132] dark:text-emerald-400">
                النقاط: {score}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[#0F5132] dark:bg-emerald-500 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <h2 className="font-amiri text-2xl md:text-3xl font-bold text-stone-900 dark:text-white leading-snug">
            {currentQ.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isAnswered = selectedOption !== null;
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnClass =
                'border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] hover:border-[#0F5132]/60 text-stone-900 dark:text-stone-100';

              if (isAnswered) {
                if (isCorrect) {
                  btnClass =
                    'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                } else if (isSelected && !isCorrect) {
                  btnClass =
                    'border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                } else {
                  btnClass =
                    'border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4]/50 dark:bg-[#0B1117]/50 text-stone-400 dark:text-stone-500';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full min-h-[52px] text-right p-4 rounded-xl border text-sm md:text-base font-semibold flex items-center justify-between gap-3 transition-colors ${
                    isAnswered ? 'cursor-default' : 'cursor-pointer'
                  } ${btnClass}`}
                >
                  <span>{option}</span>
                  {isAnswered && isCorrect && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>إجابة صحيحة</span>
                    </span>
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 shrink-0">
                      <XCircle className="w-5 h-5" />
                      <span>غير صحيحة</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Button */}
          {selectedOption !== null && (
            <div className="pt-4 border-t border-[#E7E1D6] dark:border-[#1F2B37] space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                <span className="font-bold text-amber-900 dark:text-amber-300">الفائدة العلمية: </span>
                {currentQ.explanation}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span>
                    {currentIdx + 1 >= activeQuestions.length ? 'عرض النتيجة' : 'السؤال التالي'}
                  </span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
