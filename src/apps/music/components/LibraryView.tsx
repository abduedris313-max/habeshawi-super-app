import React, { useState } from 'react';
import { 
  Search, Music, Heart, Play, Pause, Trash2, HardDriveUpload, Plus, 
  Sparkles, Radio, Check
} from 'lucide-react';
import { TrackItem } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface LibraryViewProps {
  tracks: TrackItem[];
  currentTrackId: string;
  isPlaying: boolean;
  favorites: string[];
  onSelectTrack: (track: TrackItem) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (id: string) => void;
  onDeleteLocalTrack: (id: string) => void;
  onOpenUploadModal: () => void;
  onFileUpload: (files: FileList | File[]) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  currentTrackId,
  isPlaying,
  favorites,
  onSelectTrack,
  onTogglePlay,
  onToggleFavorite,
  onDeleteLocalTrack,
  onOpenUploadModal,
  onFileUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'local' | 'favorites' | 'presets'>('all');
  const [isDragging, setIsDragging] = useState(false);

  // Filtered track list logic
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.album && track.album.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterTab === 'local') return track.isLocal;
    if (filterTab === 'favorites') return favorites.includes(track.id);
    if (filterTab === 'presets') return !track.isLocal;
    return true;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col w-full h-full max-w-4xl mx-auto p-3 sm:p-6 overflow-hidden relative ${
        isDragging ? 'bg-fuchsia-500/10 ring-2 ring-fuchsia-500 rounded-3xl' : ''
      }`}
    >
      {/* Drag and Drop Dragging Overlay Indicator */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-fuchsia-600/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-white p-6 border-2 border-dashed border-white">
          <HardDriveUpload className="w-16 h-16 animate-bounce mb-3" />
          <h3 className="text-2xl font-bold">Drop Audio Files Here</h3>
          <p className="text-sm opacity-90 mt-1">Supports MP3, WAV, M4A, AAC, FLAC, and OGG</p>
        </div>
      )}

      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Music className="w-7 h-7 text-fuchsia-500" />
            <span>Audio Library</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {tracks.length} track{tracks.length === 1 ? '' : 's'} available • Drag local MP3/WAV files anytime
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenUploadModal();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-fuchsia-500/25 active:scale-95 transition-all text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Import Audio Files</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, artist, or album..."
          className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/80 dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-sm shadow-xs"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {[
          { id: 'all', label: 'All Tracks', icon: Music },
          { id: 'local', label: 'Local Audio Files', icon: HardDriveUpload },
          { id: 'favorites', label: 'Favorites', icon: Heart },
          { id: 'presets', label: 'Harmonic Presets', icon: Radio },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const active = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setFilterTab(tab.id as typeof filterTab);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20'
                  : 'bg-white/60 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-white/10'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Track List Table / Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-24 md:pb-6 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white/40 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 my-4">
            <Sparkles className="w-12 h-12 text-fuchsia-400 mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">No tracks found</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 mb-4">
              {filterTab === 'local'
                ? 'You haven’t added any local audio files yet. Drag and drop MP3 or WAV files into the app!'
                : 'Try adjusting your search query or filter criteria.'}
            </p>
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white font-medium text-xs shadow-md"
            >
              Add Local Files
            </button>
          </div>
        ) : (
          filteredTracks.map((track) => {
            const isCurrent = track.id === currentTrackId;
            const isFav = favorites.includes(track.id);

            return (
              <div
                key={track.id}
                onClick={() => {
                  triggerHaptic('light');
                  if (isCurrent) {
                    onTogglePlay();
                  } else {
                    onSelectTrack(track);
                  }
                }}
                className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-fuchsia-500/15 dark:bg-fuchsia-500/20 border border-fuchsia-500/40 shadow-sm'
                    : 'bg-white/70 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200/50 dark:border-white/5'
                }`}
              >
                {/* Track Left: Cover & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  {/* Play Indicator / Cover */}
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm bg-neutral-800">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCurrent
                            ? 'text-fuchsia-600 dark:text-fuchsia-400 font-bold'
                            : 'text-neutral-900 dark:text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                      {track.isLocal && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider shrink-0">
                          Local
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                      {track.artist} {track.album ? `• ${track.album}` : ''}
                    </p>
                  </div>
                </div>

                {/* Track Right: Duration & Actions */}
                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 mr-1 hidden sm:inline">
                    {formatTime(track.duration)}
                  </span>

                  {/* Favorite Toggle */}
                  <button
                    onClick={() => {
                      triggerHaptic('medium');
                      onToggleFavorite(track.id);
                    }}
                    className="p-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-400 dark:text-neutral-500 hover:text-fuchsia-500 transition-colors"
                    title="Toggle Favorite"
                  >
                    <Heart
                      className={`w-4 h-4 ${isFav ? 'fill-fuchsia-500 text-fuchsia-500' : ''}`}
                    />
                  </button>

                  {/* Delete local file button */}
                  {track.isLocal && (
                    <button
                      onClick={() => {
                        triggerHaptic('heavy');
                        if (confirm(`Remove local track "${track.title}" from library?`)) {
                          onDeleteLocalTrack(track.id);
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-rose-500/20 text-neutral-400 hover:text-rose-500 transition-colors"
                      title="Delete Local File"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
