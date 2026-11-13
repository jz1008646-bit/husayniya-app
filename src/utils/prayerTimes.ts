import { CityLocation, PrayerSchedule } from '../types';

export const SHIA_CITIES: CityLocation[] = [
  { id: 'karbala', name: 'كربلاء المقدسة', country: 'العراق', lat: 32.616, lng: 44.0249, timezone: 3 },
  { id: 'najaf', name: 'النجف الأشرف', country: 'العراق', lat: 31.9996, lng: 44.3267, timezone: 3 },
  { id: 'baghdad', name: 'بغداد (الكاظمية)', country: 'العراق', lat: 33.38, lng: 44.342, timezone: 3 },
  { id: 'basra', name: 'البصرة', country: 'العراق', lat: 30.5085, lng: 47.7804, timezone: 3 },
  { id: 'qom', name: 'قم المقدسة', country: 'إيران', lat: 34.6401, lng: 50.8764, timezone: 3.5 },
  { id: 'mashhad', name: 'مشهد المقدسة', country: 'إيران', lat: 36.2972, lng: 59.6067, timezone: 3.5 },
  { id: 'qatif', name: 'القطيف والأحساء', country: 'السعودية', lat: 26.5196, lng: 50.0115, timezone: 3 },
  { id: 'manama', name: 'المنامة', country: 'البحرين', lat: 26.2285, lng: 50.586, timezone: 3 },
  { id: 'beirut', name: 'بيروت', country: 'لبنان', lat: 33.8938, lng: 35.5018, timezone: 2 },
  { id: 'kuwait', name: 'الكويت', country: 'الكويت', lat: 29.3759, lng: 47.9774, timezone: 3 },
];

const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;

const fixAngle = (a: number) => {
  const res = a - 360 * Math.floor(a / 360);
  return res < 0 ? res + 360 : res;
};

const fixHour = (h: number) => {
  const res = h - 24 * Math.floor(h / 24);
  return res < 0 ? res + 24 : res;
};

function julianDate(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number): { decl: number; eqTime: number } {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(deg2rad(g)) + 0.02 * Math.sin(deg2rad(2 * g)));
  const e = 23.439 - 0.00000036 * D;
  const RA = rad2deg(Math.atan2(Math.cos(deg2rad(e)) * Math.sin(deg2rad(L)), Math.cos(deg2rad(L)))) / 15;
  const eqTime = q / 15 - fixHour(RA);
  const decl = rad2deg(Math.asin(Math.sin(deg2rad(e)) * Math.sin(deg2rad(L))));
  return { decl, eqTime };
}

function computeHourAngle(lat: number, decl: number, angle: number): number {
  const term =
    (-Math.sin(deg2rad(angle)) - Math.sin(deg2rad(lat)) * Math.sin(deg2rad(decl))) /
    (Math.cos(deg2rad(lat)) * Math.cos(deg2rad(decl)));
  const clamped = Math.max(-1, Math.min(1, term));
  return rad2deg(Math.acos(clamped)) / 15;
}

function formatHour(hourFloat: number): string {
  const normalized = fixHour(hourFloat);
  const totalMinutes = Math.round(normalized * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function toMinutes(hourFloat: number): number {
  const normalized = fixHour(hourFloat);
  return Math.round(normalized * 60) % 1440;
}

/**
 * Calculates Jafari (Shia Ithna-Ashari / Leva Institute Qom) prayer times:
 * - Fajr: 16 deg
 * - Maghrib: 4 deg after sunset
 * - Isha: 14 deg
 * - Midnight: Halfway between Sunset and Fajr
 */
export function calculateJafariPrayerTimes(city: CityLocation, date = new Date()): PrayerSchedule {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = julianDate(year, month, day) - city.lng / (15 * 24);
  const { decl, eqTime } = sunPosition(jd + 0.5);

  const dhuhr = 12 + city.timezone - city.lng / 15 - eqTime;

  const fajrHA = computeHourAngle(city.lat, decl, 16);
  const fajr = dhuhr - fajrHA;

  const sunriseHA = computeHourAngle(city.lat, decl, 0.833);
  const sunrise = dhuhr - sunriseHA;
  const sunset = dhuhr + sunriseHA;

  const asrAngle = -rad2deg(Math.atan(1 / (1 + Math.tan(deg2rad(Math.abs(city.lat - decl))))));
  const asrHA = computeHourAngle(city.lat, decl, asrAngle);
  const asr = dhuhr + asrHA;

  const maghribHA = computeHourAngle(city.lat, decl, 4);
  const maghrib = dhuhr + maghribHA;

  const ishaHA = computeHourAngle(city.lat, decl, 14);
  const isha = dhuhr + ishaHA;

  // Jafari midnight: midpoint between sunset and next fajr
  const nightDuration = fixHour(fajr - sunset);
  const midnight = fixHour(sunset + nightDuration / 2);

  return {
    fajr: formatHour(fajr),
    sunrise: formatHour(sunrise),
    dhuhr: formatHour(dhuhr),
    asr: formatHour(asr),
    sunset: formatHour(sunset),
    maghrib: formatHour(maghrib),
    isha: formatHour(isha),
    midnight: formatHour(midnight),
    rawMinutes: {
      fajr: toMinutes(fajr),
      sunrise: toMinutes(sunrise),
      dhuhr: toMinutes(dhuhr),
      asr: toMinutes(asr),
      sunset: toMinutes(sunset),
      maghrib: toMinutes(maghrib),
      isha: toMinutes(isha),
      midnight: toMinutes(midnight),
    },
  };
}

export function getNextPrayer(schedule: PrayerSchedule, now = new Date()): {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  label: string;
  time: string;
  remainingText: string;
} {
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const ordered: Array<{
    key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    label: string;
    time: string;
    mins: number;
  }> = [
    { key: 'fajr', label: 'صلاة الفجر', time: schedule.fajr, mins: schedule.rawMinutes.fajr },
    { key: 'dhuhr', label: 'صلاة الظهر', time: schedule.dhuhr, mins: schedule.rawMinutes.dhuhr },
    { key: 'asr', label: 'صلاة العصر', time: schedule.asr, mins: schedule.rawMinutes.asr },
    { key: 'maghrib', label: 'صلاة المغرب', time: schedule.maghrib, mins: schedule.rawMinutes.maghrib },
    { key: 'isha', label: 'صلاة العشاء', time: schedule.isha, mins: schedule.rawMinutes.isha },
  ];

  let next = ordered.find((p) => p.mins > currentMins);
  let diffMins = 0;

  if (next) {
    diffMins = next.mins - currentMins;
  } else {
    next = ordered[0];
    diffMins = 1440 - currentMins + next.mins;
  }

  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  const remainingText =
    hrs > 0
      ? `متبقي ${hrs} ساعة و ${mins} دقيقة`
      : `متبقي ${mins} دقيقة`;

  return {
    key: next.key,
    label: next.label,
    time: next.time,
    remainingText,
  };
}

export function getArabicDates(date = new Date()): { hijri: string; gregorian: string } {
  let hijri = '';
  let gregorian = '';

  try {
    hijri = new Intl.DateTimeFormat('ar-IQ-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    hijri = 'التقويم الهجري';
  }

  try {
    gregorian = new Intl.DateTimeFormat('ar-IQ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    gregorian = date.toLocaleDateString('ar');
  }

  return { hijri, gregorian };
}
