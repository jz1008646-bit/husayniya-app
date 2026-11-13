export type SectionId =
  | 'home'
  | 'duas'
  | 'quran'
  | 'places'
  | 'figures'
  | 'library'
  | 'forum'
  | 'prayers'
  | 'tasbih'
  | 'nawafil'
  | 'lessons'
  | 'qa'
  | 'quiz'
  | 'profile';

export interface DuaItem {
  id: string;
  title: string;
  category: 'أدعية' | 'زيارات' | 'مناجاة';
  occasion: string;
  source: string;
  intro: string;
  paragraphs: string[];
}

export interface HadithItem {
  id: string;
  title: string;
  narrator: string;
  source: string;
  arabicText: string;
  explanation: string;
}

export interface QuranAyah {
  number: number;
  text: string;
  tafsir: string;
}

export interface QuranSurah {
  id: number;
  name: string;
  revelationType: 'مكية' | 'مدنية';
  ayahCount: number;
  audioUrlAlafasy: string;
  audioUrlHusary: string;
  ayahs: QuranAyah[];
  note?: string;
}

export interface SacredPlace {
  id: string;
  name: string;
  city: string;
  country: string;
  category: 'العتبات المقدسة' | 'المساجد والمقامات' | 'الحرم النبوي والبقيع';
  imageKey: 'karbala' | 'najaf' | 'kadhimiya' | 'mashhad' | 'study';
  summary: string;
  history: string;
  virtue: string;
  recommendedAmal: string;
}

export interface ReligiousFigure {
  id: string;
  name: string;
  title: string;
  category: 'الصحابة المنتجبون' | 'العلماء الأعلام' | 'سيرة أهل البيت';
  era: string;
  imageKey: 'sahaba' | 'scholars' | 'karbala' | 'najaf';
  summary: string;
  biography: string;
  achievements: string[];
  famousQuote: string;
}

export interface BookFullChapter {
  title: string;
  content: string;
}

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  stage: 'المقدمات' | 'السطوح' | 'البحث الخارج' | 'الحديث والتفسير' | 'الأخلاق والأدعية';
  subject: string;
  volumes: string;
  description: string;
  chapters: string[];
  excerpt: string;
  fullChapters?: BookFullChapter[];
}

export interface DiscussionTopic {
  id: string;
  title: string;
  body: string;
  category: 'فقهية' | 'عقائدية' | 'قرآنية' | 'منطق ونحو' | 'سيرة وتاريخ' | 'عامة';
  authorId: string;
  authorName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface DiscussionReply {
  id: string;
  topicId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt?: unknown;
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: number;
}

export interface PrayerSchedule {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  sunset: string;
  maghrib: string;
  isha: string;
  midnight: string;
  rawMinutes: Record<
    'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'sunset' | 'maghrib' | 'isha' | 'midnight',
    number
  >;
}

export interface NawafilItem {
  id: string;
  name: string;
  rakahs: number;
  timing: string;
  method: string;
  virtue: string;
  steps: string[];
}

export type LessonDiscipline = 'fiqh' | 'aqeedah' | 'logic' | 'nahw';

export interface LessonItem {
  id: string;
  discipline: LessonDiscipline;
  number: string;
  title: string;
  level: string;
  duration: string;
  summary: string;
  sections: {
    heading: string;
    body: string;
    example?: string;
  }[];
  keyTakeaway: string;
}

export interface QAItem {
  id: string;
  category: 'فقهية' | 'عقائدية' | 'قرآنية' | 'منطق ونحو';
  question: string;
  answer: string;
  reference: string;
}

export interface QuizQuestion {
  id: string;
  category: 'القرآن والسيرة' | 'الفقه والعقيدة' | 'المنطق والنحو' | 'واقعة الطف';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type StudyStage =
  | 'قارئ ومحب'
  | 'طالب مقدمات'
  | 'طالب سطوح'
  | 'طالب بحث خارج'
  | 'أستاذ وباحث';

export interface PublicProfile {
  userId: string;
  displayName: string;
  bio: string;
  studyStage: StudyStage;
  city: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserFollow {
  id: string;
  followerId: string;
  followerName: string;
  targetId: string;
  targetName: string;
  createdAt?: unknown;
}

export type StoryCategory =
  | 'آية وتأمل'
  | 'حديث مأثور'
  | 'دعاء وذكر'
  | 'فائدة حوزوية'
  | 'زيارة وعتبة';

export type StoryThemeColor = 'emerald' | 'amber' | 'rose' | 'slate';

export interface StoryItem {
  id: string;
  authorId: string;
  authorName: string;
  category: StoryCategory;
  caption: string;
  reference: string;
  themeColor: StoryThemeColor;
  createdAt?: unknown;
  expiresAt?: unknown;
}

export interface QuranSurahMeta {
  id: number;
  name: string;
  revelationType: 'مكية' | 'مدنية';
  ayahCount: number;
}
