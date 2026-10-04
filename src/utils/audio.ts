/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private riverGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private riverFilter: BiquadFilterNode | null = null;
  private nextBirdTime = 0;

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Continuous River Sound Generator (band-pass filtered brownian noise)
      this.initRiverSound();
      // Gentle wind breeze
      this.initWindSound();
    } catch {
      // AudioContext not allowed or failed
    }
  }

  private initRiverSound(): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.025 * white) / 1.025;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.riverFilter = this.ctx.createBiquadFilter();
    this.riverFilter.type = 'bandpass';
    this.riverFilter.frequency.value = 480;
    this.riverFilter.Q.value = 1.2;

    this.riverGain = this.ctx.createGain();
    this.riverGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    whiteNoise.connect(this.riverFilter);
    this.riverFilter.connect(this.riverGain);
    this.riverGain.connect(this.masterGain);
    whiteNoise.start();
  }

  private initWindSound(): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.015 * white) / 1.015;
      lastOut = output[i];
    }

    const windNoise = this.ctx.createBufferSource();
    windNoise.buffer = noiseBuffer;
    windNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 260;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    windNoise.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windNoise.start();
  }

  public updateRiverProximity(distToRiver: number): void {
    if (!this.riverGain || !this.ctx || this.isMuted) return;
    // Volume scales up as player gets closer to river (from 40m down to 2m)
    const t = Math.max(0, Math.min(1, 1 - (distToRiver - 2) / 38));
    const targetVol = t * 0.45;
    this.riverGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
  }

  public playFootstep(surface: 'earth' | 'wood' | 'water'): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (surface === 'wood') {
      // Hollow wooden deck clop
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (surface === 'water') {
      // Wet water splash
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.15), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
      }
      const splash = this.ctx.createBufferSource();
      splash.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 400, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      splash.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      splash.start(now);
    } else {
      // Muffled dirt / grass step
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85 + Math.random() * 20, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  public updateAmbientBirds(nowSeconds: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    if (nowSeconds > this.nextBirdTime) {
      this.playBirdChirp();
      this.nextBirdTime = nowSeconds + 6.0 + Math.random() * 12.0;
    }
  }

  private playBirdChirp(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 2200 + Math.random() * 1200;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq + 600, now + 0.08);
    osc.frequency.linearRampToValueAtTime(baseFreq - 200, now + 0.15);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playBinocularsClick(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  public playShutter(): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const makeClick = (t: number, freq: number) => {
        const buf = this.ctx!.createBuffer(1, Math.floor(this.ctx!.sampleRate * 0.035), this.ctx!.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
        }
        const src = this.ctx!.createBufferSource();
        src.buffer = buf;
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = freq;
        const gain = this.ctx!.createGain();
        gain.gain.value = 0.55;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);
        src.start(t);
      };
      makeClick(now, 2600);
      makeClick(now + 0.075, 1500);
    } catch {}
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const audioManager = new AudioManager();
