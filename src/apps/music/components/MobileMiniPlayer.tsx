import React from 'react';
import { Play, Pause, SkipForward, Disc } from 'lucide-react';
import { TrackItem } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface MobileMiniPlayerProps {
  currentTrack: TrackItem;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: (e: React.MouseEvent) => void;
  onNext: (e: React.MouseEvent) => void;
  onExpand: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  progress,
  onTogglePlay,
  onNext,
  onExpand,
}) => {
  const progressPercent = currentTrack.duration > 0 ? (progress / currentTrack.duration) * 100 : 0;

  return (
    <div
      onClick={() => {
        triggerHaptic('light');
        onExpand();
      }}
      className="md:hidden fixed bottom-16 left-3 right-3 z-40 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 rounded-2xl shadow-xl p-2.5 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
    >
      {/* Track Progress Bar on top of mini player */}
      <div className="absolute top-0 left-3 right-3 h-0.5 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Artwork */}
      <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md bg-gradient-to-br from-fuchsia-600 to-indigo-700">
        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          className={`w-full h-full object-cover ${isPlaying ? 'scale-105' : ''}`}
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <Disc className="w-5 h-5 text-fuchsia-300 animate-spin" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
          {currentTrack.title}
        </h4>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
          {currentTrack.artist} {currentTrack.isLocal && '• Local'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            triggerHaptic('medium');
            onTogglePlay(e);
          }}
          className="w-10 h-10 rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          onClick={(e) => {
            triggerHaptic('light');
            onNext(e);
          }}
          className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 active:scale-90 transition-transform"
          aria-label="Next track"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
