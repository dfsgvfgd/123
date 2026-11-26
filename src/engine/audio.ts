import type { AudioSettings } from '../game/types';

export type BgmTrackId =
  | 'title'
  | 'lobby'
  | 'enchant'
  | 'stage_1'
  | 'stage_2'
  | 'stage_3'
  | 'stage_4'
  | 'stage_5'
  | 'stage_6'
  | 'stage_7'
  | 'stage_8'
  | 'stage_9'
  | 'stage_10';

interface BgmSpec {
  stepMs: number;
  wave: OscillatorType;
  harmonyWave: OscillatorType;
  bassWave: OscillatorType;
  leadFilterHz: number;
  padHz?: number;
  drumPattern: string; // 16-char pattern: K=kick, S=snare, H=hihat, .=rest
  melody: number[];
  harmony: number[];
  bass: number[];
}

// 13 Distinct dark-fantasy procedural BGM compositions:
// Title, Lobby & Enchant Room are tranquil, dark-magical sanctuary ambiences (NO battle percussion).
// Stage 1..10 feature rich multi-voice themes tailored to each Stage Boss.
export const BGM_TRACKS: Record<BgmTrackId, BgmSpec> = {
  title: {
    stepMs: 420,
    wave: 'sine',
    harmonyWave: 'triangle',
    bassWave: 'sine',
    leadFilterHz: 2100,
    padHz: 110.0,
    drumPattern: '........',
    melody: [293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 329.63],
    harmony: [220.0, 0, 261.63, 0, 220.0, 0, 196.0, 0],
    bass: [146.83, 0, 110.0, 0, 130.81, 0, 110.0, 0],
  },
  lobby: {
    // Calm, mysterious torchlit stone sanctuary — serene celesta/harp tones, warm pad, zero drums
    stepMs: 400,
    wave: 'sine',
    harmonyWave: 'triangle',
    bassWave: 'sine',
    leadFilterHz: 1950,
    padHz: 130.81,
    drumPattern: '................',
    melody: [
      329.63, 0, 392.0, 493.88, 587.33, 0, 493.88, 440.0,
      392.0, 0, 329.63, 293.66, 329.63, 0, 392.0, 246.94,
    ],
    harmony: [
      164.81, 246.94, 0, 293.66, 196.0, 293.66, 0, 246.94,
      146.83, 220.0, 0, 261.63, 164.81, 246.94, 0, 196.0,
    ],
    bass: [
      130.81, 0, 0, 0, 146.83, 0, 0, 0,
      110.0, 0, 0, 0, 123.47, 0, 0, 0,
    ],
  },
  enchant: {
    // Ethereal, crystalline arcane workshop & forge sanctum — shimmering mystic chimes, zero drums
    stepMs: 360,
    wave: 'sine',
    harmonyWave: 'sine',
    bassWave: 'triangle',
    leadFilterHz: 2450,
    padHz: 146.83,
    drumPattern: '................',
    melody: [
      392.0, 466.16, 0, 587.33, 698.46, 0, 587.33, 523.25,
      466.16, 0, 523.25, 622.25, 587.33, 466.16, 392.0, 0,
    ],
    harmony: [
      196.0, 293.66, 349.23, 0, 233.08, 349.23, 0, 293.66,
      174.61, 261.63, 311.13, 0, 196.0, 293.66, 0, 233.08,
    ],
    bass: [
      146.83, 0, 0, 0, 174.61, 0, 0, 0,
      155.56, 0, 0, 0, 146.83, 0, 0, 0,
    ],
  },
  // Stage 1: Reruntuhan Lumut Slime — eerie emerald ruins & cavern resonance
  stage_1: {
    stepMs: 220,
    wave: 'triangle',
    harmonyWave: 'sine',
    bassWave: 'triangle',
    leadFilterHz: 2200,
    padHz: 98.0,
    drumPattern: 'K..HS..HK.HHS..H',
    melody: [392.0, 466.16, 523.25, 466.16, 587.33, 523.25, 466.16, 392.0, 349.23, 440.0, 523.25, 659.25, 587.33, 523.25, 440.0, 349.23],
    harmony: [196.0, 293.66, 261.63, 0, 293.66, 349.23, 233.08, 0, 174.61, 261.63, 261.63, 0, 293.66, 0, 220.0, 0],
    bass: [196.0, 0, 146.83, 196.0, 174.61, 0, 130.81, 174.61, 146.83, 0, 110.0, 146.83, 130.81, 0, 98.0, 130.81],
  },
  // Stage 2: Perkemahan Perang Goblin — fast tribal war drums & brassy camp march
  stage_2: {
    stepMs: 180,
    wave: 'sawtooth',
    harmonyWave: 'triangle',
    bassWave: 'sawtooth',
    leadFilterHz: 1750,
    padHz: 98.0,
    drumPattern: 'KKHSKKSHKSHKSSHK',
    melody: [261.63, 261.63, 311.13, 392.0, 349.23, 311.13, 293.66, 246.94, 261.63, 311.13, 392.0, 466.16, 392.0, 349.23, 311.13, 293.66],
    harmony: [196.0, 0, 233.08, 0, 196.0, 0, 174.61, 0, 196.0, 0, 261.63, 0, 233.08, 0, 196.0, 0],
    bass: [130.81, 98.0, 130.81, 155.56, 116.54, 98.0, 123.47, 98.0, 130.81, 98.0, 130.81, 174.61, 155.56, 130.81, 123.47, 98.0],
  },
  // Stage 3: Katedral Besi Hitam — heavy solemn gothic cathedral organ
  stage_3: {
    stepMs: 245,
    wave: 'sawtooth',
    harmonyWave: 'sawtooth',
    bassWave: 'triangle',
    leadFilterHz: 1550,
    padHz: 110.0,
    drumPattern: 'K...S...K..KS..H',
    melody: [220.0, 261.63, 329.63, 440.0, 415.3, 329.63, 293.66, 246.94, 220.0, 246.94, 261.63, 329.63, 392.0, 349.23, 329.63, 246.94],
    harmony: [164.81, 196.0, 220.0, 261.63, 246.94, 220.0, 196.0, 164.81, 164.81, 196.0, 220.0, 261.63, 293.66, 261.63, 246.94, 196.0],
    bass: [110.0, 110.0, 164.81, 110.0, 103.83, 103.83, 146.83, 123.47, 110.0, 110.0, 130.81, 164.81, 98.0, 98.0, 123.47, 110.0],
  },
  // Stage 4: Kripta Jaring & Kelelawar — skittering spider crypt staccato arpeggio
  stage_4: {
    stepMs: 145,
    wave: 'sawtooth',
    harmonyWave: 'square',
    bassWave: 'triangle',
    leadFilterHz: 2400,
    padHz: 123.47,
    drumPattern: 'KHHHHSHHKHHHHSHS',
    melody: [246.94, 493.88, 369.99, 587.33, 440.0, 369.99, 277.18, 493.88, 246.94, 493.88, 392.0, 659.25, 493.88, 369.99, 329.63, 277.18],
    harmony: [185.0, 0, 220.0, 0, 185.0, 0, 164.81, 0, 185.0, 0, 246.94, 0, 220.0, 0, 185.0, 0],
    bass: [123.47, 0, 185.0, 123.47, 110.0, 0, 146.83, 123.47, 123.47, 0, 185.0, 123.47, 98.0, 0, 138.59, 123.47],
  },
  // Stage 5: Palung Laut Siren — deep shimmering underwater Lydian harp currents
  stage_5: {
    stepMs: 255,
    wave: 'sine',
    harmonyWave: 'sine',
    bassWave: 'sine',
    leadFilterHz: 2700,
    padHz: 130.81,
    drumPattern: 'K..H..H.K..H.S..',
    melody: [523.25, 659.25, 739.99, 987.77, 880.0, 739.99, 659.25, 587.33, 493.88, 587.33, 739.99, 880.0, 783.99, 659.25, 587.33, 493.88],
    harmony: [261.63, 329.63, 369.99, 493.88, 440.0, 369.99, 329.63, 293.66, 246.94, 293.66, 369.99, 440.0, 392.0, 329.63, 293.66, 246.94],
    bass: [130.81, 0, 196.0, 0, 146.83, 0, 110.0, 0, 123.47, 0, 185.0, 0, 164.81, 0, 123.47, 0],
  },
  // Stage 6: Kuil Giok Manusia Ular — hypnotic Phrygian serpent flute
  stage_6: {
    stepMs: 192,
    wave: 'triangle',
    harmonyWave: 'sine',
    bassWave: 'sawtooth',
    leadFilterHz: 1950,
    padHz: 110.0,
    drumPattern: 'K.HSK.H.K.HSKHSS',
    melody: [329.63, 349.23, 415.3, 493.88, 523.25, 493.88, 415.3, 349.23, 329.63, 493.88, 523.25, 659.25, 587.33, 523.25, 415.3, 349.23],
    harmony: [220.0, 233.08, 0, 293.66, 311.13, 0, 277.18, 233.08, 220.0, 0, 311.13, 369.99, 0, 311.13, 293.66, 220.0],
    bass: [164.81, 164.81, 174.61, 164.81, 130.81, 130.81, 155.56, 164.81, 164.81, 123.47, 174.61, 164.81, 130.81, 155.56, 174.61, 164.81],
  },
  // Stage 7: Kawah Magma Lizar — volcanic thrash guitar-like drive
  stage_7: {
    stepMs: 162,
    wave: 'sawtooth',
    harmonyWave: 'square',
    bassWave: 'sawtooth',
    leadFilterHz: 2100,
    padHz: 130.81,
    drumPattern: 'KHKSHKSHKHKSKSSS',
    melody: [261.63, 329.63, 392.0, 523.25, 493.88, 392.0, 349.23, 293.66, 261.63, 349.23, 440.0, 523.25, 587.33, 523.25, 440.0, 392.0],
    harmony: [196.0, 0, 261.63, 329.63, 0, 261.63, 220.0, 196.0, 196.0, 0, 293.66, 349.23, 0, 329.63, 261.63, 220.0],
    bass: [130.81, 130.81, 98.0, 130.81, 116.54, 116.54, 146.83, 130.81, 130.81, 130.81, 110.0, 130.81, 146.83, 146.83, 116.54, 98.0],
  },
  // Stage 8: Balairung Titan Granit — slow crushed colossus sub-bass stomp
  stage_8: {
    stepMs: 270,
    wave: 'square',
    harmonyWave: 'sawtooth',
    bassWave: 'sawtooth',
    leadFilterHz: 1350,
    padHz: 87.31,
    drumPattern: 'K...S...KK..S..H',
    melody: [174.61, 174.61, 207.65, 261.63, 233.08, 207.65, 196.0, 174.61, 174.61, 233.08, 261.63, 311.13, 293.66, 261.63, 207.65, 155.56],
    harmony: [130.81, 0, 155.56, 174.61, 0, 155.56, 146.83, 130.81, 130.81, 0, 174.61, 207.65, 0, 174.61, 155.56, 116.54],
    bass: [87.31, 87.31, 65.41, 87.31, 77.78, 77.78, 82.41, 87.31, 87.31, 87.31, 65.41, 77.78, 69.3, 77.78, 87.31, 65.41],
  },
  // Stage 9: Kaldera Api Naga — blistering high-tempo dragon brass anthem
  stage_9: {
    stepMs: 146,
    wave: 'sawtooth',
    harmonyWave: 'sawtooth',
    bassWave: 'square',
    leadFilterHz: 2600,
    padHz: 146.83,
    drumPattern: 'KSHSKSHSKSHKSSKK',
    melody: [293.66, 349.23, 440.0, 587.33, 523.25, 466.16, 440.0, 349.23, 329.63, 440.0, 523.25, 659.25, 587.33, 523.25, 440.0, 392.0],
    harmony: [220.0, 261.63, 329.63, 440.0, 392.0, 349.23, 329.63, 261.63, 246.94, 329.63, 392.0, 493.88, 440.0, 392.0, 329.63, 293.66],
    bass: [146.83, 146.83, 220.0, 146.83, 174.61, 174.61, 130.81, 146.83, 164.81, 164.81, 246.94, 164.81, 196.0, 196.0, 146.83, 164.81],
  },
  // Stage 10: Takhta Langit Sang GOD — grand heroic celestial symphony finale
  stage_10: {
    stepMs: 138,
    wave: 'square',
    harmonyWave: 'triangle',
    bassWave: 'sawtooth',
    leadFilterHz: 3200,
    padHz: 164.81,
    drumPattern: 'KSHKKSHSKSHKKSSS',
    melody: [329.63, 440.0, 523.25, 659.25, 783.99, 659.25, 587.33, 523.25, 493.88, 587.33, 659.25, 880.0, 783.99, 659.25, 587.33, 493.88],
    harmony: [246.94, 329.63, 392.0, 493.88, 587.33, 493.88, 440.0, 392.0, 369.99, 440.0, 493.88, 659.25, 587.33, 493.88, 440.0, 369.99],
    bass: [164.81, 164.81, 246.94, 164.81, 196.0, 196.0, 146.83, 164.81, 196.0, 196.0, 293.66, 196.0, 220.0, 220.0, 164.81, 196.0],
  },
};

export const ALL_BGM_TRACK_IDS = Object.keys(BGM_TRACKS) as BgmTrackId[];

export interface StereoVoiceLevels {
  leadGain: number;
  harmonyGain: number;
  bassGain: number;
  padGain: number;
  kickGain: number;
  snareGain: number;
  hihatGain: number;
  panLead: number;
  panHarmony: number;
  panBass: number;
  panSnare: number;
  panHihat: number;
}

export function getBgmVoiceLevels(isSanctuary: boolean): StereoVoiceLevels {
  return {
    leadGain: isSanctuary ? 0.135 : 0.145,
    harmonyGain: isSanctuary ? 0.088 : 0.095,
    bassGain: isSanctuary ? 0.155 : 0.165,
    padGain: isSanctuary ? 0.085 : 0.075,
    kickGain: 0.23,
    snareGain: 0.11,
    hihatGain: 0.068,
    panLead: 0.1,
    panHarmony: -0.22,
    panBass: 0,
    panSnare: -0.12,
    panHihat: 0.24,
  };
}

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private bgmMasterGain: GainNode | null = null;
  private sfxMasterGain: GainNode | null = null;
  private bgmWetInput: GainNode | null = null;
  private activeTrackGain: GainNode | null = null;
  private activeTrackWetSend: GainNode | null = null;

  private muted = false;
  private masterVol = 0.8;
  private bgmVol = 0.7;
  private sfxVol = 0.85;
  private userUnlocked = false;
  private listenersAttached = false;

  private currentTrack: BgmTrackId | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.attachUnlockListeners();
    }
  }

  private attachUnlockListeners(): void {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    const tryUnlockAndResume = () => {
      this.userUnlocked = true;
      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended' && !this.muted) {
        ctx
          .resume()
          .then(() => {
            this.syncMasterGains();
            if (this.currentTrack && this.bgmTimer === null && this.getBgmGainScale() > 0.001) {
              const track = this.currentTrack;
              this.currentTrack = null;
              this.setBgmTrack(track);
            }
          })
          .catch(() => {});
      } else if (
        ctx &&
        ctx.state === 'running' &&
        this.currentTrack &&
        this.bgmTimer === null &&
        this.getBgmGainScale() > 0.001
      ) {
        const track = this.currentTrack;
        this.currentTrack = null;
        this.setBgmTrack(track);
      }
    };

    const onFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (this.userUnlocked && this.ctx && this.ctx.state === 'suspended' && !this.muted) {
        this.ctx.resume().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', tryUnlockAndResume, true);
    window.addEventListener('touchstart', tryUnlockAndResume, true);
    window.addEventListener('click', tryUnlockAndResume, true);
    window.addEventListener('keydown', tryUnlockAndResume, true);
    window.addEventListener('focus', onFocusOrVisible);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onFocusOrVisible);
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' || !this.userUnlocked) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      // Force balanced 2-channel stereo output wherever supported
      try {
        if (ctx.destination.maxChannelCount >= 2) {
          ctx.destination.channelCount = 2;
        }
        ctx.destination.channelCountMode = 'explicit';
        ctx.destination.channelInterpretation = 'speakers';
      } catch {
        // Fallback safely if browser locks destination properties
      }

      // Soft master stereo compressor / limiter to keep loud BGM + SFX rich without clipping
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.16;
      compressor.connect(ctx.destination);
      this.masterLimiter = compressor;

      const bgmMaster = ctx.createGain();
      bgmMaster.gain.value = this.getBgmGainScale() * 1.35;
      bgmMaster.connect(compressor);
      this.bgmMasterGain = bgmMaster;

      const sfxMaster = ctx.createGain();
      sfxMaster.gain.value = this.getSfxGainScale();
      sfxMaster.connect(compressor);
      this.sfxMasterGain = sfxMaster;

      // Balanced Dual-Channel Stereo Cathedral Bus (subtle L/R width for headphones & speakers)
      const wetIn = ctx.createGain();
      wetIn.gain.value = 1;
      const delayL = ctx.createDelay(0.6);
      const delayR = ctx.createDelay(0.6);
      delayL.delayTime.value = 0.21;
      delayR.delayTime.value = 0.29;

      const lpL = ctx.createBiquadFilter();
      const lpR = ctx.createBiquadFilter();
      lpL.type = 'lowpass';
      lpR.type = 'lowpass';
      lpL.frequency.value = 2100;
      lpR.frequency.value = 1900;

      const fbL = ctx.createGain();
      const fbR = ctx.createGain();
      fbL.gain.value = 0.22;
      fbR.gain.value = 0.22;

      const wetGainL = ctx.createGain();
      const wetGainR = ctx.createGain();
      wetGainL.gain.value = 0.28;
      wetGainR.gain.value = 0.28;

      wetIn.connect(delayL);
      delayL.connect(lpL);
      lpL.connect(fbL);
      fbL.connect(delayR);
      this.connectWithPan(lpL, wetGainL, -0.32);
      wetGainL.connect(bgmMaster);

      wetIn.connect(delayR);
      delayR.connect(lpR);
      lpR.connect(fbR);
      fbR.connect(delayL);
      this.connectWithPan(lpR, wetGainR, 0.32);
      wetGainR.connect(bgmMaster);

      this.bgmWetInput = wetIn;

      // Short reusable white-noise buffer for procedural percussion
      const length = Math.floor(ctx.sampleRate * 0.28);
      const buf = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buf;
    }

    if (!this.muted && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private connectWithPan(source: AudioNode, dest: AudioNode, pan: number): void {
    const ctx = this.ctx;
    if (!ctx || Math.abs(pan) < 0.01 || typeof ctx.createStereoPanner !== 'function') {
      source.connect(dest);
      return;
    }
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(panner);
    panner.connect(dest);
  }

  private syncMasterGains(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const bgmTarget = this.getBgmGainScale() * 1.35;
    const sfxTarget = this.getSfxGainScale();
    if (this.bgmMasterGain) {
      this.bgmMasterGain.gain.setTargetAtTime(bgmTarget, now, 0.03);
    }
    if (this.sfxMasterGain) {
      this.sfxMasterGain.gain.setTargetAtTime(sfxTarget, now, 0.02);
    }
  }

  private fadeOutActiveTrackBus(): void {
    const ctx = this.ctx;
    const oldTrackGain = this.activeTrackGain;
    const oldWetSend = this.activeTrackWetSend;
    this.activeTrackGain = null;
    this.activeTrackWetSend = null;
    if (!ctx || !oldTrackGain) return;

    const now = ctx.currentTime;
    try {
      oldTrackGain.gain.cancelScheduledValues(now);
      oldTrackGain.gain.setValueAtTime(Math.max(0.0001, oldTrackGain.gain.value), now);
      oldTrackGain.gain.linearRampToValueAtTime(0.0001, now + 0.14);
      if (oldWetSend) {
        oldWetSend.gain.cancelScheduledValues(now);
        oldWetSend.gain.setValueAtTime(Math.max(0.0001, oldWetSend.gain.value), now);
        oldWetSend.gain.linearRampToValueAtTime(0.0001, now + 0.14);
      }
      window.setTimeout(() => {
        try {
          oldTrackGain.disconnect();
          oldWetSend?.disconnect();
        } catch {
          // Already disconnected
        }
      }, 190);
    } catch {
      // Ignore cleanup errors
    }
  }

  setAudioSettings(settings: AudioSettings): void {
    this.masterVol = Math.max(0, Math.min(1, settings.masterVolume / 100));
    this.bgmVol = Math.max(0, Math.min(1, settings.bgmVolume / 100));
    this.sfxVol = Math.max(0, Math.min(1, settings.sfxVolume / 100));
    this.muted = settings.muted;
    this.syncMasterGains();

    if (this.muted || this.masterVol <= 0.001 || this.bgmVol <= 0.001) {
      this.stopBgmTimerOnly();
      this.fadeOutActiveTrackBus();
    } else if (this.currentTrack && this.bgmTimer === null) {
      const track = this.currentTrack;
      this.currentTrack = null;
      this.setBgmTrack(track);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.syncMasterGains();
    if (muted) {
      this.stopBgmTimerOnly();
      this.fadeOutActiveTrackBus();
    } else {
      const ctx = this.ensureContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (this.currentTrack && this.bgmTimer === null) {
        const track = this.currentTrack;
        this.currentTrack = null;
        this.setBgmTrack(track);
      }
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  getDiagnostics(): {
    currentTrack: BgmTrackId | null;
    unlocked: boolean;
    contextState: AudioContextState | 'uninitialized';
    channelCount: number;
    hasStereoCompressor: boolean;
    bgmScale: number;
    sfxScale: number;
  } {
    return {
      currentTrack: this.currentTrack,
      unlocked: this.userUnlocked,
      contextState: this.ctx?.state ?? 'uninitialized',
      channelCount: this.ctx?.destination.channelCount ?? 2,
      hasStereoCompressor: Boolean(this.masterLimiter),
      bgmScale: Number(this.getBgmGainScale().toFixed(3)),
      sfxScale: Number(this.getSfxGainScale().toFixed(3)),
    };
  }

  private getSfxGainScale(): number {
    if (this.muted) return 0;
    return this.masterVol * this.sfxVol;
  }

  private getBgmGainScale(): number {
    if (this.muted) return 0;
    return this.masterVol * this.bgmVol;
  }

  setBgmTrack(track: BgmTrackId): void {
    if (typeof window === 'undefined') return;
    if (this.currentTrack === track && this.bgmTimer !== null) return;
    this.currentTrack = track;
    this.stopBgmTimerOnly();
    this.fadeOutActiveTrackBus();
    if (this.getBgmGainScale() <= 0.001) return;

    const spec = BGM_TRACKS[track];
    const isSanctuary = track === 'title' || track === 'lobby' || track === 'enchant';
    const levels = getBgmVoiceLevels(isSanctuary);
    this.bgmStep = 0;

    const setupTrackBus = (ctx: AudioContext) => {
      if (this.activeTrackGain || !this.bgmMasterGain) return;
      const now = ctx.currentTime;
      const trackDry = ctx.createGain();
      trackDry.gain.setValueAtTime(0.001, now);
      trackDry.gain.linearRampToValueAtTime(1.0, now + 0.12);
      trackDry.connect(this.bgmMasterGain);
      this.activeTrackGain = trackDry;

      if (this.bgmWetInput) {
        const wetSend = ctx.createGain();
        wetSend.gain.setValueAtTime(0.001, now);
        wetSend.gain.linearRampToValueAtTime(0.36, now + 0.14);
        trackDry.connect(wetSend);
        wetSend.connect(this.bgmWetInput);
        this.activeTrackWetSend = wetSend;
      }
    };

    const playStep = () => {
      if (this.getBgmGainScale() <= 0.001 || (typeof document !== 'undefined' && document.hidden)) {
        return;
      }
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;
      setupTrackBus(ctx);

      const idx = this.bgmStep % spec.melody.length;
      const leadFreq = spec.melody[idx];
      const harmFreq = spec.harmony[idx] ?? 0;
      const bassFreq = spec.bass[idx];
      const drumHit = spec.drumPattern[this.bgmStep % spec.drumPattern.length];
      const isBarStart = idx % 8 === 0;
      const padPan = (this.bgmStep / 8) % 2 === 0 ? -0.14 : 0.14;
      this.bgmStep++;

      const dur = (spec.stepMs / 1000) * (isSanctuary ? 1.55 : 0.94);
      if (leadFreq > 0) {
        this.playFilteredBgmNote(
          leadFreq,
          dur,
          spec.wave,
          levels.leadGain,
          spec.leadFilterHz,
          levels.panLead
        );
      }
      if (harmFreq > 0) {
        this.playFilteredBgmNote(
          harmFreq,
          dur * 0.98,
          spec.harmonyWave,
          levels.harmonyGain,
          spec.leadFilterHz * 0.88,
          levels.panHarmony
        );
      }
      if (bassFreq > 0) {
        this.playFilteredBgmNote(
          bassFreq,
          dur * (isSanctuary ? 1.85 : 1.18),
          spec.bassWave,
          levels.bassGain,
          760,
          levels.panBass
        );
      }
      if (isBarStart && spec.padHz) {
        this.playFilteredBgmNote(
          spec.padHz,
          (spec.stepMs / 1000) * 6.0,
          'sine',
          levels.padGain,
          560,
          padPan
        );
      }
      if (drumHit === 'K') {
        this.playDrumKick(levels.kickGain);
      } else if (drumHit === 'S') {
        this.playDrumNoise(0.09, 1400, levels.snareGain, levels.panSnare);
      } else if (drumHit === 'H') {
        this.playDrumNoise(0.035, 5200, levels.hihatGain, levels.panHihat);
      }
    };

    // Play first note immediately if context is already unlocked and running
    playStep();
    this.bgmTimer = window.setInterval(playStep, spec.stepMs);
  }

  stopBgm(): void {
    this.currentTrack = null;
    this.stopBgmTimerOnly();
    this.fadeOutActiveTrackBus();
  }

  private stopBgmTimerOnly(): void {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playFilteredBgmNote(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    cutoffHz: number,
    pan = 0
  ): void {
    const ctx = this.ctx;
    const dest = this.activeTrackGain ?? this.bgmMasterGain;
    if (!ctx || ctx.state !== 'running' || !dest || volume <= 0.0005) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + Math.min(0.04, duration * 0.16));
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(filter);
    filter.connect(gain);
    this.connectWithPan(gain, dest, pan);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  private playDrumKick(volume: number): void {
    const ctx = this.ctx;
    const dest = this.activeTrackGain ?? this.bgmMasterGain;
    if (!ctx || ctx.state !== 'running' || !dest || volume <= 0.0005) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  private playDrumNoise(duration: number, highpassHz: number, volume: number, pan = 0): void {
    const ctx = this.ctx;
    const dest = this.activeTrackGain ?? this.bgmMasterGain;
    if (!ctx || ctx.state !== 'running' || !this.noiseBuffer || !dest || volume <= 0.0005) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(highpassHz, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    this.connectWithPan(gain, dest, pan);
    src.start(now);
    src.stop(now + duration + 0.01);
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    jitter = 0.08,
    pan = 0
  ): void {
    const scale = this.getSfxGainScale();
    if (scale <= 0.001) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxMasterGain) return;

    const now = ctx.currentTime;
    const pitchMod = 1 + (Math.random() * 2 - 1) * jitter;
    // Routed through sfxMasterGain (which already scales by masterVol * sfxVol)
    const finalVol = Math.max(0.001, volume);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freqStart * pitchMod), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd * pitchMod), now + duration);

    gain.gain.setValueAtTime(finalVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    this.connectWithPan(gain, this.sfxMasterGain, pan);
    osc.start(now);
    osc.stop(now + duration);
  }

  playSlash(comboStep = 1): void {
    const base = 340 + comboStep * 75;
    const pan = comboStep % 2 === 0 ? -0.1 : 0.1;
    this.playTone(base, 110, 0.09, 'sawtooth', 0.11, 0.08, pan);
  }

  playHit(isCrit = false): void {
    const pan = (Math.random() * 2 - 1) * 0.12;
    if (isCrit) {
      this.playTone(620, 140, 0.14, 'square', 0.13, 0.06, pan);
      this.playTone(220, 65, 0.16, 'triangle', 0.15, 0.05, 0);
    } else {
      this.playTone(260, 85, 0.08, 'triangle', 0.11, 0.09, pan);
    }
  }

  playKill(): void {
    this.playTone(420, 90, 0.18, 'sawtooth', 0.12, 0.06);
  }

  playJump(): void {
    this.playTone(210, 480, 0.11, 'sine', 0.1, 0.05);
  }

  playDash(): void {
    this.playTone(540, 180, 0.12, 'triangle', 0.11, 0.06);
  }

  playPlayerHurt(): void {
    this.playTone(170, 58, 0.2, 'sawtooth', 0.15, 0.04);
  }

  playSkill(): void {
    this.playTone(260, 780, 0.22, 'sawtooth', 0.12, 0.05, -0.08);
    this.playTone(520, 210, 0.26, 'sine', 0.11, 0.05, 0.08);
  }

  playPortal(): void {
    this.playTone(330, 660, 0.22, 'sine', 0.11, 0.02, -0.1);
    this.playTone(495, 990, 0.26, 'triangle', 0.09, 0.02, 0.1);
  }

  playChestOrGacha(isHighRarity = false): void {
    this.playTone(440, 660, 0.16, 'triangle', 0.12, 0.01, -0.08);
    setTimeout(() => this.playTone(660, 880, 0.2, 'sine', 0.12, 0.01, 0.08), 90);
    if (isHighRarity) {
      setTimeout(() => this.playTone(880, 1320, 0.32, 'sine', 0.14, 0.01, 0), 190);
    }
  }

  playClick(): void {
    this.playTone(520, 320, 0.045, 'sine', 0.08, 0.03);
  }
}

export const gameAudio = new GameAudioEngine();
