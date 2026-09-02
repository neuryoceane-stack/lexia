/** Sons de feedback générés via Web Audio API (client uniquement). */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioContext) {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      audioContext = new AudioCtx();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  peakGain: number
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/** Ding bref, tonalité montante (~0,25 s). */
export function playCorrectSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const gain = 0.12;
    playTone(ctx, 523.25, t, 0.11, gain);
    playTone(ctx, 659.25, t + 0.09, 0.14, gain);
  } catch {
    /* audio indisponible — silencieux */
  }
}

/** Ton bref, tonalité descendante discrète (~0,28 s). */
export function playWrongSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const gain = 0.1;
    playTone(ctx, 233.08, t, 0.13, gain);
    playTone(ctx, 196.0, t + 0.1, 0.16, gain * 0.9);
  } catch {
    /* audio indisponible — silencieux */
  }
}
