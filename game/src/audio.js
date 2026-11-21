// Tiny synthesised sound, no audio files: footsteps, a pebble's clink, a relic's chime, the
// alarm sting and the win phrase, all from one oscillator through a gain envelope. The audio
// context is created on the first user gesture, so a quiet page never complains.

export function createAudio() {
  let context = null;
  let master = null;
  let lastStep = 0;

  function ensure() {
    if (context !== null) return true;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.16;
      master.connect(context.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(frequency, duration, type, volume, when = 0) {
    if (!ensure() || context.state === 'suspended') return;
    const start = context.currentTime + when;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  function noiseBurst(duration, volume) {
    if (!ensure() || context.state === 'suspended') return;
    const start = context.currentTime;
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length);
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  return {
    /** Call from any user gesture so later sounds are allowed to play. */
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume().catch(() => {});
    },
    /** A soft footstep, throttled so it ticks about twice a second while walking. */
    step(now, sneaking) {
      if (now - lastStep < (sneaking ? 520 : 300)) return;
      lastStep = now;
      noiseBurst(0.05, sneaking ? 0.12 : 0.3);
    },
    pebble() {
      tone(1900, 0.09, 'triangle', 0.5);
      tone(1300, 0.12, 'triangle', 0.35, 0.07);
    },
    relic() {
      tone(880, 0.16, 'sine', 0.6);
      tone(1318, 0.22, 'sine', 0.5, 0.08);
    },
    spotted() {
      tone(220, 0.28, 'sawtooth', 0.5);
      tone(233, 0.28, 'sawtooth', 0.5, 0.02);
      tone(440, 0.2, 'square', 0.25, 0.05);
    },
    caught() {
      tone(160, 0.5, 'sawtooth', 0.55);
      tone(110, 0.6, 'sawtooth', 0.5, 0.12);
    },
    level() {
      tone(523, 0.14, 'sine', 0.5);
      tone(659, 0.14, 'sine', 0.5, 0.12);
      tone(784, 0.26, 'sine', 0.55, 0.24);
    },
    win() {
      [523, 659, 784, 1046].forEach((frequency, index) => {
        tone(frequency, 0.3, 'sine', 0.5, index * 0.14);
      });
    },
  };
}
