import React from 'react';
import {
  Home,
  BookOpen,
  Headphones,
  Clock,
  Sparkles,
  GraduationCap,
  HelpCircle,
  Trophy,
  ListChecks,
  Landmark,
  Users,
  Library,
  MessageSquare,
  UserCircle2,
} from 'lucide-react';
import { SectionId } from '../types';

interface NavbarProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onNavigate }) => {
  const topNavItems: Array<{ id: SectionId; label: string; matchIds?: SectionId[] }> = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'duas', label: 'الأدعية والقرآن', matchIds: ['duas', 'quran'] },
    { id: 'places', label: 'الأماكن والشخصيات', matchIds: ['places', 'figures'] },
    { id: 'library', label: 'المكتبة والدروس', matchIds: ['library', 'lessons', 'qa', 'quiz'] },
    { id: 'forum', label: 'ساحة المناقشة', matchIds: ['forum', 'profile'] },
  ];

  const mobileTabs: Array<{ id: SectionId; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { id: 'quran', label: 'القرآن', icon: <Headphones className="w-5 h-5" /> },
    { id: 'places', label: 'العتبات', icon: <Landmark className="w-5 h-5" /> },
    { id: 'forum', label: 'المناقشة', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'profile', label: 'ملفي', icon: <UserCircle2 className="w-5 h-5" /> },
  ];

  const subSectionLinks: Array<{ id: SectionId; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'الرئيسية', icon: <Home className="w-4 h-4" /> },
    { id: 'profile', label: 'الملف الشخصي والمتابعة', icon: <UserCircle2 className="w-4 h-4" /> },
    { id: 'duas', label: 'الأدعية والأحاديث', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quran', label: 'القرآن (صوت وتشكيل)', icon: <Headphones className="w-4 h-4" /> },
    { id: 'places', label: 'الأماكن الدينية', icon: <Landmark className="w-4 h-4" /> },
    { id: 'figures', label: 'الصحابة والعلماء + البوت', icon: <Users className="w-4 h-4" /> },
    { id: 'library', label: 'المكتبة والمناهج', icon: <Library className="w-4 h-4" /> },
    { id: 'forum', label: 'ساحة المناقشة', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'prayers', label: 'الصلوات والأذان', icon: <Clock className="w-4 h-4" /> },
    { id: 'tasbih', label: 'التسبيحات', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'nawafil', label: 'النوافل', icon: <ListChecks className="w-4 h-4" /> },
    { id: 'lessons', label: 'الدروس الحوزوية', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'qa', label: 'أسئلة وأجوبة', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'quiz', label: 'المسابقات', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop & Mobile Top Navigation Bar - Strict 3-Zone Contract */}
      <header className="sticky top-0 z-30 h-12 md:h-16 bg-[#FAF8F4]/95 dark:bg-[#0B1117]/95 backdrop-blur-md border-b border-[#E7E1D6] dark:border-[#1F2B37]">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-6">
          {/* Zone 1: Single-line Brand Title */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="font-amiri text-xl md:text-2xl font-bold tracking-tight text-[#0F5132] dark:text-emerald-400 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            المدونة الحسينية
          </button>

          {/* Zone 2: 5 concise single-line text links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium" aria-label="التنقل الرئيسي">
            {topNavItems.map((item) => {
              const isActive = item.matchIds
                ? item.matchIds.includes(activeSection)
                : activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`py-2 px-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 ${
                    isActive
                      ? 'text-[#0F5132] dark:text-emerald-400 border-[#0F5132] dark:border-emerald-400 font-semibold'
                      : 'text-stone-600 dark:text-stone-300 border-transparent hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('tasbih')}
              className="min-h-[38px] md:min-h-[44px] px-4 py-2 text-xs md:text-sm font-semibold rounded-xl bg-[#0F5132] text-white hover:bg-[#0B3D26] dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm active:scale-[0.98]"
            >
              المسبحة الإلكترونية
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Quick Section Ribbon for 1-tap access to all 13 modules */}
      <div className="bg-white/85 dark:bg-[#121A22]/85 border-b border-[#E7E1D6] dark:border-[#1F2B37]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {subSectionLinks.map((link) => {
            const active = activeSection === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate(link.id)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-[#0F5132] text-white dark:bg-emerald-600'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Fixed Bottom Tab Bar (Thumb-Zone Ergonomics) */}
      <nav
        aria-label="التنقل السفلي"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-[#121A22]/95 backdrop-blur-md border-t border-[#E7E1D6] dark:border-[#1F2B37]"
      >
        <div className="grid grid-cols-5 h-full">
          {mobileTabs.map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer transition-colors ${
                  isActive
                    ? 'text-[#0F5132] dark:text-emerald-400 font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {tab.icon}
                <span className="text-[11px] mt-0.5 whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
