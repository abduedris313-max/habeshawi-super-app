import React, { useState } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Heart, Disc, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, Sliders, FolderPlus, Clock, Gauge
} from 'lucide-react';
import { TrackItem, RepeatMode, VisualizerMode } from '../types';
import { VisualizerCanvas } from './VisualizerCanvas';
import { triggerHaptic } from '../utils/haptics';

interface PlayerStageProps {
  currentTrack: TrackItem;
  isPlaying: boolean;
  progress: number;
  favorites: string[];
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  visualizerMode: VisualizerMode;
  sleepTimerMinutes: number | null;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onToggleFavorite: (id: string) => void;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onOpenUploadModal: () => void;
  onSetSleepTimer: (mins: number | null) => void;
}

export const PlayerStage: React.FC<PlayerStageProps> = ({
  currentTrack,
  isPlaying,
  progress,
  favorites,
  volume,
  isMuted,
  playbackSpeed,
  shuffle,
  repeatMode,
  visualizerMode,
  sleepTimerMinutes,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleFavorite,
  onVolumeChange,
  onToggleMute,
  onPlaybackSpeedChange,
  onToggleShuffle,
  onCycleRepeat,
  onChangeVisualizerMode,
  onOpenUploadModal,
  onSetSleepTimer,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const isFav = favorites.includes(currentTrack.id);

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full min-h-0 relative py-2 sm:py-6 px-3">
      {/* Dynamic Ambient Background Blur */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-25 dark:opacity-40 blur-3xl transition-all duration-1000 pointer-events-none">
        <img
          src={currentTrack.coverUrl}
          alt="Ambient cover"
          className="w-full h-full object-cover scale-150"
        />
      </div>

      {/* Top Bar Badges & Local File Trigger */}
      <div className="w-full flex items-center justify-between mb-4 sm:mb-6 px-1">
        <div className="flex items-center gap-2">
          {currentTrack.isLocal ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Local File
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30">
              Harmony Audio
            </span>
          )}
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenUploadModal();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white shadow-sm active:scale-95 transition-all"
        >
          <FolderPlus className="w-4 h-4 text-fuchsia-500" />
          <span>Add Local Audio</span>
        </button>
      </div>

      {/* Album Artwork & Vinyl Effect */}
      <div className="relative mb-6 group">
        <div className="w-56 h-56 sm:w-72 sm:h-72 rounded-[36px] overflow-hidden shadow-2xl ring-1 ring-black/10 dark:ring-white/20 relative bg-neutral-900">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isPlaying ? 'scale-105' : 'scale-100'
            }`}
          />

          {/* Rotating Vinyl Overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
            <div
              className={`p-4 rounded-full bg-black/70 text-fuchsia-400 shadow-2xl backdrop-blur-md ${
                isPlaying ? 'animate-spin' : ''
              }`}
            >
              <Disc className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Visualizer Canvas overlay below/around artwork */}
        <div className="mt-4 w-full max-w-sm">
          <VisualizerCanvas isPlaying={isPlaying} mode={visualizerMode} />
        </div>
      </div>

      {/* Track Details & Favorite */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <div className="text-left min-w-0 flex-1 pr-4">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight truncate">
            {currentTrack.title}
          </h2>
          <p className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 mt-1 truncate">
            {currentTrack.artist} {currentTrack.album ? `• ${currentTrack.album}` : ''}
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onToggleFavorite(currentTrack.id);
          }}
          className="p-3 rounded-2xl bg-neutral-200/60 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-500 dark:text-white/80 active:scale-90 transition-all shrink-0"
          aria-label="Toggle Favorite"
        >
          <Heart className={`w-6 h-6 ${isFav ? 'fill-fuchsia-500 text-fuchsia-500' : ''}`} />
        </button>
      </div>

      {/* Scrubber Bar */}
      <div className="w-full mb-5">
        <div
          className="w-full h-2.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden cursor-pointer relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, clickX / rect.width));
            onSeek(percentage * currentTrack.duration);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-indigo-500 transition-all duration-150 rounded-full"
            style={{
              width: `${currentTrack.duration > 0 ? (progress / currentTrack.duration) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="flex justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Main Playback Controls */}
      <div className="w-full flex items-center justify-between max-w-md mx-auto mb-6 px-2">
        {/* Shuffle */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onToggleShuffle();
          }}
          className={`p-2.5 rounded-xl transition-all ${
            shuffle
              ? 'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-white'
          }`}
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </button>

        {/* Skip Back */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onPrev();
          }}
          className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-white active:scale-90 transition-transform"
          aria-label="Previous track"
        >
          <SkipBack className="w-7 h-7" />
        </button>

        {/* Main Play/Pause Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onTogglePlay();
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-fuchsia-600 via-fuchsia-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-fuchsia-500/30 hover:scale-105 active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />}
        </button>

        {/* Skip Forward */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onNext();
          }}
          className="p-3 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-white active:scale-90 transition-transform"
          aria-label="Next track"
        >
          <SkipForward className="w-7 h-7" />
        </button>

        {/* Repeat Mode */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onCycleRepeat();
          }}
          className={`p-2.5 rounded-xl transition-all ${
            repeatMode !== 'off'
              ? 'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400'
              : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-white'
          }`}
          title={`Repeat: ${repeatMode}`}
        >
          {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
        </button>
      </div>

      {/* Secondary Controls: Volume, Speed, Visualizer, Sleep Timer */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-neutral-200/60 dark:border-white/10">
        {/* Volume Slider */}
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <button
            onClick={() => {
              triggerHaptic('light');
              onToggleMute();
            }}
            className="text-neutral-500 dark:text-neutral-400 hover:text-fuchsia-500 transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-fuchsia-500 h-1.5 bg-neutral-200 dark:bg-white/20 rounded-lg cursor-pointer"
          />
        </div>

        {/* Speed Selector */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-neutral-200/50 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-white/20 transition-all"
          >
            <Gauge className="w-3.5 h-3.5 text-fuchsia-500" />
            <span>{playbackSpeed}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-10 right-0 z-30 p-1.5 bg-white dark:bg-[#1c2128] border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[90px]">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onPlaybackSpeedChange(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`px-3 py-1 text-xs text-left rounded-lg transition-colors ${
                    playbackSpeed === s
                      ? 'bg-fuchsia-500 text-white font-bold'
                      : 'hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visualizer Mode Toggle */}
        <button
          onClick={() => {
            const modes: VisualizerMode[] = ['bars', 'wave', 'pulse', 'none'];
            const nextIdx = (modes.indexOf(visualizerMode) + 1) % modes.length;
            onChangeVisualizerMode(modes[nextIdx]);
          }}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-neutral-200/50 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-white/20 transition-all capitalize"
          title="Change Visualizer"
        >
          <Sliders className="w-3.5 h-3.5 text-fuchsia-500" />
          <span>{visualizerMode}</span>
        </button>

        {/* Sleep Timer */}
        <div className="relative">
          <button
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-all ${
              sleepTimerMinutes
                ? 'bg-fuchsia-500 text-white font-semibold'
                : 'bg-neutral-200/50 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-white/20'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{sleepTimerMinutes ? `${sleepTimerMinutes}m` : 'Timer'}</span>
          </button>

          {showSleepMenu && (
            <div className="absolute bottom-10 right-0 z-30 p-1.5 bg-white dark:bg-[#1c2128] border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[110px]">
              {[null, 15, 30, 45, 60].map((mins) => (
                <button
                  key={mins ?? 'off'}
                  onClick={() => {
                    onSetSleepTimer(mins);
                    setShowSleepMenu(false);
                  }}
                  className={`px-3 py-1 text-xs text-left rounded-lg transition-colors ${
                    sleepTimerMinutes === mins
                      ? 'bg-fuchsia-500 text-white font-bold'
                      : 'hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {mins === null ? 'Off' : `${mins} Mins`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
