import React, { useState } from 'react';
import { Sliders, Volume2, RotateCcw, Clock, Sparkles, Gauge } from 'lucide-react';
import { VisualizerMode, EqualizerPreset } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface EqualizerViewProps {
  visualizerMode: VisualizerMode;
  playbackSpeed: number;
  stereoPan: number;
  sleepTimerMinutes: number | null;
  onEQBandChange: (bandIndex: number, dbGain: number) => void;
  onEQPresetChange: (presetGains: number[]) => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onStereoPanChange: (pan: number) => void;
  onSetSleepTimer: (mins: number | null) => void;
}

const EQ_PRESETS: EqualizerPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [6, 4, 1, -1, -2] },
  { name: 'Vocal Boost', gains: [-2, 1, 5, 4, 1] },
  { name: 'Electronic', gains: [5, 3, -1, 3, 5] },
  { name: 'Rock', gains: [4, 2, -2, 2, 4] },
  { name: 'Acoustic', gains: [3, 2, 1, 3, 2] },
];

const BAND_LABELS = ['60 Hz', '230 Hz', '910 Hz', '4 kHz', '14 kHz'];
const BAND_NAMES = ['Sub Bass', 'Bass', 'Mids', 'High Mids', 'Treble'];

export const EqualizerView: React.FC<EqualizerViewProps> = ({
  visualizerMode,
  playbackSpeed,
  stereoPan,
  sleepTimerMinutes,
  onEQBandChange,
  onEQPresetChange,
  onChangeVisualizerMode,
  onPlaybackSpeedChange,
  onStereoPanChange,
  onSetSleepTimer,
}) => {
  const [bandValues, setBandValues] = useState<number[]>([0, 0, 0, 0, 0]);
  const [activePreset, setActivePreset] = useState<string>('Flat');

  const handleBandSlider = (index: number, val: number) => {
    const updated = [...bandValues];
    updated[index] = val;
    setBandValues(updated);
    setActivePreset('Custom');
    onEQBandChange(index, val);
  };

  const handleSelectPreset = (preset: EqualizerPreset) => {
    triggerHaptic('light');
    setBandValues(preset.gains);
    setActivePreset(preset.name);
    onEQPresetChange(preset.gains);
  };

  const handleReset = () => {
    triggerHaptic('medium');
    const flat = [0, 0, 0, 0, 0];
    setBandValues(flat);
    setActivePreset('Flat');
    onEQPresetChange(flat);
    onStereoPanChange(0);
    onPlaybackSpeedChange(1.0);
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-4xl mx-auto p-3 sm:p-6 overflow-y-auto pb-24 md:pb-8 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-7 h-7 text-fuchsia-500" />
            <span>Audio Equalizer & Sound FX</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Fine-tune frequency curves, stereo sound stage, pitch, and live visualizers
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white text-xs font-semibold shadow-xs transition-all"
        >
          <RotateCcw className="w-4 h-4 text-fuchsia-500" />
          <span>Reset FX</span>
        </button>
      </div>

      {/* EQ Presets Bar */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wider">
          Equalizer Presets
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {EQ_PRESETS.map((preset) => {
            const isActive = activePreset === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/25'
                    : 'bg-white/60 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/10'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5-Band Equalizer Sliders Container */}
      <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-neutral-200/60 dark:border-white/10 rounded-3xl p-5 sm:p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-5 gap-3 sm:gap-6 items-end justify-items-center h-52">
          {bandValues.map((gain, idx) => (
            <div key={idx} className="flex flex-col items-center h-full w-full justify-between">
              <span className="text-xs font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400">
                {gain > 0 ? `+${gain}` : gain} dB
              </span>

              {/* Vertical Slider */}
              <div className="relative flex-1 flex items-center justify-center my-2">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={gain}
                  onChange={(e) => handleBandSlider(idx, parseInt(e.target.value))}
                  className="accent-fuchsia-500 h-32 w-2 rounded-lg bg-neutral-200 dark:bg-white/20 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                />
              </div>

              <div className="text-center">
                <span className="block text-[11px] font-bold text-neutral-900 dark:text-white">
                  {BAND_LABELS[idx]}
                </span>
                <span className="block text-[10px] text-neutral-400 dark:text-neutral-500">
                  {BAND_NAMES[idx]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional FX Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stereo Panning */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-neutral-200/60 dark:border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-fuchsia-500" />
              <span>Stereo Sound Stage Pan</span>
            </span>
            <span className="text-xs font-mono text-fuchsia-500 font-semibold">
              {stereoPan === 0 ? 'Center' : stereoPan < 0 ? `Left ${Math.abs(Math.round(stereoPan * 100))}%` : `Right ${Math.round(stereoPan * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={stereoPan}
            onChange={(e) => onStereoPanChange(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-500 h-2 bg-neutral-200 dark:bg-white/20 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>Left</span>
            <span>Center</span>
            <span>Right</span>
          </div>
        </div>

        {/* Visualizer Mode Selection */}
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-neutral-200/60 dark:border-white/10 rounded-2xl p-4">
          <label className="block text-xs font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-fuchsia-500" />
            <span>Visualizer Mode</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'bars', label: 'Bars' },
              { id: 'wave', label: 'Wave' },
              { id: 'pulse', label: 'Aura' },
              { id: 'none', label: 'Off' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  triggerHaptic('light');
                  onChangeVisualizerMode(v.id as VisualizerMode);
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                  visualizerMode === v.id
                    ? 'bg-fuchsia-600 text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
