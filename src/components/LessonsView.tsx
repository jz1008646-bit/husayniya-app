import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Compass,
  Brain,
  Languages,
  CheckCircle2,
  Circle,
  GraduationCap,
} from 'lucide-react';
import { DISCIPLINE_META, LESSONS_DATA } from '../data/lessonsData';
import { LessonDiscipline, LessonItem } from '../types';
import hawzaStudyHallImg from '../assets/images/hawza_study_hall_1794596208986.jpg';

interface LessonsViewProps {
  completedLessons: string[];
  onToggleComplete: (lessonId: string) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  completedLessons,
  onToggleComplete,
}) => {
  const [activeDiscipline, setActiveDiscipline] = useState<LessonDiscipline>('fiqh');
  const disciplineLessons = LESSONS_DATA.filter((l) => l.discipline === activeDiscipline);
  const [selectedLesson, setSelectedLesson] = useState<LessonItem>(disciplineLessons[0]);
  const [imgError, setImgError] = useState(false);

  const handleSelectDiscipline = (discipline: LessonDiscipline) => {
    setActiveDiscipline(discipline);
    const list = LESSONS_DATA.filter((l) => l.discipline === discipline);
    if (list.length > 0) {
      setSelectedLesson(list[0]);
    }
  };

  const disciplines: Array<{
    id: LessonDiscipline;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'fiqh', label: 'الفقه', icon: <Scale className="w-4 h-4" /> },
    { id: 'aqeedah', label: 'العقيدة', icon: <Compass className="w-4 h-4" /> },
    { id: 'logic', label: 'المنطق', icon: <Brain className="w-4 h-4" /> },
    { id: 'nahw', label: 'النحو', icon: <Languages className="w-4 h-4" /> },
  ];

  const meta = DISCIPLINE_META[activeDiscipline];
  const isCompleted = completedLessons.includes(selectedLesson.id);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden">
        <div className="lg:col-span-5 relative min-h-[180px] bg-[#182620]">
          {!imgError ? (
            <img
              src={hawzaStudyHallImg}
              alt="مكتبة الدروس الحوزوية"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0F5132] to-[#1C1917]">
              <GraduationCap className="w-16 h-16 text-amber-300/40" />
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
              المعهد العلمي · المنهج الحوزوي الميسر
            </p>
            <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
              دروس الفقه والعقيدة والمنطق والنحو
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              دروس منهجية مركزة تجمع بين الأصالة الحوزوية ووضوح العرض التربوي لبناء الأساس العلمي المتين.
            </p>
          </div>

          {/* 4 Disciplines Segmented Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {disciplines.map((d) => {
              const active = activeDiscipline === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleSelectDiscipline(d.id)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                      : 'bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {d.icon}
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Discipline Subtitle & Progress */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">
            {meta.title} — <span className="font-normal text-stone-600 dark:text-stone-400">{meta.subtitle}</span>
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400 tabular-nums">
          الدروس المنجزة: {completedLessons.length} من {LESSONS_DATA.length}
        </span>
      </div>

      {/* Lessons Sidebar + Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-4 space-y-2.5">
          {disciplineLessons.map((lesson) => {
            const active = selectedLesson.id === lesson.id;
            const done = completedLessons.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedLesson(lesson)}
                className={`w-full text-right p-4 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-3 min-h-[72px] ${
                  active
                    ? 'border-[#0F5132] dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] hover:bg-stone-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#0F5132] dark:text-emerald-400">
                    {lesson.number} · {lesson.duration}
                  </p>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white leading-snug">
                    {lesson.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{lesson.level}</p>
                </div>

                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-[#0F5132] dark:text-emerald-400 shrink-0 mt-1" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600 shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Lesson Content Reader */}
        <article className="lg:col-span-8 rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
            <div className="space-y-1">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {meta.title} · {selectedLesson.number} · {selectedLesson.level}
              </p>
              <h2 className="font-amiri text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                {selectedLesson.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onToggleComplete(selectedLesson.id)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shrink-0 ${
                isCompleted
                  ? 'bg-emerald-50 text-[#0F5132] border border-[#0F5132]/30 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-[#0F5132] text-white hover:bg-[#0B3D26] dark:bg-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'مكتمل (اضغط للإلغاء)' : 'إتمام الدرس'}</span>
            </button>
          </div>

          <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-[#FAF8F4] dark:bg-[#0B1117] p-4 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37]">
            {selectedLesson.summary}
          </p>

          <div className="space-y-6">
            {selectedLesson.sections.map((sec, idx) => (
              <div key={idx} className="space-y-2.5">
                <h3 className="text-base md:text-lg font-bold text-[#0F5132] dark:text-emerald-400">
                  {sec.heading}
                </h3>
                <p className="text-sm md:text-base text-stone-800 dark:text-stone-200 leading-[1.9]">
                  {sec.body}
                </p>
                {sec.example && (
                  <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-950 dark:text-amber-200 leading-relaxed">
                    {sec.example}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary Key Takeaway */}
          <div className="pt-5 border-t border-[#E7E1D6] dark:border-[#1F2B37]">
            <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F5132] dark:text-emerald-400">
                <BookOpen className="w-4 h-4" />
                <span>الخلاصة العلمية</span>
              </div>
              <p className="text-sm font-medium text-stone-800 dark:text-stone-200 leading-relaxed">
                {selectedLesson.keyTakeaway}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
