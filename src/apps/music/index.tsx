import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  Disc, Music, ListMusic, Sliders, HardDriveUpload, Plus, 
  Sparkles, Volume2, ShieldCheck, Moon
} from 'lucide-react';
import { PlayerStage } from './components/PlayerStage';
import { LibraryView } from './components/LibraryView';
import { PlaylistsView } from './components/PlaylistsView';
import { EqualizerView } from './components/EqualizerView';
import { MobileMiniPlayer } from './components/MobileMiniPlayer';
import { FileUploadModal } from './components/FileUploadModal';

import { TrackItem, PlaylistData, ViewTab, VisualizerMode, RepeatMode } from './types';
import { audioStorage } from './utils/audioStorage';
import { parseAudioMetadata } from './utils/id3Reader';
import { audioEngine } from './utils/audioEngine';
import { ambientMusicSynth } from './utils/audioSynth';
import { triggerHaptic } from './utils/haptics';

export const SOLFEGGIO_PRESETS: TrackItem[] = [
  {
    id: 'solfeggio-432',
    title: '432 Hz • Natural Harmonic Resonance',
    artist: 'Solfeggio Pure Frequency',
    album: 'Solfeggio Healing Tones',
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    duration: 300,
    audioFreq: 432,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    addedAt: Date.now(),
  },
  {
    id: 'solfeggio-528',
    title: '528 Hz • Transformation & Clarity',
    artist: 'Solfeggio Pure Frequency',
    album: 'Solfeggio Healing Tones',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    duration: 300,
    audioFreq: 528,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a7321f.mp3?filename=deep-meditation-10901.mp3',
    addedAt: Date.now(),
  },
  {
    id: 'solfeggio-639',
    title: '639 Hz • Harmonic Connection',
    artist: 'Solfeggio Pure Frequency',
    album: 'Solfeggio Healing Tones',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    duration: 300,
    audioFreq: 639,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=meditation-piano-10624.mp3',
    addedAt: Date.now(),
  },
  {
    id: 'solfeggio-741',
    title: '741 Hz • Awakening & Deep Focus',
    artist: 'Solfeggio Pure Frequency',
    album: 'Solfeggio Healing Tones',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    duration: 300,
    audioFreq: 741,
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_993910c2dd.mp3?filename=ambient-soundscape-122703.mp3',
    addedAt: Date.now(),
  },
  {
    id: 'solfeggio-852',
    title: '852 Hz • Inner Awareness & Balance',
    artist: 'Solfeggio Pure Frequency',
    album: 'Solfeggio Healing Tones',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    duration: 300,
    audioFreq: 852,
    addedAt: Date.now(),
  },
];

export const HarmonyMusicPlayerAppModule: React.FC = () => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<ViewTab>('player');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Audio Tracks Library State
  const [tracks, setTracks] = useState<TrackItem[]>(SOLFEGGIO_PRESETS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [stereoPan, setStereoPan] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);

  // Favorites & Playlists State
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('harmony_music_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [playlists, setPlaylists] = useState<PlaylistData[]>([
    {
      id: 'default-solfeggio',
      name: 'Harmonic Tones & Focus',
      description: 'Solfeggio pure frequencies and ambient soundscapes',
      trackIds: SOLFEGGIO_PRESETS.map((t) => t.id),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // HTML5 Audio Element Reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = tracks[currentTrackIndex] || SOLFEGGIO_PRESETS[0];

  // 1. Initialize HTML5 Audio Element & Audio Engine
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    };

    const handleEnded = () => {
      handleNextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // 2. Load Local Audio Tracks from IndexedDB on Mount
  useEffect(() => {
    async function loadPersistedLocalTracks() {
      try {
        const metadataRecords = await audioStorage.getAllMetadata();
        if (metadataRecords.length > 0) {
          const loadedTracks: TrackItem[] = metadataRecords.map((rec) => ({
            id: rec.id,
            title: rec.title,
            artist: rec.artist,
            album: rec.album || 'Local Uploads',
            coverUrl: rec.coverUrl,
            duration: rec.duration,
            isLocal: true,
            fileId: rec.id,
            addedAt: rec.addedAt,
            sizeBytes: rec.sizeBytes,
          }));

          setTracks((prev) => {
            const presetIds = new Set(prev.map((t) => t.id));
            const newLocal = loadedTracks.filter((t) => !presetIds.has(t.id));
            return [...newLocal, ...prev];
          });
        }
      } catch {
        // IndexedDB fallback
      }
    }
    loadPersistedLocalTracks();
  }, []);

  // 3. Sync Favorites to LocalStorage
  useEffect(() => {
    localStorage.setItem('harmony_music_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Synchronize with Factory Reset for Music Player
  useEffect(() => {
    const handleFactoryReset = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.appId === 'harmony-music-player') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
        setTracks(SOLFEGGIO_PRESETS);
        setCurrentTrackIndex(0);
        setFavorites([]);
      }
    };
    window.addEventListener('habeshawi_app_factory_reset', handleFactoryReset);
    return () => {
      window.removeEventListener('habeshawi_app_factory_reset', handleFactoryReset);
    };
  }, []);

  // 4. Playback Track Change & Audio Source Setup
  useEffect(() => {
    async function prepareAndPlayTrack() {
      if (!currentTrack || !audioRef.current) return;

      // Initialize Web Audio Engine with audio element
      audioEngine.init(audioRef.current);

      if (currentTrack.isLocal && currentTrack.fileId) {
        // Retrieve binary audio file Blob from IndexedDB
        const blob = await audioStorage.getAudioBlob(currentTrack.fileId);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          audioRef.current.src = blobUrl;
        } else if (currentTrack.audioUrl) {
          audioRef.current.src = currentTrack.audioUrl;
        }
      } else if (currentTrack.audioUrl) {
        audioRef.current.src = currentTrack.audioUrl;
      } else {
        audioRef.current.src = '';
      }

      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.currentTime = 0;
      setProgress(0);

      if (isPlaying) {
        audioEngine.resume();
        if (audioRef.current.src) {
          audioRef.current.play().catch(() => {
            // Fallback to web synth if autoplay blocked
            if (currentTrack.audioFreq) {
              ambientMusicSynth.playTone(currentTrack.audioFreq);
            }
          });
        } else if (currentTrack.audioFreq) {
          ambientMusicSynth.playTone(currentTrack.audioFreq);
        }
      }
    }

    prepareAndPlayTrack();
  }, [currentTrackIndex]);

  // 5. Play / Pause Control Listener
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioEngine.resume();
      if (audioRef.current.src) {
        audioRef.current.play().catch(() => {
          if (currentTrack?.audioFreq) {
            ambientMusicSynth.playTone(currentTrack.audioFreq);
          }
        });
      } else if (currentTrack?.audioFreq) {
        ambientMusicSynth.playTone(currentTrack.audioFreq);
      }
    } else {
      audioRef.current.pause();
      ambientMusicSynth.stop();
    }
  }, [isPlaying]);

  // 6. Volume & Speed Modifications
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, isMuted, playbackSpeed]);

  // 7. Next / Prev Track Handlers
  const handleNextTrack = useCallback(() => {
    if (repeatMode === 'one' && audioRef.current && audioRef.current.src) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    setProgress(0);
    if (shuffle) {
      const nextIdx = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(nextIdx);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    }
    setIsPlaying(true);
  }, [repeatMode, shuffle, tracks.length]);

  const handlePrevTrack = useCallback(() => {
    setProgress(0);
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const handleSeek = (seconds: number) => {
    setProgress(seconds);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleToggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((f) => f !== id));
      showToast('Removed from favorites');
    } else {
      setFavorites([...favorites, id]);
      showToast('Added to favorites');
    }
  };

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // 8. Upload Local Files Handler
  const handleFileUpload = async (files: FileList | File[]) => {
    const newTrackItems: TrackItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(file.name)) {
        continue;
      }

      const meta = await parseAudioMetadata(file);
      const trackId = `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Save binary file into IndexedDB
      await audioStorage.saveAudioTrack(
        {
          id: trackId,
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          coverUrl: meta.coverUrl,
          duration: meta.duration,
          addedAt: Date.now(),
          sizeBytes: file.size,
          fileName: file.name,
          mimeType: file.type || 'audio/mpeg',
        },
        file
      );

      const trackItem: TrackItem = {
        id: trackId,
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        coverUrl: meta.coverUrl,
        duration: meta.duration,
        isLocal: true,
        fileId: trackId,
        addedAt: Date.now(),
        sizeBytes: file.size,
      };

      newTrackItems.push(trackItem);
    }

    if (newTrackItems.length > 0) {
      setTracks((prev) => [...newTrackItems, ...prev]);
      setCurrentTrackIndex(0);
      setIsPlaying(true);
      showToast(`Imported ${newTrackItems.length} local audio track(s)!`);
    }
  };

  // 9. Delete Local Track
  const handleDeleteLocalTrack = async (id: string) => {
    try {
      await audioStorage.deleteAudioTrack(id);
      setTracks((prev) => prev.filter((t) => t.id !== id));
      showToast('Deleted local track.');
    } catch {
      showToast('Failed to delete track.');
    }
  };

  // 10. Playlists Handlers
  const handleCreatePlaylist = (
    name: string,
    description: string,
    selectedTrackIds: string[]
  ) => {
    const newPlaylist: PlaylistData = {
      id: `pl-${Date.now()}`,
      name,
      description,
      trackIds: selectedTrackIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPlaylists([newPlaylist, ...playlists]);
    showToast(`Created playlist "${name}".`);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists(playlists.filter((p) => p.id !== id));
    showToast('Playlist deleted.');
  };

  const handleSaveToCloud = async (playlistName: string, playlistTracks: TrackItem[]) => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'playlists'), {
        name: playlistName,
        tracks: playlistTracks.map((t) => ({
          title: t.title,
          artist: t.artist,
          duration: t.duration,
        })),
        createdAt: Date.now(),
      });
      showToast(`Synced playlist "${playlistName}" to Firestore.`);
    } catch {
      showToast(`Saved playlist "${playlistName}" locally.`);
    } finally {
      setIsSaving(false);
    }
  };

  // 11. Sleep Timer Listener
  useEffect(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }

    if (sleepTimerMinutes) {
      sleepTimerRef.current = setTimeout(() => {
        setIsPlaying(false);
        setSleepTimerMinutes(null);
        showToast('Sleep timer reached. Playback paused.');
      }, sleepTimerMinutes * 60 * 1000);
    }

    return () => {
      if (sleepTimerRef.current) {
        clearTimeout(sleepTimerRef.current);
      }
    };
  }, [sleepTimerMinutes]);

  // 12. Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(Math.max(0, progress - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(Math.min(currentTrack.duration, progress + 5));
      } else if (e.code === 'KeyM') {
        setIsMuted((prev) => !prev);
      } else if (e.code === 'KeyN') {
        handleNextTrack();
      } else if (e.code === 'KeyP') {
        handlePrevTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [progress, currentTrack.duration, handleNextTrack, handlePrevTrack]);

  return (
    <div
      id="harmony-music-container"
      className="music-app-container no-scrollbar relative flex-1 w-full flex flex-col bg-neutral-100 dark:bg-[#0d1117] text-neutral-900 dark:text-[#c9d1d9] min-h-0 overflow-hidden select-none"
    >
      {/* Toast Feedback Popup */}
      {feedbackMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-fuchsia-600 text-white text-xs font-semibold shadow-2xl shadow-fuchsia-500/30 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16 md:pb-0 no-scrollbar">
        {activeTab === 'player' && (
          <PlayerStage
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
            favorites={favorites}
            volume={volume}
            isMuted={isMuted}
            playbackSpeed={playbackSpeed}
            shuffle={shuffle}
            repeatMode={repeatMode}
            visualizerMode={visualizerMode}
            sleepTimerMinutes={sleepTimerMinutes}
            onTogglePlay={handleTogglePlay}
            onPrev={handlePrevTrack}
            onNext={handleNextTrack}
            onSeek={handleSeek}
            onToggleFavorite={handleToggleFavorite}
            onVolumeChange={(v) => {
              setVolume(v);
              setIsMuted(false);
            }}
            onToggleMute={() => setIsMuted(!isMuted)}
            onPlaybackSpeedChange={setPlaybackSpeed}
            onToggleShuffle={() => setShuffle(!shuffle)}
            onCycleRepeat={() => {
              const modes: RepeatMode[] = ['off', 'all', 'one'];
              const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
              setRepeatMode(next);
            }}
            onChangeVisualizerMode={setVisualizerMode}
            onOpenUploadModal={() => setShowUploadModal(true)}
            onSetSleepTimer={setSleepTimerMinutes}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            tracks={tracks}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
            favorites={favorites}
            onSelectTrack={(track) => {
              const idx = tracks.findIndex((t) => t.id === track.id);
              if (idx !== -1) {
                setCurrentTrackIndex(idx);
                setIsPlaying(true);
              }
            }}
            onTogglePlay={handleTogglePlay}
            onToggleFavorite={handleToggleFavorite}
            onDeleteLocalTrack={handleDeleteLocalTrack}
            onOpenUploadModal={() => setShowUploadModal(true)}
            onFileUpload={handleFileUpload}
          />
        )}

        {activeTab === 'playlists' && (
          <PlaylistsView
            playlists={playlists}
            allTracks={tracks}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
            isSaving={isSaving}
            onSelectTrack={(track) => {
              const idx = tracks.findIndex((t) => t.id === track.id);
              if (idx !== -1) {
                setCurrentTrackIndex(idx);
                setIsPlaying(true);
              }
            }}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onSaveToCloud={handleSaveToCloud}
          />
        )}

        {activeTab === 'equalizer' && (
          <EqualizerView
            visualizerMode={visualizerMode}
            playbackSpeed={playbackSpeed}
            stereoPan={stereoPan}
            sleepTimerMinutes={sleepTimerMinutes}
            onEQBandChange={(band, gain) => audioEngine.setEQBand(band, gain)}
            onEQPresetChange={(gains) => audioEngine.setEQPreset(gains)}
            onChangeVisualizerMode={setVisualizerMode}
            onPlaybackSpeedChange={setPlaybackSpeed}
            onStereoPanChange={(pan) => {
              setStereoPan(pan);
              audioEngine.setStereoPan(pan);
            }}
            onSetSleepTimer={setSleepTimerMinutes}
          />
        )}
      </div>

      {/* Sticky Mobile Mini Player (Shown when on Library, Playlists, or Equalizer tabs) */}
      {activeTab !== 'player' && (
        <MobileMiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          onTogglePlay={(e) => {
            e.stopPropagation();
            handleTogglePlay();
          }}
          onNext={(e) => {
            e.stopPropagation();
            handleNextTrack();
          }}
          onExpand={() => setActiveTab('player')}
        />
      )}

      {/* Bottom Navigation Bar (Mobile First) & Desktop Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-xl border-t border-neutral-200 dark:border-white/10 px-4 py-2 flex items-center justify-around max-w-4xl mx-auto md:rounded-t-3xl md:relative md:border-t-0 md:bg-white/60 md:dark:bg-white/5 md:my-2">
        {[
          { id: 'player', label: 'Player', icon: Disc },
          { id: 'library', label: 'Library', icon: Music },
          { id: 'playlists', label: 'Playlists', icon: ListMusic },
          { id: 'equalizer', label: 'Equalizer', icon: Sliders },
          { id: 'upload', label: 'Import', icon: HardDriveUpload },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                if (tab.id === 'upload') {
                  setShowUploadModal(true);
                } else {
                  setActiveTab(tab.id as ViewTab);
                }
              }}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                isActive
                  ? 'text-fuchsia-600 dark:text-fuchsia-400 font-bold scale-105'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <IconComp className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] font-medium tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Local File Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default HarmonyMusicPlayerAppModule;
