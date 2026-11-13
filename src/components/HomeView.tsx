import React, { useState } from 'react';
import {
  BookOpen,
  Headphones,
  Clock,
  Sparkles,
  ListChecks,
  GraduationCap,
  HelpCircle,
  Trophy,
  Volume2,
  Sun,
  Moon,
  ChevronLeft,
  Compass,
  Landmark,
  Users,
  Library,
  MessageSquare,
  UserCircle2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CityLocation, PrayerSchedule, SectionId } from '../types';
import { getArabicDates, getNextPrayer } from '../utils/prayerTimes';
import { DUAS_DATA, HADITHS_DATA } from '../data/duasData';
import { QURAN_CATALOG } from '../data/quranCatalog';
import { SACRED_PLACES_DATA, RELIGIOUS_FIGURES_DATA } from '../data/placesAndFiguresData';
import { LIBRARY_BOOKS_DATA } from '../data/libraryData';
import { QA_DATA, QUIZ_QUESTIONS } from '../data/qaAndQuizData';
import { StoriesBar } from './StoriesBar';
import heroShrineImg from '../assets/images/hero_karbala_shrine_1794596207615.jpg';

interface HomeViewProps {
  onNavigate: (section: SectionId) => void;
  selectedCity: CityLocation;
  prayerSchedule: PrayerSchedule;
  isDark: boolean;
  onToggleTheme: () => void;
  tasbihDailyTotal: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  currentUser: User | null;
  onOpenUserProfile: (userId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  selectedCity,
  prayerSchedule,
  isDark,
  onToggleTheme,
  tasbihDailyTotal,
  completedLessonsCount,
  totalLessonsCount,
  currentUser,
  onOpenUserProfile,
}) => {
  const [imgError, setImgError] = useState(false);
  const dates = getArabicDates(new Date());
  const nextPrayer = getNextPrayer(prayerSchedule, new Date());

  const quickSections: Array<{
    id: SectionId;
    title: string;
    subtitle: string;
    meta: string;
    icon: React.ReactNode;
    accentClass: string;
  }> = [
    {
      id: 'duas',
      title: 'الأدعية والأحاديث الصحيحة',
      subtitle: 'دعاء كميل، زيارة عاشوراء، التوسل، الكساء، مع أحاديث مسندة وموثقة',
      meta: `${DUAS_DATA.length} أدعية و${HADITHS_DATA.length} أحاديث`,
      icon: <BookOpen className="w-6 h-6" />,
      accentClass: 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'quran',
      title: 'القرآن الكريم كاملاً (أصوات شيعية)',
      subtitle: 'جميع الـ ١١٤ سورة ومنها طوال السور بالتشكيل الكامل وتلاوة برهيزكار والمنصوري',
      meta: `${QURAN_CATALOG.length} سورة كاملة`,
      icon: <Headphones className="w-6 h-6" />,
      accentClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'places',
      title: 'الأماكن الدينية والعتبات',
      subtitle: 'صور وتاريخ وفضائل كربلاء والنجف والكاظمية وسامراء ومشهد وقم والكوفة',
      meta: `${SACRED_PLACES_DATA.length} معالم مقدسة`,
      icon: <Landmark className="w-6 h-6" />,
      accentClass: 'bg-rose-50 text-[#881337] dark:bg-rose-950/60 dark:text-rose-300',
    },
    {
      id: 'figures',
      title: 'الصحابة والعلماء + بوت السيرة',
      subtitle: 'الصحابة المنتجبون والعلماء الأعلام مع محادثة ذكية للتعرف على سيرتهم',
      meta: `${RELIGIOUS_FIGURES_DATA.length} شخصية وبوت تفاعلي`,
      icon: <Users className="w-6 h-6" />,
      accentClass: 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'library',
      title: 'المكتبة والكتب الحوزوية الكاملة',
      subtitle: 'قراءة كتب وفصول المقدمات والسطوح والبحث الخارج ونهج البلاغة والصحيفة السجادية',
      meta: `${LIBRARY_BOOKS_DATA.length} كتاباً بفصول كاملة`,
      icon: <Library className="w-6 h-6" />,
      accentClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'forum',
      title: 'ساحة المناقشة',
      subtitle: 'منتدى تفاعلي للقراء وطلبة العلوم الدينية لطرح المسائل والردود مباشرة',
      meta: 'نقاش مباشر مع الحفظ السحابي',
      icon: <MessageSquare className="w-6 h-6" />,
      accentClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    },
    {
      id: 'profile',
      title: 'الملف الشخصي والمتابعة',
      subtitle: 'إدارة ملفك الشخصي، متابعة القراء وطلبة العلم، وتصفح موجز منشوراتهم',
      meta: 'حسابك ومتابعاتك',
      icon: <UserCircle2 className="w-6 h-6" />,
      accentClass: 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'prayers',
      title: 'الصلوات والأذان الشيعي',
      subtitle: 'مواقيت الصلاة الجعفرية وتشغيل الأذان الشيعي صوتياً',
      meta: `التالي: ${nextPrayer.label}`,
      icon: <Volume2 className="w-6 h-6" />,
      accentClass: 'bg-rose-50 text-[#881337] dark:bg-rose-950/60 dark:text-rose-300',
    },
    {
      id: 'tasbih',
      title: 'التسبيحات والمسبحة',
      subtitle: 'تسبيحة الزهراء (ع) والأذكار اليومية بالعداد التفاعلي',
      meta: `حصيلة اليوم: ${tasbihDailyTotal}`,
      icon: <Sparkles className="w-6 h-6" />,
      accentClass: 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'nawafil',
      title: 'النوافل اليومية',
      subtitle: 'جدول الـ ٥١ ركعة وصلاة الليل والشفع والوتر',
      meta: '٣٤ ركعة نافلة',
      icon: <ListChecks className="w-6 h-6" />,
      accentClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'lessons',
      title: 'الدروس الحوزوية',
      subtitle: 'منهج مرتب في الفقه والعقيدة والمنطق والنحو العربي',
      meta: `المنجز: ${completedLessonsCount} / ${totalLessonsCount}`,
      icon: <GraduationCap className="w-6 h-6" />,
      accentClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    },
    {
      id: 'qa',
      title: 'الأسئلة والأجوبة',
      subtitle: 'إجابات فقهية وعقائدية وقرآنية ولغوية موثقة',
      meta: `${QA_DATA.length} مسألة موثقة`,
      icon: <HelpCircle className="w-6 h-6" />,
      accentClass: 'bg-emerald-50 text-[#0F5132] dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'quiz',
      title: 'المسابقات الثقافية',
      subtitle: 'اختبارات معرفية في السيرة والطف والفقه والنحو والمنطق',
      meta: `${QUIZ_QUESTIONS.length} سؤالاً تفاعلياً`,
      icon: <Trophy className="w-6 h-6" />,
      accentClass: 'bg-rose-50 text-[#881337] dark:bg-rose-950/60 dark:text-rose-300',
    },
  ];

  return (
    <div className="space-y-10">
      {/* Workspace Utility Bar (Date & Theme Switcher outside Top Bar) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-stone-600 dark:text-stone-300">
          <span className="font-semibold text-[#0F5132] dark:text-emerald-400">{dates.hijri}</span>
          <span aria-hidden="true">·</span>
          <span>{dates.gregorian}</span>
          <span aria-hidden="true">·</span>
          <span>التوقيت الجعفري: {selectedCity.name}</span>
        </div>

        <button
          type="button"
          onClick={onToggleTheme}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-700" />}
          <span>{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
        </button>
      </div>

      {/* Daily Religious Stories Strip */}
      <StoriesBar currentUser={currentUser} onOpenUserProfile={onOpenUserProfile} />

      {/* Hero Split Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#E7E1D6] dark:border-[#1F2B37] min-h-[280px] lg:min-h-[360px] flex items-end bg-[#182620]">
          {!imgError ? (
            <img
              src={heroShrineImg}
              alt="العتبة الحسينية المقدسة في كربلاء"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F5132] via-[#122620] to-[#1C1917] flex items-center justify-center">
              <Compass className="w-20 h-20 text-amber-400/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />

          <div className="relative z-10 p-6 md:p-8 text-white max-w-2xl space-y-3">
            <p className="text-xs font-medium text-amber-300">
              زاد المؤمن وطالب العلم · علوم أهل البيت (عليهم السلام)
            </p>
            <h1 className="font-amiri text-3xl md:text-4xl font-bold leading-snug text-balance">
              المدونة الحسينية للعبادة والعلم والمعرفة
            </h1>
            <p className="text-sm md:text-base text-stone-200 leading-relaxed">
              تلاوة القرآن بالتشكيل الدقيق، الأدعية والأحاديث الموثقة، العتبات المقدسة، سير الصحابة والعلماء مع البوت التفاعلي، المناهج الحوزوية، وساحة المناقشة.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('quran')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0B3D26] text-white text-sm font-semibold cursor-pointer transition-colors"
              >
                فتح القرآن والتلاوة
              </button>
              <button
                type="button"
                onClick={() => onNavigate('forum')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-semibold cursor-pointer transition-colors border border-white/25"
              >
                دخول ساحة المناقشة
              </button>
            </div>
          </div>
        </div>

        {/* Live Prayer Summary Card */}
        <div className="lg:col-span-5 rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                أوقات الصلاة الجعفرية · {selectedCity.name}
              </span>
              <button
                type="button"
                onClick={() => onNavigate('prayers')}
                className="text-xs font-semibold text-[#0F5132] dark:text-emerald-400 hover:underline cursor-pointer min-h-[36px] flex items-center gap-1"
              >
                <span>التفاصيل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="pt-2 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400">الصلاة القادمة</p>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white mt-0.5">
                  {nextPrayer.label}
                </h2>
                <p className="text-xs text-[#0F5132] dark:text-emerald-400 font-medium mt-1">
                  {nextPrayer.remainingText}
                </p>
              </div>
              <div className="text-3xl font-bold tabular-nums text-[#0F5132] dark:text-emerald-400">
                {nextPrayer.time}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#E7E1D6] dark:border-[#1F2B37] text-center">
            <div className="p-2.5 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117]">
              <p className="text-xs text-stone-500 dark:text-stone-400">الفجر</p>
              <p className="text-sm font-bold tabular-nums text-stone-900 dark:text-white mt-1">
                {prayerSchedule.fajr}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117]">
              <p className="text-xs text-stone-500 dark:text-stone-400">الظهر</p>
              <p className="text-sm font-bold tabular-nums text-stone-900 dark:text-white mt-1">
                {prayerSchedule.dhuhr}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF8F4] dark:bg-[#0B1117]">
              <p className="text-xs text-stone-500 dark:text-stone-400">المغرب</p>
              <p className="text-sm font-bold tabular-nums text-stone-900 dark:text-white mt-1">
                {prayerSchedule.maghrib}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('prayers')}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E7E1D6] dark:border-[#1F2B37] hover:bg-stone-50 dark:hover:bg-slate-800/70 text-sm font-semibold text-stone-800 dark:text-stone-100 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Clock className="w-4 h-4 text-[#0F5132] dark:text-emerald-400" />
            <span>جدول المواقيت والأذان</span>
          </button>
        </div>
      </section>

      {/* Main Interactive Sections Grid - Every Icon Works on Tap */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-white">
            أقسام المدونة الحسينية
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            اضغط على أي أيقونة لفتح نافذتها الخاصة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickSections.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="group text-right rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-5 hover:border-[#0F5132]/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between min-h-[164px] active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.accentClass}`}
                >
                  {item.icon}
                </div>
                <ChevronLeft className="w-4 h-4 text-stone-400 group-hover:text-[#0F5132] dark:group-hover:text-emerald-400 transition-colors mt-1" />
              </div>

              <div className="mt-4 space-y-1.5">
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
                  {item.subtitle}
                </p>
                <p className="text-[11px] font-semibold text-[#0F5132] dark:text-emerald-400 pt-1 tabular-nums">
                  {item.meta}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Daily Narration / Wisdom */}
      <section className="rounded-2xl border border-[#E7E1D6] dark:border-[#1F2B37] bg-white dark:bg-[#121A22] p-6 md:p-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
            من كلمات سيد الشهداء الإمام الحسين (عليه السلام)
          </p>
          <blockquote className="font-amiri text-xl md:text-2xl text-stone-900 dark:text-stone-100 leading-relaxed">
            «إِنِّي لَا أَرَى الْمَوْتَ إِلَّا سَعَادَةً، وَلَا الْحَيَاةَ مَعَ الظَّالِمِينَ إِلَّا بَرَماً»
          </blockquote>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            تحف العقول · خطبة الإمام الحسين (عليه السلام) في مسيره إلى كربلاء
          </p>
        </div>
      </section>
    </div>
  );
};
