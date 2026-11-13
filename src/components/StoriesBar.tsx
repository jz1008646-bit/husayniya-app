import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Trash2,
  ShieldAlert,
  Loader2,
  BookOpen,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  db,
  signInWithGoogle,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { StoryCategory, StoryItem, StoryThemeColor } from '../types';
import { moderateReligiousContent } from '../utils/apiClient';

interface StoriesBarProps {
  currentUser: User | null;
  onOpenUserProfile?: (userId: string) => void;
}

const STORY_CATEGORIES: StoryCategory[] = [
  'آية وتأمل',
  'حديث مأثور',
  'دعاء وذكر',
  'فائدة حوزوية',
  'زيارة وعتبة',
];

const THEME_STYLES: Record<StoryThemeColor, { label: string; bg: string; ring: string }> = {
  emerald: {
    label: 'زمردي',
    bg: 'bg-gradient-to-br from-[#0F5132] to-[#082E1C] text-white',
    ring: 'ring-[#0F5132] dark:ring-emerald-400',
  },
  amber: {
    label: 'ذهبي',
    bg: 'bg-gradient-to-br from-[#92400E] to-[#451A03] text-white',
    ring: 'ring-amber-600 dark:ring-amber-400',
  },
  rose: {
    label: 'حسيني',
    bg: 'bg-gradient-to-br from-[#881337] to-[#4C0519] text-white',
    ring: 'ring-[#881337] dark:ring-rose-400',
  },
  slate: {
    label: 'ليلي',
    bg: 'bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white',
    ring: 'ring-slate-600 dark:ring-slate-400',
  },
};

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${rand}`;
}

function formatStoryTime(ts: unknown): string {
  if (!ts) return 'الآن';
  try {
    const date =
      ts instanceof Timestamp
        ? ts.toDate()
        : typeof (ts as { toDate?: () => Date }).toDate === 'function'
        ? (ts as { toDate: () => Date }).toDate()
        : new Date();
    return new Intl.DateTimeFormat('ar-IQ', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'الآن';
  }
}

export const StoriesBar: React.FC<StoriesBarProps> = ({ currentUser, onOpenUserProfile }) => {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Create Story Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [category, setCategory] = useState<StoryCategory>('آية وتأمل');
  const [themeColor, setThemeColor] = useState<StoryThemeColor>('emerald');
  const [caption, setCaption] = useState('');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [moderationError, setModerationError] = useState('');

  useEffect(() => {
    const path = 'stories';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        const list: StoryItem[] = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<StoryItem, 'id'>),
          }))
          .filter((st) => {
            if (!st.expiresAt) return true;
            try {
              const expMs =
                st.expiresAt instanceof Timestamp
                  ? st.expiresAt.toMillis()
                  : typeof (st.expiresAt as { toMillis?: () => number }).toMillis === 'function'
                  ? (st.expiresAt as { toMillis: () => number }).toMillis()
                  : now + 1000;
              return expMs > now;
            } catch {
              return true;
            }
          });
        setStories(list);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, []);

  const activeStory = useMemo(
    () => (activeIndex !== null && stories[activeIndex] ? stories[activeIndex] : null),
    [activeIndex, stories]
  );

  const handleOpenCreate = async () => {
    if (!currentUser) {
      try {
        await signInWithGoogle();
      } catch {
        return;
      }
    }
    setModerationError('');
    setShowCreateModal(true);
  };

  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanCaption = caption.trim().slice(0, 500);
    const cleanRef = reference.trim().slice(0, 120);
    if (cleanCaption.length < 5) {
      setModerationError('يرجى كتابة نص ديني أو فائدة علمية لا تقل عن ٥ أحرف.');
      return;
    }

    setSubmitting(true);
    setModerationError('');

    try {
      // Strict religious content moderation check before saving
      const modData = await moderateReligiousContent(`${cleanCaption} ${cleanRef}`.trim(), 'story');

      if (!modData.allowed) {
        setModerationError(
          modData.reason ||
            'محتوى محظور: يُمنع نشر أي شيء خارج إطار الدين الإسلامي والأخلاق الحوزوية.'
        );
        setSubmitting(false);
        return;
      }

      const storyId = makeSafeId('story');
      const path = `stories/${storyId}`;
      const expiresAt = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

      await setDoc(doc(db, 'stories', storyId), {
        authorId: currentUser.uid,
        authorName: (currentUser.displayName || 'قارئ').slice(0, 80),
        category,
        caption: cleanCaption,
        reference: cleanRef,
        themeColor,
        createdAt: serverTimestamp(),
        expiresAt,
      });

      setCaption('');
      setReference('');
      setShowCreateModal(false);
    } catch (err) {
      setModerationError('تعذر نشر الستوري، يرجى التحقق من الاتصال.');
      if (err instanceof Error && err.message.includes('permission')) {
        handleFirestoreError(err, OperationType.CREATE, 'stories');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    const path = `stories/${storyId}`;
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      setActiveIndex(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  return (
    <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-white">
            الستوريات الدينية اليومية
          </h2>
          <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
            · ٢٤ ساعة (بإشراف شرعي صارم)
          </span>
        </div>

        <button
          type="button"
          onClick={() => void handleOpenCreate()}
          className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة ستوري</span>
        </button>
      </div>

      {/* Horizontal Stories Strip */}
      <div className="flex items-start gap-4 overflow-x-auto pb-1 no-scrollbar">
        {/* Add Story Circle */}
        <button
          type="button"
          onClick={() => void handleOpenCreate()}
          className="flex flex-col items-center gap-1.5 shrink-0 w-20 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#0F5132] dark:border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 text-[#0F5132] dark:text-emerald-400" />
          </div>
          <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 truncate max-w-full">
            ستوريك
          </span>
        </button>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-stone-500 py-5 px-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#0F5132]" />
            <span>جارٍ تحميل الستوريات...</span>
          </div>
        ) : stories.length === 0 ? (
          <div className="py-5 px-2 text-xs text-stone-500 dark:text-stone-400">
            لا توجد ستوريات حالياً — شارك أول آية أو حكمة أو دعاء ليظهر للقراء ٢٤ ساعة.
          </div>
        ) : (
          stories.map((story, idx) => {
            const style = THEME_STYLES[story.themeColor] || THEME_STYLES.emerald;
            return (
              <button
                key={story.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-20 cursor-pointer group"
              >
                <div
                  className={`w-16 h-16 rounded-full p-0.5 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#121A22] ${style.ring} group-hover:scale-105 transition-transform`}
                >
                  <div
                    className={`w-full h-full rounded-full flex items-center justify-center font-amiri text-xl font-bold ${style.bg}`}
                  >
                    {story.authorName.trim().charAt(0)}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-stone-800 dark:text-stone-200 truncate max-w-full">
                  {story.authorName}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <form
            onSubmit={handlePublishStory}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
              <div>
                <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                  إضافة ستوري ديني (٢٤ ساعة)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  يُسمح فقط بالمحتوى الديني والأخلاقي والعلمي، ويُحظر أي محتوى خارج إطار الدين
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {moderationError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 p-3.5 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{moderationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  نوع الستوري
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as StoryCategory)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
                >
                  {STORY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  الخلفية
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {(Object.keys(THEME_STYLES) as StoryThemeColor[]).map((colorKey) => (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => setThemeColor(colorKey)}
                      className={`flex-1 min-h-[38px] rounded-xl text-xs font-semibold cursor-pointer ${
                        THEME_STYLES[colorKey].bg
                      } ${themeColor === colorKey ? 'ring-2 ring-offset-2 ring-[#0F5132]' : 'opacity-75'}`}
                    >
                      {THEME_STYLES[colorKey].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                نص الستوري (آية، حديث، دعاء، أو فائدة حوزوية)
              </label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="مثال: اللَّهُمَّ عَجِّلْ لِوَلِيِّكَ الْفَرَجَ وَاجْعَلْنَا مِنْ أَنْصَارِهِ وَأَعْوَانِهِ..."
                className="w-full p-3.5 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                المصدر أو السورة (اختياري)
              </label>
              <input
                type="text"
                maxLength={120}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: الكافي · ج ٢ ص ١١٠ أو سورة الشرح"
                className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'جارٍ الفحص والنشر...' : 'نشر الستوري'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Story Viewer Modal */}
      {activeStory && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveIndex(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col min-h-[500px] justify-between p-6 ${
              THEME_STYLES[activeStory.themeColor]?.bg || THEME_STYLES.emerald.bg
            }`}
          >
            {/* Top Progress Segments & Author Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5">
                {stories.map((st, idx) => (
                  <div
                    key={st.id}
                    className={`h-1 flex-1 rounded-full ${
                      idx <= activeIndex ? 'bg-white' : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(null);
                    onOpenUserProfile?.(activeStory.authorId);
                  }}
                  className="flex items-center gap-2.5 text-right cursor-pointer hover:opacity-90"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-amiri text-lg font-bold">
                    {activeStory.authorName.trim().charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{activeStory.authorName}</p>
                    <p className="text-[11px] text-white/80 tabular-nums">
                      {activeStory.category} · {formatStoryTime(activeStory.createdAt)}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1.5">
                  {currentUser?.uid === activeStory.authorId && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteStory(activeStory.id)}
                      aria-label="حذف الستوري"
                      className="min-w-[40px] min-h-[40px] rounded-xl bg-white/15 hover:bg-rose-600/80 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveIndex(null)}
                    aria-label="إغلاق الستوري"
                    className="min-w-[40px] min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Center Story Content */}
            <div className="py-8 text-center space-y-4">
              <p className="text-xs font-semibold text-amber-300">{activeStory.category}</p>
              <p className="font-amiri text-2xl md:text-3xl leading-[1.9] whitespace-pre-wrap">
                {activeStory.caption}
              </p>
              {activeStory.reference && (
                <p className="text-xs text-white/80 pt-2">المصدر: {activeStory.reference}</p>
              )}
            </div>

            {/* Bottom Prev / Next Controls */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/15">
              <button
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <span className="text-xs text-white/80 tabular-nums">
                {activeIndex + 1} / {stories.length}
              </span>

              <button
                type="button"
                disabled={activeIndex >= stories.length - 1}
                onClick={() => setActiveIndex(Math.min(stories.length - 1, activeIndex + 1))}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
