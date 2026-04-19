type AmbientKind = "none" | "brown-noise" | "rain" | "cafe";

class AmbientPlayer {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | ScriptProcessorNode | null = null;
  private gain: GainNode | null = null;
  private current: AmbientKind = "none";

  private ensureCtx() {
    if (!this.ctx) {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      this.ctx = new Ctor();
    }
    return this.ctx!;
  }

  private makeBrownNoise(ctx: AudioContext) {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    return src;
  }

  private makeRain(ctx: AudioContext) {
    const bufferSize = 4 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = white * 0.4;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  private makeCafe(ctx: AudioContext) {
    const bufferSize = 6 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.05 * white) / 1.05;
      output[i] = lastOut * 2.5;
      if (i % (ctx.sampleRate * 2) === 0) output[i] += (Math.random() - 0.5) * 0.3;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  async play(kind: AmbientKind) {
    if (kind === this.current) return;
    this.stop();
    if (kind === "none") return;
    const ctx = this.ensureCtx();
    if (ctx.state === "suspended") await ctx.resume();

    let src: AudioBufferSourceNode;
    let filterFreq = 800;
    if (kind === "brown-noise") {
      src = this.makeBrownNoise(ctx);
      filterFreq = 400;
    } else if (kind === "rain") {
      src = this.makeRain(ctx);
      filterFreq = 1200;
    } else {
      src = this.makeCafe(ctx);
      filterFreq = 900;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.6);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();

    this.source = src;
    this.gain = gain;
    this.current = kind;
  }

  stop() {
    if (!this.ctx || !this.source || !this.gain) {
      this.current = "none";
      return;
    }
    try {
      this.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      const src = this.source as AudioBufferSourceNode;
      setTimeout(() => {
        try { src.stop(); } catch {}
      }, 400);
    } catch {}
    this.source = null;
    this.gain = null;
    this.current = "none";
  }

  chime() {
    const ctx = this.ensureCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.8);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.9);
    });
  }
}

export const ambientPlayer = typeof window !== "undefined" ? new AmbientPlayer() : (null as unknown as AmbientPlayer);
