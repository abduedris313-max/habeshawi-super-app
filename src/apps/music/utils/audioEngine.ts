/**
 * Web Audio API Engine with 5-Band Graphic Equalizer, Analyser Node, & Canvas Visualizer
 */

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private attachedElement: HTMLAudioElement | null = null;

  // Band frequencies for 5-band EQ
  public readonly frequencies = [60, 230, 910, 4000, 14000];

  public init(audioElement: HTMLAudioElement): boolean {
    if (typeof window === 'undefined') return false;
    if (this.attachedElement === audioElement && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return false;

      this.ctx = new AudioCtxClass();
      this.attachedElement = audioElement;

      // Create Nodes
      this.sourceNode = this.ctx.createMediaElementSource(audioElement);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.ctx.createGain();
      
      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
      }

      // Create 5-band Equalizer Filters
      this.filters = this.frequencies.map((freq, index) => {
        const filter = this.ctx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === this.frequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.0;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      // Chain Nodes: Source -> Filter[0] -> ... -> Filter[4] -> Panner -> Gain -> Analyser -> Destination
      let currentNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        currentNode.connect(filter);
        currentNode = filter;
      }

      if (this.pannerNode) {
        currentNode.connect(this.pannerNode);
        currentNode = this.pannerNode;
      }

      currentNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      return true;
    } catch {
      // Browsers restrict re-attaching same audio element to new source node
      return false;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEQBand(bandIndex: number, gainDb: number) {
    if (this.filters[bandIndex] && this.ctx) {
      this.filters[bandIndex].gain.setValueAtTime(gainDb, this.ctx.currentTime);
    }
  }

  public setEQPreset(gainsDb: number[]) {
    gainsDb.forEach((gain, index) => this.setEQBand(index, gain));
  }

  public setStereoPan(pan: number) {
    if (this.pannerNode && this.ctx) {
      this.pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime);
    }
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(array);
    } else {
      array.fill(0);
    }
  }

  public getWaveformData(array: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(array);
    } else {
      array.fill(128);
    }
  }
}

export const audioEngine = new AudioEngine();
