/** Short, synthesized cues so the game needs no downloaded sound files. */
export interface Tone {
  readonly frequency: number;
  readonly at: number;
  readonly seconds: number;
  readonly volume: number;
  readonly wave: OscillatorType;
}

export const GET_READY: readonly Tone[] = [
  { frequency: 523.25, at: 0, seconds: 0.18, volume: 0.12, wave: "triangle" },
  { frequency: 659.25, at: 0.18, seconds: 0.18, volume: 0.12, wave: "triangle" },
  { frequency: 783.99, at: 0.36, seconds: 0.32, volume: 0.16, wave: "triangle" },
];

export const GAME_LOST: readonly Tone[] = [
  { frequency: 392, at: 0, seconds: 0.25, volume: 0.11, wave: "sawtooth" },
  { frequency: 311.13, at: 0.23, seconds: 0.25, volume: 0.11, wave: "sawtooth" },
  { frequency: 261.63, at: 0.46, seconds: 0.5, volume: 0.14, wave: "sawtooth" },
];

/** C5, D5, E5: each accepted Rule of Three use rises by one whole tone. */
export function ruleOfThreePitch(use: number): number {
  return 523.25 * 2 ** ((2 * (Math.max(1, Math.min(3, use)) - 2)) / 12);
}

let audioContext: AudioContext | null = null;

function schedule(context: AudioContext, tones: readonly Tone[]): void {
  const now = context.currentTime;
  for (const tone of tones) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + tone.at;
    const end = start + tone.seconds;
    oscillator.type = tone.wave;
    oscillator.frequency.setValueAtTime(tone.frequency, start);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(tone.volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}

export function playCue(tones: readonly Tone[]): void {
  if (typeof AudioContext === "undefined") return;
  audioContext ??= new AudioContext();
  const context = audioContext;
  if (context.state === "running") schedule(context, tones);
  else
    void context.resume().then(
      () => schedule(context, tones),
      () => undefined,
    );
}

export function playGetReady(): void {
  playCue(GET_READY);
}

export function playGameLost(): void {
  playCue(GAME_LOST);
}

export function playRuleOfThreeBeat(use: number): void {
  playCue([
    { frequency: ruleOfThreePitch(use), at: 0, seconds: 0.22, volume: 0.14, wave: "triangle" },
  ]);
}
