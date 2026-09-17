/**
 * @file soundManager.ts
 * @description Centralized Web Audio API sound synthesis and policy engine for Harmony OS.
 * Strictly respects 'Focus Mode' (muting all non-essential sounds) and user volume settings.
 */

import { SystemSettings } from '../types';

class SystemSoundManager {
  private audioCtx: AudioContext | null = null;
  private settings: Pick<SystemSettings, 'focusMode' | 'volume' | 'typewriterSounds'> = {
    focusMode: false,
    volume: 0.8,
    typewriterSounds: true,
  };

  /**
   * Update the internal settings reference from React state or Firebase sync
   */
  public setSettings(settings: Partial<SystemSettings>) {
    if (settings.focusMode !== undefined) {
      this.settings.focusMode = settings.focusMode;
    }
    if (settings.volume !== undefined) {
      this.settings.volume = settings.volume;
    }
    if (settings.typewriterSounds !== undefined) {
      this.settings.typewriterSounds = settings.typewriterSounds;
    }
  }

  public getSettings() {
    return { ...this.settings };
  }

  /**
   * Returns true if non-essential sound effects should be silenced
   * (either Focus Mode is ON or master volume is 0)
   */
  public isNonEssentialMuted(): boolean {
    return this.settings.focusMode || this.settings.volume <= 0.01;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Mechanical Typewriter keystroke audio
   * Muted if Focus Mode is active, volume is 0, or typewriterSounds is false
   */
  public playTypewriterClick() {
    if (this.isNonEssentialMuted() || !this.settings.typewriterSounds) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = 1100 + Math.random() * 450;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const baseGain = 0.08 * this.settings.volume;
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.035);
    } catch {
      // Audio autoplay policy guard
    }
  }

  /**
   * Typewriter spacebar sound
   */
  public playTypewriterSpace() {
    if (this.isNonEssentialMuted() || !this.settings.typewriterSounds) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);

      const baseGain = 0.1 * this.settings.volume;
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Audio autoplay policy guard
    }
  }

  /**
   * System Notification Chime (iOS harmonic two-tone chime)
   * Strictly muted when Focus Mode is active!
   */
  public playNotificationChime() {
    if (this.isNonEssentialMuted()) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const vol = 0.15 * this.settings.volume;

      // Note 1: E6 (1318.5 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(vol, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: B6 (1975.5 Hz) harmonic ring
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.5, now + 0.1);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(vol * 0.9, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.5);
    } catch {
      // Audio autoplay policy guard
    }
  }

  /**
   * Gentle tactile click for UI toggles
   */
  public playHapticClick() {
    if (this.isNonEssentialMuted()) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      const baseGain = 0.04 * this.settings.volume;
      gain.gain.setValueAtTime(baseGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.02);
    } catch {
      // Audio autoplay policy guard
    }
  }

  /**
   * Focus Mode State Transition Sound (ambient soft chime when entering or leaving focus mode)
   */
  public playFocusToggleSound(isEnteringFocus: boolean) {
    if (this.settings.volume <= 0.01) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const vol = 0.12 * this.settings.volume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (isEnteringFocus) {
        // Calming descending tone indicating silence/focus
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);
      } else {
        // Ascending tone indicating resuming standard mode
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.28);
      }

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio autoplay policy guard
    }
  }

  /**
   * App Launch / Boot / Modal Chime
   */
  public playAppLaunchSound() {
    if (this.isNonEssentialMuted()) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const vol = 0.14 * this.settings.volume;

      // Soft harmonic golden chord: A4 (440Hz), C#5 (554.37Hz), E5 (659.25Hz)
      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(vol / 3, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + 0.45);
      });
    } catch {
      // Audio autoplay guard
    }
  }

  /**
   * Subtle iOS haptic click/tap audio
   */
  public playClickSound() {
    if (this.isNonEssentialMuted()) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

      const vol = 0.08 * this.settings.volume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Guard
    }
  }
}

export const soundManager = new SystemSoundManager();
