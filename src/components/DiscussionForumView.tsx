import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Send,
  LogIn,
  LogOut,
  Trash2,
  X,
  Search,
  User as UserIcon,
  Loader2,
  UserPlus,
  UserCheck,
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
  signOutUser,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { DiscussionTopic, DiscussionReply, PublicProfile, UserFollow } from '../types';
import { StoriesBar } from './StoriesBar';
import { moderateReligiousContent } from '../utils/apiClient';

interface DiscussionForumViewProps {
  currentUser: User | null;
  onOpenUserProfile?: (userId: string) => void;
}

const FORUM_CATEGORIES: DiscussionTopic['category'][] = [
  'فقهية',
  'عقائدية',
  'قرآنية',
  'منطق ونحو',
  'سيرة وتاريخ',
  'عامة',
];

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${rand}`;
}

function formatArabicDate(ts: unknown): string {
  if (!ts) return 'الآن';
  try {
    const date =
      ts instanceof Timestamp
        ? ts.toDate()
        : typeof (ts as { toDate?: () => Date }).toDate === 'function'
        ? (ts as { toDate: () => Date }).toDate()
        : new Date();
    return new Intl.DateTimeFormat('ar-IQ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'الآن';
  }
}

export const DiscussionForumView: React.FC<DiscussionForumViewProps> = ({
  currentUser,
  onOpenUserProfile,
}) => {
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'الكل' | DiscussionTopic['category']>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [profilesMap, setProfilesMap] = useState<Record<string, PublicProfile>>({});
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);

  // Create Topic Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DiscussionTopic['category']>('فقهية');
  const [newBody, setNewBody] = useState('');
  const [submittingTopic, setSubmittingTopic] = useState(false);

  // Active Topic & Replies Modal State
  const [activeTopic, setActiveTopic] = useState<DiscussionTopic | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [authError, setAuthError] = useState('');
  const [actionError, setActionError] = useState('');

  // Real-time topics listener
  useEffect(() => {
    const path = 'discussions';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: DiscussionTopic[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DiscussionTopic, 'id'>),
        }));
        setTopics(list);
        setLoadingTopics(false);
      },
      (error) => {
        setLoadingTopics(false);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time replies listener when a topic window is open
  useEffect(() => {
    if (!activeTopic) {
      setReplies([]);
      return;
    }
    const path = `discussions/${activeTopic.id}/replies`;
    const q = query(collection(db, 'discussions', activeTopic.id, 'replies'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: DiscussionReply[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DiscussionReply, 'id'>),
        }));
        setReplies(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [activeTopic?.id]);

  // Listen to profiles and follows so users can follow authors directly
  useEffect(() => {
    const unsubProfiles = onSnapshot(
      collection(db, 'profiles'),
      (snap) => {
        const map: Record<string, PublicProfile> = {};
        snap.docs.forEach((d) => {
          map[d.id] = { ...(d.data() as PublicProfile), userId: d.id };
        });
        setProfilesMap(map);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'profiles');
      }
    );

    const unsubFollows = onSnapshot(
      collection(db, 'follows'),
      (snap) => {
        if (!currentUser) {
          setFollowingIds(new Set());
          return;
        }
        const ids = new Set<string>();
        snap.docs.forEach((d) => {
          const data = d.data() as Omit<UserFollow, 'id'>;
          if (data.followerId === currentUser.uid) {
            ids.add(data.targetId);
          }
        });
        setFollowingIds(ids);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'follows');
      }
    );

    return () => {
      unsubProfiles();
      unsubFollows();
    };
  }, [currentUser]);

  const handleToggleFollowAuthor = async (targetId: string, targetName: string) => {
    if (!currentUser) {
      setAuthError('يرجى تسجيل الدخول بحساب Google أولاً لمتابعة القراء.');
      return;
    }
    if (targetId === currentUser.uid || !profilesMap[targetId]) return;

    const followId = `${currentUser.uid}_${targetId}`;
    const path = `follows/${followId}`;
    setFollowBusyId(targetId);

    try {
      if (followingIds.has(targetId)) {
        await deleteDoc(doc(db, 'follows', followId));
      } else {
        await setDoc(doc(db, 'follows', followId), {
          followerId: currentUser.uid,
          followerName: (currentUser.displayName || 'قارئ').slice(0, 80),
          targetId,
          targetName: targetName.slice(0, 80),
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(
        err,
        followingIds.has(targetId) ? OperationType.DELETE : OperationType.CREATE,
        path
      );
    } finally {
      setFollowBusyId(null);
    }
  };

  const handleLogin = async () => {
    setAuthError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول.');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const title = newTitle.trim().slice(0, 160);
    const body = newBody.trim().slice(0, 4000);
    if (title.length < 3 || body.length < 5) {
      setActionError('يرجى كتابة عنوان واضح (٣ أحرف فأكثر) ومحتوى لا يقل عن ٥ أحرف.');
      return;
    }

    setSubmittingTopic(true);
    setActionError('');
    const topicId = makeSafeId('topic');
    const path = `discussions/${topicId}`;

    try {
      const modData = await moderateReligiousContent(`${title}\n${body}`, 'topic');
      if (!modData.allowed) {
        setActionError(
          modData.reason ||
            'محتوى محظور: يُسمح فقط بنشر المواضيع الدينية والعلمية ضمن الإطار الإسلامي.'
        );
        setSubmittingTopic(false);
        return;
      }

      await setDoc(doc(db, 'discussions', topicId), {
        title,
        body,
        category: newCategory,
        authorId: currentUser.uid,
        authorName: (currentUser.displayName || 'طالب علم').slice(0, 80),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewTitle('');
      setNewBody('');
      setShowNewModal(false);
    } catch (err) {
      setActionError('تعذر نشر الموضوع، يرجى التحقق من الاتصال والصلاحيات.');
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSubmittingTopic(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeTopic) return;
    const text = replyText.trim().slice(0, 2500);
    if (text.length < 2) return;

    setSubmittingReply(true);
    setActionError('');
    const replyId = makeSafeId('rep');
    const path = `discussions/${activeTopic.id}/replies/${replyId}`;

    try {
      const modData = await moderateReligiousContent(text, 'reply');
      if (!modData.allowed) {
        setActionError(
          modData.reason ||
            'محتوى محظور: يُمنع إرسال أي مشاركة خارج الإطار الديني والأخلاقي.'
        );
        setSubmittingReply(false);
        return;
      }

      await setDoc(doc(db, 'discussions', activeTopic.id, 'replies', replyId), {
        topicId: activeTopic.id,
        body: text,
        authorId: currentUser.uid,
        authorName: (currentUser.displayName || 'قارئ').slice(0, 80),
        createdAt: serverTimestamp(),
      });
      setReplyText('');
    } catch (err) {
      setActionError('تعذر إرسال الرد.');
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    const path = `discussions/${topicId}`;
    try {
      await deleteDoc(doc(db, 'discussions', topicId));
      if (activeTopic?.id === topicId) setActiveTopic(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleDeleteReply = async (topicId: string, replyId: string) => {
    const path = `discussions/${topicId}/replies/${replyId}`;
    try {
      await deleteDoc(doc(db, 'discussions', topicId, 'replies', replyId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const filteredTopics = topics.filter((t) => {
    const matchesCat = categoryFilter === 'الكل' || t.category === categoryFilter;
    const q = searchQuery.trim();
    const matchesSearch =
      !q || t.title.includes(q) || t.body.includes(q) || t.authorName.includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Religious Stories Bar */}
      <StoriesBar currentUser={currentUser} onOpenUserProfile={onOpenUserProfile} />

      {/* Header & Auth Card */}
      <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-white">
            ساحة المناقشة للقراء والطلبة
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            ملتقى علمي حواري متزامن عبر Firebase لطرح المباحث الفقهية والعقائدية والقرآنية واللغوية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser ? (
            <>
              <button
                type="button"
                onClick={() => onOpenUserProfile?.(currentUser.uid)}
                className="min-h-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold hover:border-[#0F5132]/50 cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
                <span>{currentUser.displayName || 'ملفي الشخصي'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionError('');
                  setShowNewModal(true);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>طرح موضوع جديد</span>
              </button>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-xs md:text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول بحساب Google للمشاركة</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 text-xs text-rose-800 dark:text-rose-200">
          {authError}
        </div>
      )}

      {/* Search & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(['الكل', ...FORUM_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                  : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في النقاشات..."
            className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-sm text-stone-900 dark:text-white"
          />
        </div>
      </div>

      {/* Topics List */}
      {loadingTopics ? (
        <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-10 flex items-center justify-center gap-2 text-sm text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin text-[#0F5132]" />
          <span>جارٍ تحميل ساحة المناقشة...</span>
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-10 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
            لا توجد مواضيع منشورة في هذا القسم بعد.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            كن أول من يطرح بحثاً أو سؤالاً للنقاش مع القراء وطلبة العلم.
          </p>
          {currentUser && (
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold cursor-pointer"
            >
              طرح موضوع جديد
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-5 flex flex-col justify-between space-y-4 hover:border-[#0F5132]/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => setActiveTopic(topic)}
                className="text-right cursor-pointer space-y-2 flex-1"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-semibold text-[#0F5132] dark:text-emerald-400">
                    {topic.category} · {topic.authorName}
                  </span>
                  <span className="tabular-nums">{formatArabicDate(topic.createdAt)}</span>
                </div>
                <h2 className="font-amiri text-xl font-bold text-stone-900 dark:text-white leading-snug">
                  {topic.title}
                </h2>
                <p className="text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                  {topic.body}
                </p>
              </button>

              <div className="pt-3 border-t border-[#E7E1D6] dark:border-[#1F2B37] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTopic(topic)}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] text-xs font-semibold text-[#0F5132] dark:text-emerald-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>فتح النقاش والردود</span>
                  </button>

                  {currentUser?.uid !== topic.authorId && profilesMap[topic.authorId] && (
                    <button
                      type="button"
                      disabled={followBusyId === topic.authorId}
                      onClick={() => handleToggleFollowAuthor(topic.authorId, topic.authorName)}
                      className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        followingIds.has(topic.authorId)
                          ? 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {followingIds.has(topic.authorId) ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>متابَع</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>متابعة</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {currentUser?.uid === topic.authorId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTopic(topic.id)}
                    aria-label="حذف الموضوع"
                    className="min-w-[40px] min-h-[40px] rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Topic Modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNewModal(false)}
        >
          <form
            onSubmit={handleCreateTopic}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
              <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                طرح موضوع جديد في ساحة المناقشة
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <p className="text-xs text-rose-600 font-semibold">{actionError}</p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                التصنيف
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as DiscussionTopic['category'])}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
              >
                {FORUM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                عنوان الموضوع أو السؤال
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={160}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: الفرق بين الشك في الركعات والسهو في السجود"
                className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                تفاصيل البحث أو المسألة
              </label>
              <textarea
                required
                minLength={5}
                maxLength={4000}
                rows={4}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="اكتب طرحك أو استفسارك العلمي هنا..."
                className="w-full p-4 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={submittingTopic}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {submittingTopic ? 'جارٍ النشر...' : 'نشر الموضوع'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Topic Replies Thread Modal */}
      {activeTopic && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveTopic(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 md:p-6 border-b border-[#E7E1D6] dark:border-[#1F2B37] flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                  <span>{activeTopic.category}</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (profilesMap[activeTopic.authorId]) {
                        onOpenUserProfile?.(activeTopic.authorId);
                      }
                    }}
                    className={profilesMap[activeTopic.authorId] ? 'hover:underline cursor-pointer' : ''}
                  >
                    {activeTopic.authorName}
                  </button>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatArabicDate(activeTopic.createdAt)}</span>
                  {currentUser?.uid !== activeTopic.authorId && profilesMap[activeTopic.authorId] && (
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleFollowAuthor(activeTopic.authorId, activeTopic.authorName)
                      }
                      className={`mr-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        followingIds.has(activeTopic.authorId)
                          ? 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-[#0F5132] text-white'
                      }`}
                    >
                      {followingIds.has(activeTopic.authorId) ? 'متابَع ✓' : 'متابعة الكاتب'}
                    </button>
                  )}
                </div>
                <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                  {activeTopic.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
              <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37] p-4 text-sm md:text-base text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                {activeTopic.body}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-600 dark:text-stone-400 tabular-nums">
                  الردود والمناقشات ({replies.length})
                </h4>

                {replies.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">
                    لا توجد ردود حتى الآن. شارك برأيك أو علمك حول هذا الموضوع.
                  </p>
                ) : (
                  replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] p-4 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span className="font-bold text-[#0F5132] dark:text-emerald-400">
                          {rep.authorName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums">{formatArabicDate(rep.createdAt)}</span>
                          {currentUser?.uid === rep.authorId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReply(activeTopic.id, rep.id)}
                              aria-label="حذف الرد"
                              className="text-rose-600 hover:underline cursor-pointer"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
                        {rep.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Form */}
            <div className="p-4 border-t border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] space-y-2">
              {actionError && activeTopic && (
                <p className="text-xs text-rose-600 font-semibold">{actionError}</p>
              )}
              {currentUser ? (
                <form onSubmit={handlePostReply} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={2500}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب مشاركتك أو ردك العلمي..."
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply || replyText.trim().length < 2}
                    className="min-w-[44px] min-h-[44px] px-4 rounded-xl bg-[#0F5132] text-white flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال</span>
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="w-full min-h-[44px] rounded-xl bg-[#0F5132] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>سجّل الدخول بحساب Google لإضافة رد</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
