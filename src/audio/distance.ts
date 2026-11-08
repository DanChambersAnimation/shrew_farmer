/** A shared room treatment for audience sounds, heard from the Speaker's position. */
export const CROWD_DISTANCE = {
  lowpassHz: 2400,
  directGain: 0.46,
  reflectionDelaySeconds: 0.055,
  reflectionGain: 0.11,
} as const;

/**
 * Distant voices lose high-frequency detail and their direct sound is quieter.
 * One soft, delayed reflection adds a little room without a distinct echo.
 * All crowd clips share this bus so their relative levels stay intact.
 */
export function createCrowdDistanceBus(audio: AudioContext): AudioNode {
  const input = audio.createGain();
  const lowpass = audio.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = CROWD_DISTANCE.lowpassHz;
  lowpass.Q.value = 0.7;

  const direct = audio.createGain();
  direct.gain.value = CROWD_DISTANCE.directGain;
  const reflection = audio.createDelay(0.1);
  reflection.delayTime.value = CROWD_DISTANCE.reflectionDelaySeconds;
  const reflected = audio.createGain();
  reflected.gain.value = CROWD_DISTANCE.reflectionGain;

  input.connect(lowpass);
  lowpass.connect(direct).connect(audio.destination);
  lowpass.connect(reflection).connect(reflected).connect(audio.destination);
  return input;
}
