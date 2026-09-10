/**
 * Procedural noir score.
 *
 * Original music generated in the browser with the Web Audio API (no audio
 * files, no licensing issues). Each "track" is a mood: a chord progression,
 * a tempo, a timbre and a melody scale.
 */

export type TrackId = "mystery" | "triumph" | "tragic" | "above_law";

type Track = {
  bpm: number;
  /** root midi note of each bar's chord */
  progression: number[];
  /** semitone offsets forming the chord */
  chord: number[];
  /** scale offsets used by the solo line */
  scale: number[];
  /** solo octave offset in semitones from the chord root */
  lead: number;
  wave: OscillatorType;
  gain: number;
  /** chance a given eighth note plays a solo note */
  density: number;
};

const TRACKS: Record<TrackId, Track> = {
  // Smoky, unresolved: minor 9ths drifting under a muted-trumpet line.
  mystery: {
    bpm: 66,
    progression: [45, 45, 41, 43],
    chord: [0, 7, 10, 15],
    scale: [0, 2, 3, 5, 7, 8, 10],
    lead: 24,
    wave: "sine",
    gain: 0.16,
    density: 0.35,
  },
  // Ending I — cold, swaggering victory: major with a flat sixth.
  triumph: {
    bpm: 78,
    progression: [45, 50, 43, 45],
    chord: [0, 7, 11, 16],
    scale: [0, 2, 4, 5, 7, 9, 11],
    lead: 24,
    wave: "triangle",
    gain: 0.17,
    density: 0.45,
  },
  // Ending II — grief: slow, falling, almost still.
  tragic: {
    bpm: 48,
    progression: [40, 38, 36, 35],
    chord: [0, 3, 7, 14],
    scale: [0, 2, 3, 5, 7, 8, 10],
    lead: 12,
    wave: "sine",
    gain: 0.15,
    density: 0.22,
  },
  // Ending III — power, corruption: dark, circling, mechanical.
  above_law: {
    bpm: 92,
    progression: [38, 38, 40, 36],
    chord: [0, 5, 7, 10],
    scale: [0, 1, 3, 5, 7, 8, 10],
    lead: 24,
    wave: "sawtooth",
    gain: 0.12,
    density: 0.5,
  },
};

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class NoirScore {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private nextTime = 0;
  private step = 0;
  private track: TrackId = "mystery";
  private muted = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctx: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 1;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    return ctx;
  }

  start() {
    const ctx = this.ensure();
    if (!ctx) return;
    void ctx.resume();
    if (this.timer !== null) return;
    // gentle fade-in so the score never starts abruptly
    if (this.master && !this.muted) {
      const now = ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0.0001, now);
      this.master.gain.linearRampToValueAtTime(1, now + 3);
    }
    this.nextTime = ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 60);
  }


  setTrack(id: TrackId) {
    if (id === this.track) return;
    this.track = id;
    this.step = 0;
    if (this.ctx) this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 1, this.ctx.currentTime + 0.4);
    }
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = TRACKS[this.track];
    const eighth = 30 / t.bpm;
    while (this.nextTime < ctx.currentTime + 0.4) {
      this.playStep(this.nextTime, t);
      this.nextTime += eighth;
      this.step = (this.step + 1) % 32;
    }
  }

  private playStep(time: number, t: Track) {
    const bar = Math.floor(this.step / 8) % t.progression.length;
    const root = t.progression[bar]!;
    const beat = this.step % 8;

    // chord pad, once per bar
    if (beat === 0) {
      for (const off of t.chord) {
        this.tone(mtof(root + off + 12), time, (30 / t.bpm) * 8.5, t.gain * 0.32, "sine");
      }
      this.tone(mtof(root - 12), time, (30 / t.bpm) * 4, t.gain * 0.7, "sine");
    }
    // walking bass on the off beats
    if (beat === 4) {
      const off = t.scale[(bar * 2) % t.scale.length]!;
      this.tone(mtof(root - 12 + off), time, (30 / t.bpm) * 3, t.gain * 0.5, "sine");
    }
    // brushed-cymbal tick
    if (beat % 2 === 1) this.noise(time, 0.06, t.gain * 0.18);

    // solo line
    if (Math.random() < t.density) {
      const off = t.scale[Math.floor(Math.random() * t.scale.length)]!;
      const note = root + t.lead + off + (Math.random() < 0.25 ? 12 : 0);
      this.tone(mtof(note), time, (30 / t.bpm) * 1.6, t.gain * 0.45, t.wave);
    }
  }

  private tone(freq: number, time: number, dur: number, peak: number, wave: OscillatorType) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + Math.min(0.25, dur * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  private noise(time: number, dur: number, peak: number) {
    const ctx = this.ctx!;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.value = peak;
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(time);
  }
}
