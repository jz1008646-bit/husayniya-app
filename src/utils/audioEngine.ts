// Clean Web Audio & Speech Synthesis helpers for Tasbih tactile sounds,
// Quran fallback recitation, and Shia Adhan resonant melody + voice.

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playTasbihClick(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Ignore audio context errors silently
  }
}

export function playPhaseCompleteChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.38);
    });
  } catch {
    // Ignore audio context errors silently
  }
}

/**
 * Plays a gentle resonant Bayati/Hijaz melodic chord sequence using Web Audio API
 * to accompany Adhan phrases when external MP3 streams are unavailable or selected in synthetic mode.
 */
export function playAdhanPhraseTone(phraseIndex: number): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const scale = [293.66, 329.63, 349.23, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66];
    const baseFreq = scale[phraseIndex % scale.length];
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.45);
    osc2.stop(now + 1.45);
  } catch {
    // Ignore audio errors
  }
}

export function stopArabicSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakArabicText(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
    onError?: () => void;
  }
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }
    utterance.lang = 'ar-SA';
    utterance.rate = options?.rate ?? 0.85;
    utterance.pitch = options?.pitch ?? 1.0;

    if (options?.onEnd) utterance.onend = options.onEnd;
    if (options?.onError) utterance.onerror = options.onError;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export const SHIA_ADHAN_PHRASES = [
  { text: 'اللَّهُ أَكْبَرُ (أربع مرات)', repeat: 4, durationMs: 3600 },
  { text: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ (مرتان)', repeat: 2, durationMs: 3800 },
  { text: 'أَشْهَدُ أَنَّ مُحَمَّداً رَسُولُ اللَّهِ (مرتان)', repeat: 2, durationMs: 4200 },
  { text: 'أَشْهَدُ أَنَّ عَلِيّاً وَلِيُّ اللَّهِ (مرتان)', repeat: 2, durationMs: 4200 },
  { text: 'حَيَّ عَلَى الصَّلَاةِ (مرتان)', repeat: 2, durationMs: 3600 },
  { text: 'حَيَّ عَلَى الْفَلَاحِ (مرتان)', repeat: 2, durationMs: 3600 },
  { text: 'حَيَّ عَلَى خَيْرِ الْعَمَلِ (مرتان)', repeat: 2, durationMs: 4000 },
  { text: 'اللَّهُ أَكْبَرُ (مرتان)', repeat: 2, durationMs: 3200 },
  { text: 'لَا إِلَهَ إِلَّا اللَّهُ (مرتان)', repeat: 2, durationMs: 3800 },
];

// Curated public-domain / open Shia Adhan audio streams (with graceful synthetic + voice fallback)
export const SHIA_ADHAN_STREAMS = [
  {
    id: 'najaf',
    name: 'أذان العتبة العلوية والكاظمية (النغم العراقي)',
    url: 'https://www.islamcan.com/audio/adhan/azan1.mp3',
  },
  {
    id: 'karbala',
    name: 'الأذان الشيعي الكامل (القراءة الهادئة)',
    url: 'https://cdn.al-islam.org/sites/default/files/audio/azan-shia.mp3',
  },
];
