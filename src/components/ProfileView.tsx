import React, { useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  UserPlus,
  UserCheck,
  Edit3,
  Search,
  LogIn,
  LogOut,
  Users,
  MessageSquare,
  Sparkles,
  GraduationCap,
  X,
  Loader2,
  MapPin,
  BookOpen,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
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
import {
  PublicProfile,
  UserFollow,
  StudyStage,
  DiscussionTopic,
} from '../types';
import { moderateReligiousContent } from '../utils/apiClient';

interface ProfileViewProps {
  currentUser: User | null;
  tasbihDailyTotal: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  selectedInspectUserId?: string | null;
  onClearInspectUser?: () => void;
}

const STUDY_STAGES: StudyStage[] = [
  'قارئ ومحب',
  'طالب مقدمات',
  'طالب سطوح',
  'طالب بحث خارج',
  'أستاذ وباحث',
];

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
    }).format(date);
  } catch {
    return 'الآن';
  }
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  tasbihDailyTotal,
  completedLessonsCount,
  totalLessonsCount,
  selectedInspectUserId,
  onClearInspectUser,
}) => {
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [follows, setFollows] = useState<UserFollow[]>([]);
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'people' | 'feed' | 'following' | 'followers'>('people');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'الكل' | StudyStage>('الكل');

  // Edit My Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStage, setEditStage] = useState<StudyStage>('قارئ ومحب');
  const [editCity, setEditCity] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [formError, setFormError] = useState('');

  // Inspect another user modal
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(
    selectedInspectUserId || null
  );
  const [followBusyId, setFollowBusyId] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');
  const [selectedTopicModal, setSelectedTopicModal] = useState<DiscussionTopic | null>(null);

  useEffect(() => {
    if (selectedInspectUserId) {
      setInspectedUserId(selectedInspectUserId);
    }
  }, [selectedInspectUserId]);

  // Listen to public profiles
  useEffect(() => {
    const path = 'profiles';
    const q = query(collection(db, path), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PublicProfile[] = snap.docs.map((d) => ({
          ...(d.data() as PublicProfile),
          userId: d.id,
        }));
        setProfiles(list);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, []);

  // Listen to follow graph
  useEffect(() => {
    const path = 'follows';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: UserFollow[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UserFollow, 'id'>),
        }));
        setFollows(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, []);

  // Listen to discussion topics for feed & user topic counts
  useEffect(() => {
    const path = 'discussions';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: DiscussionTopic[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DiscussionTopic, 'id'>),
        }));
        setTopics(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
    return () => unsub();
  }, []);

  const myProfile = useMemo(
    () => (currentUser ? profiles.find((p) => p.userId === currentUser.uid) || null : null),
    [profiles, currentUser]
  );

  const myFollowingIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(
      follows.filter((f) => f.followerId === currentUser.uid).map((f) => f.targetId)
    );
  }, [follows, currentUser]);

  const myFollowerRecords = useMemo(() => {
    if (!currentUser) return [];
    return follows.filter((f) => f.targetId === currentUser.uid);
  }, [follows, currentUser]);

  const myFollowingRecords = useMemo(() => {
    if (!currentUser) return [];
    return follows.filter((f) => f.followerId === currentUser.uid);
  }, [follows, currentUser]);

  const followingFeedTopics = useMemo(() => {
    if (!currentUser) return [];
    return topics.filter((t) => myFollowingIds.has(t.authorId));
  }, [topics, myFollowingIds, currentUser]);

  const getFollowersCount = (uid: string) =>
    follows.filter((f) => f.targetId === uid).length;

  const getFollowingCount = (uid: string) =>
    follows.filter((f) => f.followerId === uid).length;

  const getTopicsCount = (uid: string) =>
    topics.filter((t) => t.authorId === uid).length;

  const openEditModal = () => {
    setFormError('');
    setEditName(myProfile?.displayName || currentUser?.displayName || 'طالب علم');
    setEditStage(myProfile?.studyStage || 'قارئ ومحب');
    setEditCity(myProfile?.city || 'كربلاء المقدسة');
    setEditBio(myProfile?.bio || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanName = editName.trim().slice(0, 80);
    const cleanCity = editCity.trim().slice(0, 80);
    const cleanBio = editBio.trim().slice(0, 400);

    if (cleanName.length < 2) {
      setFormError('يرجى إدخال اسم ظاهر لا يقل عن حرفين.');
      return;
    }

    setSavingProfile(true);
    setFormError('');
    const path = `profiles/${currentUser.uid}`;

    try {
      const modData = await moderateReligiousContent(
        `${cleanName} ${cleanCity} ${cleanBio}`.trim(),
        'profile'
      );
      if (!modData.allowed) {
        setFormError(
          modData.reason ||
            'محتوى محظور: يُرجى الالتزام بالتعريف العلمي أو الديني المحترم داخل التطبيق.'
        );
        setSavingProfile(false);
        return;
      }

      if (myProfile) {
        await updateDoc(doc(db, 'profiles', currentUser.uid), {
          displayName: cleanName,
          studyStage: editStage,
          city: cleanCity,
          bio: cleanBio,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'profiles', currentUser.uid), {
          userId: currentUser.uid,
          displayName: cleanName,
          studyStage: editStage,
          city: cleanCity,
          bio: cleanBio,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setShowEditModal(false);
    } catch (err) {
      setFormError('تعذر حفظ الملف الشخصي. تأكد من تسجيل الدخول بحساب موثق.');
      handleFirestoreError(err, myProfile ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleFollow = async (targetProfile: PublicProfile) => {
    if (!currentUser) {
      setAuthError('يرجى تسجيل الدخول بحساب Google أولاً لمتابعة القراء وطلبة العلم.');
      return;
    }
    if (targetProfile.userId === currentUser.uid) return;

    const followId = `${currentUser.uid}_${targetProfile.userId}`;
    const path = `follows/${followId}`;
    setFollowBusyId(targetProfile.userId);
    setAuthError('');

    try {
      if (myFollowingIds.has(targetProfile.userId)) {
        await deleteDoc(doc(db, 'follows', followId));
      } else {
        await setDoc(doc(db, 'follows', followId), {
          followerId: currentUser.uid,
          followerName: (myProfile?.displayName || currentUser.displayName || 'قارئ').slice(0, 80),
          targetId: targetProfile.userId,
          targetName: targetProfile.displayName.slice(0, 80),
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setAuthError('تعذر تحديث حالة المتابعة.');
      handleFirestoreError(
        err,
        myFollowingIds.has(targetProfile.userId) ? OperationType.DELETE : OperationType.CREATE,
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

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.trim();
    return profiles.filter((p) => {
      const matchesStage = stageFilter === 'الكل' || p.studyStage === stageFilter;
      const matchesSearch =
        !q ||
        p.displayName.includes(q) ||
        p.city.includes(q) ||
        p.bio.includes(q) ||
        p.studyStage.includes(q);
      return matchesStage && matchesSearch;
    });
  }, [profiles, searchQuery, stageFilter]);

  const inspectedProfile = useMemo(() => {
    if (!inspectedUserId) return null;
    return profiles.find((p) => p.userId === inspectedUserId) || null;
  }, [inspectedUserId, profiles]);

  const inspectedTopics = useMemo(() => {
    if (!inspectedUserId) return [];
    return topics.filter((t) => t.authorId === inspectedUserId);
  }, [inspectedUserId, topics]);

  const closeInspectModal = () => {
    setInspectedUserId(null);
    onClearInspectUser?.();
  };

  return (
    <div className="space-y-6">
      {/* My Profile Header */}
      <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8">
        {currentUser ? (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#0F5132] dark:bg-emerald-700 text-white flex items-center justify-center font-amiri text-2xl font-bold shrink-0">
                {(myProfile?.displayName || currentUser.displayName || 'م').trim().charAt(0)}
              </div>
              <div className="space-y-1.5">
                <h1 className="font-amiri text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                  {myProfile?.displayName || currentUser.displayName || 'طالب علم'}
                </h1>
                <p className="text-xs md:text-sm text-stone-600 dark:text-stone-400">
                  {myProfile?.studyStage || 'قارئ ومحب'}
                  {myProfile?.city ? ` · ${myProfile.city}` : ''}
                </p>
                <p className="text-sm text-stone-700 dark:text-stone-300 max-w-2xl leading-relaxed">
                  {myProfile?.bio ||
                    'أضف نبذة تعريفية عن اهتماماتك العلمية أو الدروس الحوزوية التي تتابعها ليتمكن القراء والطلبة من متابعتك.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openEditModal}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>تعديل الملف الشخصي</span>
              </button>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="font-amiri text-2xl md:text-3xl font-bold text-stone-900 dark:text-white">
                الملف الشخصي ومتابعة القراء والطلبة
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                سجّل الدخول لإنشاء ملفك الشخصي، تعديل بياناتك، ومتابعة المشاركين في ساحة المناقشة.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] dark:bg-emerald-600 text-white text-xs md:text-sm font-semibold flex items-center gap-2 cursor-pointer shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول بحساب Google</span>
            </button>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-[#E7E1D6] dark:border-[#1F2B37]">
          <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] p-3.5">
            <p className="text-xs text-stone-500 dark:text-stone-400">المتابِعون</p>
            <p className="text-xl font-bold tabular-nums text-stone-900 dark:text-white mt-1">
              {currentUser ? getFollowersCount(currentUser.uid) : 0}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] p-3.5">
            <p className="text-xs text-stone-500 dark:text-stone-400">أتابعهم</p>
            <p className="text-xl font-bold tabular-nums text-stone-900 dark:text-white mt-1">
              {currentUser ? getFollowingCount(currentUser.uid) : 0}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] p-3.5">
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#0F5132] dark:text-emerald-400" />
              <span>تسبيح اليوم</span>
            </p>
            <p className="text-xl font-bold tabular-nums text-stone-900 dark:text-white mt-1">
              {tasbihDailyTotal}
            </p>
          </div>
          <div className="rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] p-3.5">
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#0F5132] dark:text-emerald-400" />
              <span>الدروس المنجزة</span>
            </p>
            <p className="text-xl font-bold tabular-nums text-stone-900 dark:text-white mt-1">
              {completedLessonsCount} / {totalLessonsCount}
            </p>
          </div>
        </div>
      </section>

      {authError && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-3.5 text-xs text-rose-800 dark:text-rose-200">
          {authError}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('people')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'people'
              ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
              : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="tabular-nums">القراء والطلبة ({profiles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feed')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'feed'
              ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
              : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="tabular-nums">موجز من أتابعهم ({followingFeedTopics.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('following')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'following'
              ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
              : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span className="tabular-nums">أتابعهم ({myFollowingRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('followers')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'followers'
              ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
              : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span className="tabular-nums">المتابِعون ({myFollowerRecords.length})</span>
        </button>
      </div>

      {/* Tab 1: People Directory */}
      {activeTab === 'people' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['الكل', ...STUDY_STAGES] as const).map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setStageFilter(stage)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    stageFilter === stage
                      ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                      : 'bg-white dark:bg-[#121A22] border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو المدينة..."
                className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-sm text-stone-900 dark:text-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-10 flex items-center justify-center gap-2 text-sm text-stone-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#0F5132]" />
              <span>جارٍ تحميل ملفات القراء والطلبة...</span>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-10 text-center space-y-2">
              <Users className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                لا توجد ملفات مطابقة للبحث حالياً.
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                عند تسجيل دخول أي قارئ أو طالب علم سيظهر ملفه العام هنا لمتابعته.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((person) => {
                const isMe = currentUser?.uid === person.userId;
                const isFollowing = myFollowingIds.has(person.userId);
                const followersCount = getFollowersCount(person.userId);
                const topicsCount = getTopicsCount(person.userId);

                return (
                  <div
                    key={person.userId}
                    className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F5132] dark:text-emerald-300 flex items-center justify-center font-amiri text-xl font-bold shrink-0">
                          {person.displayName.trim().charAt(0) || 'ق'}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h2 className="font-bold text-base text-stone-900 dark:text-white truncate">
                            {person.displayName}
                            {isMe ? ' (أنت)' : ''}
                          </h2>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {person.studyStage}
                            {person.city ? ` · ${person.city}` : ''}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs md:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                        {person.bio || 'عضو في المدونة الحسينية للعبادة والعلم والمعرفة.'}
                      </p>

                      <p className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                        {followersCount} متابِع · {topicsCount} موضوع منشور
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E7E1D6] dark:border-[#1F2B37] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectedUserId(person.userId)}
                        className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        عرض الملف
                      </button>

                      {!isMe && (
                        <button
                          type="button"
                          disabled={followBusyId === person.userId}
                          onClick={() => handleToggleFollow(person)}
                          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60 ${
                            isFollowing
                              ? 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#0F5132]/30'
                              : 'bg-[#0F5132] text-white hover:bg-[#0B3D26] dark:bg-emerald-600'
                          }`}
                        >
                          {isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span>متابَع</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>متابعة</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Feed from Followed Users */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {!currentUser ? (
            <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                سجّل الدخول لعرض منشورات ومواضيع الأشخاص الذين تتابعهم.
              </p>
              <button
                type="button"
                onClick={handleLogin}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold cursor-pointer"
              >
                تسجيل الدخول بحساب Google
              </button>
            </div>
          ) : followingFeedTopics.length === 0 ? (
            <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-8 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                لا توجد منشورات بعد في موجز المتابَعين.
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                تابع القراء وطلبة العلم من تبويب «القراء والطلبة» لتظهر مشاركاتهم في ساحة المناقشة هنا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followingFeedTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicModal(topic)}
                  className="text-right rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-5 space-y-2 hover:border-[#0F5132]/50 cursor-pointer"
                >
                  <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                    {topic.category} · {topic.authorName} ·{' '}
                    <span className="tabular-nums">{formatArabicDate(topic.createdAt)}</span>
                  </p>
                  <h3 className="font-amiri text-xl font-bold text-stone-900 dark:text-white">
                    {topic.title}
                  </h3>
                  <p className="text-xs md:text-sm text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                    {topic.body}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Following List */}
      {activeTab === 'following' && (
        <div className="space-y-3">
          {!currentUser || myFollowingRecords.length === 0 ? (
            <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-8 text-center text-sm text-stone-500">
              أنت لا تتابع أي شخص حالياً. انتقل إلى «القراء والطلبة» لمتابعة الآخرين.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myFollowingRecords.map((rel) => {
                const prof = profiles.find((p) => p.userId === rel.targetId);
                return (
                  <div
                    key={rel.id}
                    className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-4 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setInspectedUserId(rel.targetId)}
                      className="text-right flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0F5132] dark:text-emerald-300 flex items-center justify-center font-bold shrink-0">
                        {(prof?.displayName || rel.targetName).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-stone-900 dark:text-white truncate">
                          {prof?.displayName || rel.targetName}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {prof ? `${prof.studyStage}${prof.city ? ` · ${prof.city}` : ''}` : 'عضو في المدونة'}
                        </p>
                      </div>
                    </button>

                    {prof && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(prof)}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer shrink-0"
                      >
                        إلغاء المتابعة
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Followers List */}
      {activeTab === 'followers' && (
        <div className="space-y-3">
          {!currentUser || myFollowerRecords.length === 0 ? (
            <div className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-8 text-center text-sm text-stone-500">
              لا يوجد متابِعون لحسابك بعد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myFollowerRecords.map((rel) => {
                const prof = profiles.find((p) => p.userId === rel.followerId);
                const isFollowingBack = myFollowingIds.has(rel.followerId);
                return (
                  <div
                    key={rel.id}
                    className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-4 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setInspectedUserId(rel.followerId)}
                      className="text-right flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shrink-0">
                        {(prof?.displayName || rel.followerName).charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-stone-900 dark:text-white truncate">
                          {prof?.displayName || rel.followerName}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {prof ? `${prof.studyStage}${prof.city ? ` · ${prof.city}` : ''}` : 'متابِع لك'}
                        </p>
                      </div>
                    </button>

                    {prof && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(prof)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 ${
                          isFollowingBack
                            ? 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-[#0F5132] text-white'
                        }`}
                      >
                        {isFollowingBack ? 'تتابعه ✓' : 'رد المتابعة'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowEditModal(false)}
        >
          <form
            onSubmit={handleSaveProfile}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
              <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                تعديل الملف الشخصي
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                الاسم الظاهر
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  الصفة / المرحلة الدراسية
                </label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as StudyStage)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
                >
                  {STUDY_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  المدينة
                </label>
                <input
                  type="text"
                  maxLength={80}
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="مثال: النجف الأشرف"
                  className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                النبذة التعريفية
              </label>
              <textarea
                rows={3}
                maxLength={400}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="اكتب نبذة مختصرة عن اهتماماتك الفقهية أو القرآنية أو الحوزوية..."
                className="w-full p-3.5 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-[#FAF8F4] dark:bg-[#0B1117] text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
              >
                {savingProfile ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inspect Other User Profile Modal */}
      {inspectedProfile && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeInspectModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-[#E7E1D6] dark:border-[#1F2B37] flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0F5132] text-white flex items-center justify-center font-amiri text-2xl font-bold shrink-0">
                  {inspectedProfile.displayName.trim().charAt(0)}
                </div>
                <div className="space-y-1">
                  <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                    {inspectedProfile.displayName}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 flex flex-wrap items-center gap-1.5">
                    <span>{inspectedProfile.studyStage}</span>
                    {inspectedProfile.city && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {inspectedProfile.city}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeInspectModal}
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {inspectedProfile.bio || 'عضو في المدونة الحسينية للعبادة والعلم والمعرفة.'}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117] border border-[#E7E1D6] dark:border-[#1F2B37]">
                <div className="flex items-center gap-6 text-xs">
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">المتابِعون: </span>
                    <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                      {getFollowersCount(inspectedProfile.userId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">يتابع: </span>
                    <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                      {getFollowingCount(inspectedProfile.userId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">المواضيع: </span>
                    <span className="font-bold text-stone-900 dark:text-white tabular-nums">
                      {inspectedTopics.length}
                    </span>
                  </div>
                </div>

                {currentUser?.uid !== inspectedProfile.userId && (
                  <button
                    type="button"
                    disabled={followBusyId === inspectedProfile.userId}
                    onClick={() => handleToggleFollow(inspectedProfile)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      myFollowingIds.has(inspectedProfile.userId)
                        ? 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300 border border-[#0F5132]/30'
                        : 'bg-[#0F5132] text-white'
                    }`}
                  >
                    {myFollowingIds.has(inspectedProfile.userId) ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>متابَع (إلغاء)</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>متابعة</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-stone-600 dark:text-stone-400">
                  مشاركات {inspectedProfile.displayName} في ساحة المناقشة
                </h3>
                {inspectedTopics.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">
                    لم ينشر مواضيع في ساحة المناقشة حتى الآن.
                  </p>
                ) : (
                  inspectedTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] p-4 space-y-1.5"
                    >
                      <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                        {topic.category} ·{' '}
                        <span className="tabular-nums">{formatArabicDate(topic.createdAt)}</span>
                      </p>
                      <h4 className="font-amiri text-lg font-bold text-stone-900 dark:text-white">
                        {topic.title}
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {topic.body}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Topic Reader Modal from Feed */}
      {selectedTopicModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedTopicModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
                  {selectedTopicModal.category} · {selectedTopicModal.authorName} ·{' '}
                  <span className="tabular-nums">{formatArabicDate(selectedTopicModal.createdAt)}</span>
                </p>
                <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                  {selectedTopicModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopicModal(null)}
                className="min-w-[44px] min-h-[44px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm md:text-base text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap">
              {selectedTopicModal.body}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
