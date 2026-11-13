/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Code2, Copy, Check, Download, X } from 'lucide-react';
import { auth, db, testFirestoreConnection } from './firebase';
import { SectionId, CityLocation } from './types';
import { SHIA_CITIES, calculateJafariPrayerTimes } from './utils/prayerTimes';
import { LESSONS_DATA } from './data/lessonsData';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { DuasView } from './components/DuasView';
import { QuranView } from './components/QuranView';
import { SacredPlacesView } from './components/SacredPlacesView';
import { FiguresAndBotView } from './components/FiguresAndBotView';
import { LibraryView } from './components/LibraryView';
import { DiscussionForumView } from './components/DiscussionForumView';
import { ProfileView } from './components/ProfileView';
import { PrayersAdhanView } from './components/PrayersAdhanView';
import { TasbihView } from './components/TasbihView';
import { NawafilView } from './components/NawafilView';
import { LessonsView } from './components/LessonsView';
import { QAView } from './components/QAView';
import { QuizView } from './components/QuizView';

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [showPublicHtmlModal, setShowPublicHtmlModal] = useState(false);
  const [publicHtmlCode, setPublicHtmlCode] = useState('');
  const [isLoadingPublicHtml, setIsLoadingPublicHtml] = useState(false);
  const [copiedPublicHtml, setCopiedPublicHtml] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('husayni_theme') === 'dark';
    } catch {
      return false;
    }
  });

  const [selectedCity, setSelectedCity] = useState<CityLocation>(() => {
    try {
      const savedId = localStorage.getItem('husayni_city_id');
      return SHIA_CITIES.find((c) => c.id === savedId) || SHIA_CITIES[0];
    } catch {
      return SHIA_CITIES[0];
    }
  });

  const [tasbihDailyTotal, setTasbihDailyTotal] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('husayni_tasbih_daily') || 0);
    } catch {
      return 0;
    }
  });

  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('husayni_completed_lessons');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    void testFirestoreConnection();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.emailVerified) {
        try {
          const profileRef = doc(db, 'profiles', user.uid);
          const snap = await getDoc(profileRef);
          if (!snap.exists()) {
            const rawName = (user.displayName || '').trim().slice(0, 80);
            await setDoc(profileRef, {
              userId: user.uid,
              displayName: rawName.length >= 2 ? rawName : 'طالب علم',
              bio: '',
              studyStage: 'قارئ ومحب',
              city: selectedCity.name.slice(0, 80),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch {
          // Non-blocking profile bootstrap
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.emailVerified) return;

    const progressRef = doc(db, 'users', currentUser.uid, 'progress', 'summary');
    const safeTasbih = Math.max(0, Math.min(1000000, Math.floor(tasbihDailyTotal)));
    const safeLessons = Math.max(0, Math.min(500, Math.floor(completedLessons.length)));

    void setDoc(
      progressRef,
      {
        userId: currentUser.uid,
        tasbihDaily: safeTasbih,
        completedLessonsCount: safeLessons,
        quizBestScore: 0,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch(() => {
      // Non-blocking sync when user is authenticated
    });
  }, [currentUser, tasbihDailyTotal, completedLessons.length]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('husayni_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }
  }, [isDark]);

  const handleSelectCity = (city: CityLocation) => {
    setSelectedCity(city);
    try {
      localStorage.setItem('husayni_city_id', city.id);
    } catch {
      // Ignore storage error
    }
  };

  const handleIncrementTasbihDaily = () => {
    setTasbihDailyTotal((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem('husayni_tasbih_daily', String(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleToggleLessonComplete = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      try {
        localStorage.setItem('husayni_completed_lessons', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleNavigate = (section: SectionId) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPublicHtmlModal = async () => {
    setShowPublicHtmlModal(true);
    if (publicHtmlCode) return;
    setIsLoadingPublicHtml(true);
    try {
      const res = await fetch('/al-mudawwana.html');
      if (res.ok) {
        const text = await res.text();
        setPublicHtmlCode(text);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setIsLoadingPublicHtml(false);
    }
  };

  const handleCopyPublicHtml = async () => {
    if (!publicHtmlCode) return;
    try {
      await navigator.clipboard.writeText(publicHtmlCode);
      setCopiedPublicHtml(true);
      setTimeout(() => setCopiedPublicHtml(false), 2500);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadPublicHtml = () => {
    if (!publicHtmlCode) return;
    const blob = new Blob([publicHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'al-mudawwana-public.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const prayerSchedule = useMemo(
    () => calculateJafariPrayerTimes(selectedCity, new Date()),
    [selectedCity]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] dark:bg-[#0B1117] text-[#1C1917] dark:text-[#F3EFE6] pb-20 md:pb-8">
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 md:py-8">
        {activeSection === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            selectedCity={selectedCity}
            prayerSchedule={prayerSchedule}
            isDark={isDark}
            onToggleTheme={() => setIsDark(!isDark)}
            tasbihDailyTotal={tasbihDailyTotal}
            completedLessonsCount={completedLessons.length}
            totalLessonsCount={LESSONS_DATA.length}
            currentUser={currentUser}
            onOpenUserProfile={(uid) => {
              setInspectUserId(uid === currentUser?.uid ? null : uid);
              handleNavigate('profile');
            }}
          />
        )}

        {activeSection === 'duas' && <DuasView />}
        {activeSection === 'quran' && <QuranView />}
        {activeSection === 'places' && <SacredPlacesView />}
        {activeSection === 'figures' && <FiguresAndBotView />}
        {activeSection === 'library' && <LibraryView />}
        {activeSection === 'forum' && (
          <DiscussionForumView
            currentUser={currentUser}
            onOpenUserProfile={(uid) => {
              setInspectUserId(uid === currentUser?.uid ? null : uid);
              handleNavigate('profile');
            }}
          />
        )}
        {activeSection === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            tasbihDailyTotal={tasbihDailyTotal}
            completedLessonsCount={completedLessons.length}
            totalLessonsCount={LESSONS_DATA.length}
            selectedInspectUserId={inspectUserId}
            onClearInspectUser={() => setInspectUserId(null)}
          />
        )}
        {activeSection === 'prayers' && (
          <PrayersAdhanView
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            prayerSchedule={prayerSchedule}
          />
        )}
        {activeSection === 'tasbih' && (
          <TasbihView
            dailyTotal={tasbihDailyTotal}
            onIncrementDaily={handleIncrementTasbihDaily}
          />
        )}
        {activeSection === 'nawafil' && <NawafilView />}
        {activeSection === 'lessons' && (
          <LessonsView
            completedLessons={completedLessons}
            onToggleComplete={handleToggleLessonComplete}
          />
        )}
        {activeSection === 'qa' && <QAView />}
        {activeSection === 'quiz' && <QuizView />}
      </main>

      <footer className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-6 pb-4 border-t border-[#E7E1D6] dark:border-[#1F2B37] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
        <div className="text-center md:text-right space-y-1">
          <p className="font-amiri text-sm font-bold text-stone-800 dark:text-stone-200">
            المدونة الحسينية · للعبادة والعلم والمعرفة
          </p>
          <p className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400">
            جميع الحقوق محفوظة © للمطور موسى جليل
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => handleNavigate('duas')}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            الأدعية والأحاديث
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('quran')}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            القرآن
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('places')}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            الأماكن الدينية
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('figures')}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            الصحابة والعلماء
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('library')}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            المكتبة الحوزوية
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('forum')}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            ساحة المناقشة
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('profile')}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            الملف الشخصي والمتابعة
          </button>
          <button
            type="button"
            onClick={() => void handleOpenPublicHtmlModal()}
            className="inline-flex items-center gap-1.5 font-semibold text-[#0F5132] dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>كود HTML العام</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
          >
            {isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
          </button>
        </div>
      </footer>

      {showPublicHtmlModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPublicHtmlModal(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-[#E7E1D6] dark:border-[#1F2B37] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
                  كود HTML العام المستقل (بدون بيانات خاصة)
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  جاهز للنشر في أي مكان مع دعم Firebase الاختياري ونظام الحظر الديني والقرآن الكامل بأصوات شيعية
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopyPublicHtml()}
                  disabled={!publicHtmlCode}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {copiedPublicHtml ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPublicHtml ? 'تم نسخ الكود' : 'نسخ الكود بالكامل'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPublicHtml}
                  disabled={!publicHtmlCode}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] text-stone-800 dark:text-stone-200 hover:border-[#0F5132] text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPublicHtmlModal(false)}
                  aria-label="إغلاق"
                  className="min-h-[42px] min-w-[42px] rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] flex items-center justify-center text-stone-600 dark:text-stone-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-[#FAF8F4] dark:bg-[#0B1117]">
              {isLoadingPublicHtml ? (
                <p className="text-sm text-stone-500 text-center py-12">جارٍ تحميل الكود العام...</p>
              ) : (
                <pre
                  dir="ltr"
                  className="text-xs font-mono text-stone-800 dark:text-stone-200 whitespace-pre-wrap break-words leading-relaxed select-all"
                >
                  {publicHtmlCode || 'تعذر تحميل الملف.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
