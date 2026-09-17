import React, { useState } from 'react';
import { 
  ListMusic, Plus, Play, Trash2, CloudCheck, HardDrive, Download, Upload, 
  Sparkles, Music, Check, FolderHeart
} from 'lucide-react';
import { PlaylistData, TrackItem } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface PlaylistsViewProps {
  playlists: PlaylistData[];
  allTracks: TrackItem[];
  currentTrackId: string;
  isPlaying: boolean;
  isSaving: boolean;
  onSelectTrack: (track: TrackItem) => void;
  onCreatePlaylist: (name: string, description: string, selectedTrackIds: string[]) => void;
  onDeletePlaylist: (id: string) => void;
  onSaveToCloud: (playlistName: string, tracks: TrackItem[]) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  allTracks,
  currentTrackId,
  isPlaying,
  isSaving,
  onSelectTrack,
  onCreatePlaylist,
  onDeletePlaylist,
  onSaveToCloud,
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];
  const activePlaylistTracks = activePlaylist
    ? allTracks.filter((t) => activePlaylist.trackIds.includes(t.id))
    : [];

  const handleToggleTrackSelection = (id: string) => {
    if (selectedTrackIds.includes(id)) {
      setSelectedTrackIds(selectedTrackIds.filter((tId) => tId !== id));
    } else {
      setSelectedTrackIds([...selectedTrackIds, id]);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    triggerHaptic('success');
    onCreatePlaylist(
      newPlaylistName.trim(),
      newPlaylistDesc.trim(),
      selectedTrackIds.length > 0 ? selectedTrackIds : allTracks.slice(0, 3).map((t) => t.id)
    );
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setSelectedTrackIds([]);
    setShowCreateModal(false);
  };

  const handleExportJSON = () => {
    if (!activePlaylist) return;
    const jsonStr = JSON.stringify(activePlaylist, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activePlaylist.name.toLowerCase().replace(/\s+/g, '_')}_playlist.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-5xl mx-auto p-3 sm:p-6 gap-6 overflow-hidden">
      {/* Left Column: Playlists List */}
      <div className="w-full md:w-80 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-fuchsia-500" />
            <span>Playlists</span>
          </h2>
          <button
            onClick={() => {
              triggerHaptic('medium');
              setShowCreateModal(true);
            }}
            className="p-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-md active:scale-90 transition-all"
            title="Create New Playlist"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {playlists.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white/40 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 text-xs text-neutral-500 dark:text-neutral-400">
              No playlists created yet. Click "+" to build your custom mix!
            </div>
          ) : (
            playlists.map((pl) => {
              const isSelected = pl.id === selectedPlaylistId;
              return (
                <div
                  key={pl.id}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedPlaylistId(pl.id);
                  }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/25'
                      : 'bg-white/70 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200/60 dark:border-white/10 text-neutral-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-fuchsia-500/15 text-fuchsia-500'}`}>
                      <FolderHeart className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="text-sm font-semibold truncate">{pl.name}</h4>
                      <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {pl.trackIds.length} tracks
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Playlist Content Details */}
      <div className="flex-1 flex flex-col bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-neutral-200/60 dark:border-white/10 rounded-3xl p-4 sm:p-6 overflow-hidden min-h-0">
        {activePlaylist ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-neutral-200/60 dark:border-white/10">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                  {activePlaylist.name}
                </h3>
                {activePlaylist.description && (
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {activePlaylist.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-200/60 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-white transition-all"
                  title="Export Playlist JSON"
                >
                  <Download className="w-4 h-4 text-fuchsia-500" />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => onSaveToCloud(activePlaylist.name, activePlaylistTracks)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/25 transition-all"
                >
                  <CloudCheck className="w-4 h-4" />
                  <span>{isSaving ? 'Syncing...' : 'Sync Cloud'}</span>
                </button>

                {playlists.length > 1 && (
                  <button
                    onClick={() => {
                      triggerHaptic('heavy');
                      if (confirm(`Delete playlist "${activePlaylist.name}"?`)) {
                        onDeletePlaylist(activePlaylist.id);
                        setSelectedPlaylistId(playlists.find((p) => p.id !== activePlaylist.id)?.id || null);
                      }
                    }}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tracks List inside active playlist */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {activePlaylistTracks.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  This playlist is empty.
                </div>
              ) : (
                activePlaylistTracks.map((track) => {
                  const isCurrent = track.id === currentTrackId;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        triggerHaptic('light');
                        onSelectTrack(track);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-fuchsia-500/20 border border-fuchsia-500/40'
                          : 'bg-white/50 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <button className="p-2 rounded-full hover:bg-white/20 text-neutral-500 dark:text-neutral-400">
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm">
            Select or create a playlist to view tracks.
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md bg-white dark:bg-[#1c2128] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Create New Playlist</h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Playlist Name
              </label>
              <input
                type="text"
                required
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="e.g., Chill Beats, Workout Mix"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="Brief description"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                Select Initial Tracks ({selectedTrackIds.length})
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-neutral-200 dark:border-white/10 rounded-xl p-2">
                {allTracks.map((track) => {
                  const isSelected = selectedTrackIds.includes(track.id);
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleToggleTrackSelection(track.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                        isSelected ? 'bg-fuchsia-500/20 text-fuchsia-600 font-semibold' : 'hover:bg-neutral-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{track.title}</span>
                      {isSelected && <Check className="w-4 h-4 text-fuchsia-500" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-xs shadow-lg shadow-fuchsia-500/25"
              >
                Create Playlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
