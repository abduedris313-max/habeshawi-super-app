/**
 * @file index.tsx
 * @description Main entry component for Habeshawi Voice Live Mini App.
 * Implements real-time two-way voice conversations powered by Gemini 3.8 Live API,
 * audio transcription powered by Gemini 3.5 Transcribe, and conversational intelligence by Gemini 3.8 Flash.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Radio, 
  Sparkles, 
  Settings, 
  History, 
  FileText, 
  Send, 
  Square, 
  RefreshCw, 
  Bot, 
  User, 
  Volume2, 
  AlertCircle,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { 
  VoiceMode, 
  GeminiVoiceName, 
  VoiceSession, 
  VoiceConversationTurn, 
  VoicePersona 
} from './types';
import { useLiveAudio } from './hooks/useLiveAudio';
import { LiveVoiceOrb } from './components/LiveVoiceOrb';
import { VoiceTranscribeTab } from './components/VoiceTranscribeTab';
import { VoiceConversationHistory } from './components/VoiceConversationHistory';
import { VoiceSettingsSheet, VOICE_PERSONAS } from './components/VoiceSettingsSheet';
import { triggerHaptic } from '../../utils/haptics';
import { soundManager } from '../../lib/soundManager';
import { getLocalItem, setLocalItem } from '../../lib/offlinePersistence';

interface HarmonyVoiceAppModuleProps {
  onSaveNote?: (note: any) => Promise<any>;
  onSaveDoc?: (doc: any) => Promise<any>;
}

const STORAGE_VOICE_HISTORY = 'habeshawi_voice_sessions_v1';
const STORAGE_VOICE_PREF = 'habeshawi_voice_pref_v1';

export const HarmonyVoiceAppModule: React.FC<HarmonyVoiceAppModuleProps> = ({
  onSaveNote,
  onSaveDoc,
}) => {
  const [currentMode, setCurrentMode] = useState<VoiceMode>('live');
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>(() => {
    return getLocalItem<GeminiVoiceName>(`${STORAGE_VOICE_PREF}_voice`, 'Zephyr');
  });
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>(() => {
    return VOICE_PERSONAS[0];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isGeneratingTurn, setIsGeneratingTurn] = useState(false);
  const [activeSession, setActiveSession] = useState<VoiceSession | null>(null);

  // Stored voice sessions
  const [sessions, setSessions] = useState<VoiceSession[]>(() => {
    return getLocalItem<VoiceSession[]>(STORAGE_VOICE_HISTORY, []);
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Live Audio Hook
  const {
    isConnected,
    isConnecting,
    isSpeaking,
    isListening,
    isMuted,
    inputVolume,
    outputVolume,
    lastModelText,
    connectionError,
    startLiveSession,
    endLiveSession,
    sendTextMessage,
    toggleMute,
    stopPlayback,
  } = useLiveAudio({
    voiceName: selectedVoice,
    systemInstruction: selectedPersona.systemInstruction,
    onTurnComplete: () => {
      // Refresh active session turns
    },
    onError: (err) => {
      console.warn('[Live Voice Hook Warning]:', err);
    },
  });

  // Automatically scroll chat when new turns arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeSession?.turns, lastModelText]);

  // Synchronize with Factory Reset for Voice Mini App
  useEffect(() => {
    const handleFactoryReset = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.appId === 'harmony-voice') {
        if (isConnected || isConnecting) {
          endLiveSession();
        }
        setSessions([]);
        setActiveSession(null);
        setSelectedVoice('Zephyr');
        setSelectedPersona(VOICE_PERSONAS[0]);
      }
    };
    window.addEventListener('habeshawi_app_factory_reset', handleFactoryReset);
    return () => {
      window.removeEventListener('habeshawi_app_factory_reset', handleFactoryReset);
    };
  }, [isConnected, isConnecting, endLiveSession]);

  // Handle switching live session on / off
  const handleToggleLiveSession = () => {
    if (isConnected || isConnecting) {
      endLiveSession();
      triggerHaptic('dismiss');
      soundManager.playClickSound();

      // Finalize and store session if it has turns
      if (activeSession && activeSession.turns.length > 0) {
        const updated = [activeSession, ...sessions.filter((s) => s.id !== activeSession.id)];
        setSessions(updated);
        setLocalItem(STORAGE_VOICE_HISTORY, updated);
      }
    } else {
      triggerHaptic('heavy');
      soundManager.playClickSound();

      const newSession: VoiceSession = {
        id: `vs-${Date.now()}`,
        title: `Live Voice with ${selectedVoice}`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'live',
        voiceName: selectedVoice,
        turns: [
          {
            id: `turn-init`,
            sender: 'gemini',
            text: `Connected to Gemini 3.8 Live (${selectedVoice}). I am listening. Say something!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: 'gemini-3.8-live',
          },
        ],
        totalDurationSeconds: 0,
      };
      setActiveSession(newSession);
      startLiveSession();
    }
  };

  // Turn-based text or push-to-talk message (powered by gemini-3.8-flash)
  const handleSendChatMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || chatInput;
    if (!promptToSend.trim()) return;

    triggerHaptic('selection');
    soundManager.playClickSound();

    const userTurn: VoiceConversationTurn = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let sessionToUse = activeSession;
    if (!sessionToUse) {
      sessionToUse = {
        id: `vs-${Date.now()}`,
        title: `Voice Chat (${promptToSend.slice(0, 20)}...)`,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: 'live',
        voiceName: selectedVoice,
        turns: [userTurn],
        totalDurationSeconds: 0,
      };
    } else {
      sessionToUse = {
        ...sessionToUse,
        turns: [...sessionToUse.turns, userTurn],
      };
    }

    setActiveSession(sessionToUse);
    setChatInput('');
    setIsGeneratingTurn(true);

    // If live WebSocket is connected, we can also forward text to it
    if (isConnected) {
      sendTextMessage(promptToSend);
      setIsGeneratingTurn(false);
      return;
    }

    // Otherwise, call server endpoint powered by gemini-3.8-flash!
    try {
      const response = await fetch('/api/voice/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          voiceName: selectedVoice,
          persona: selectedPersona.name,
          systemInstruction: selectedPersona.systemInstruction,
          conversationHistory: sessionToUse.turns.slice(-6).map((t) => ({
            role: t.sender === 'user' ? 'user' : 'model',
            text: t.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data = await response.json();
      const geminiTurn: VoiceConversationTurn = {
        id: `gem-${Date.now()}`,
        sender: 'gemini',
        text: data.text || 'Understood.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      };

      const updated = {
        ...sessionToUse,
        turns: [...sessionToUse.turns, geminiTurn],
      };
      setActiveSession(updated);

      const allSessions = [updated, ...sessions.filter((s) => s.id !== updated.id)];
      setSessions(allSessions);
      setLocalItem(STORAGE_VOICE_HISTORY, allSessions);

      // Play synthesized audio if user device supports Web Speech API
      if ('speechSynthesis' in window && !isMuted) {
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error('[Voice Turn Error]:', err);
      const fallbackTurn: VoiceConversationTurn = {
        id: `gem-err-${Date.now()}`,
        sender: 'gemini',
        text: `⚠️ ${err.message || 'Unable to reach Gemini Voice assistant.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActiveSession({
        ...sessionToUse,
        turns: [...sessionToUse.turns, fallbackTurn],
      });
    } finally {
      setIsGeneratingTurn(false);
    }
  };

  const handleExportToNotes = async (title: string, text: string) => {
    if (onSaveNote) {
      await onSaveNote({
        id: `note-${Date.now()}`,
        title: title || 'Voice Transcript',
        content: text,
        category: 'Personal',
        tags: ['Voice', 'Gemini'],
        pinned: false,
      });
      triggerHaptic('success');
      soundManager.playClickSound();
    }
  };

  const handleExportToDocs = async (title: string, text: string) => {
    if (onSaveDoc) {
      await onSaveDoc({
        id: `doc-${Date.now()}`,
        title: title || 'Voice Transcript Document',
        content: `# ${title}\n\n*Transcribed by Habeshawi Voice Live (Gemini 3.5)*\n\n${text}`,
        wordCount: text.split(/\s+/).length,
        category: 'General',
      });
      triggerHaptic('success');
      soundManager.playClickSound();
    }
  };

  const handleClearHistory = () => {
    setSessions([]);
    setLocalItem(STORAGE_VOICE_HISTORY, []);
    triggerHaptic('heavy');
    soundManager.playClickSound();
  };

  return (
    <div className="flex flex-col h-full w-full bg-neutral-950 text-white select-none overflow-hidden relative font-sans">
      {/* ================= TOP NAVIGATION BAR ================= */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-white">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Habeshawi Voice Live
              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono">
                Gemini 3.8
              </span>
            </h2>
            <p className="text-[10px] text-neutral-400">
              {selectedPersona.name} • {selectedVoice}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Voice & Persona Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= SEGMENTED TAB SWITCHER ================= */}
      <div className="px-4 pt-2.5 pb-1 bg-neutral-900/50 shrink-0">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-neutral-900 border border-neutral-800">
          <button
            onClick={() => {
              setCurrentMode('live');
              triggerHaptic('selection');
            }}
            className={`py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              currentMode === 'live'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Live Call
          </button>

          <button
            onClick={() => {
              setCurrentMode('transcribe');
              triggerHaptic('selection');
            }}
            className={`py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              currentMode === 'transcribe'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Transcribe
          </button>

          <button
            onClick={() => {
              setCurrentMode('history');
              triggerHaptic('selection');
            }}
            className={`py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              currentMode === 'history'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History ({sessions.length})
          </button>
        </div>
      </div>

      {/* ================= MAIN CONTENT BODY ================= */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {currentMode === 'live' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Top error / notice notification */}
            {connectionError && (
              <div className="mx-4 mt-2 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{connectionError}</span>
              </div>
            )}

            {/* Glowing Interactive Voice Orb */}
            <div className="flex-1 flex items-center justify-center">
              <LiveVoiceOrb
                isConnected={isConnected}
                isConnecting={isConnecting}
                isSpeaking={isSpeaking}
                isListening={isListening}
                isMuted={isMuted}
                inputVolume={inputVolume}
                outputVolume={outputVolume}
                voiceName={selectedVoice}
                onToggleSession={handleToggleLiveSession}
                onToggleMute={toggleMute}
                onInterrupt={stopPlayback}
              />
            </div>

            {/* Live Conversation Transcript Drawer (Subtitles style) */}
            <div className="px-4 pb-2">
              <div className="p-3 rounded-2xl bg-neutral-900/80 backdrop-blur-md border border-neutral-800 shadow-md">
                <div className="flex items-center justify-between mb-1.5 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Sparkles className="w-3 h-3" /> Live Dialogue Feed
                  </span>
                  <span>{isConnected ? 'Real-time 16kHz/24kHz' : 'Push-to-Talk / Text Ready'}</span>
                </div>

                <div
                  ref={chatScrollRef}
                  className="max-h-28 overflow-y-auto space-y-1.5 pr-1 text-xs select-text"
                >
                  {activeSession && activeSession.turns.length > 0 ? (
                    activeSession.turns.slice(-4).map((t) => (
                      <div
                        key={t.id}
                        className={`flex gap-1.5 leading-snug ${
                          t.sender === 'user' ? 'text-cyan-300' : 'text-neutral-200'
                        }`}
                      >
                        <span className="font-bold shrink-0">
                          {t.sender === 'user' ? 'You:' : 'Gemini:'}
                        </span>
                        <span>{t.text}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500 italic text-center py-1">
                      Tap the glowing orb above to start a live two-way voice conversation, or type below.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Text/Voice Input Bar */}
            <div className="px-4 py-3 bg-neutral-900/90 border-t border-neutral-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={
                    isConnected
                      ? 'Type to live session or speak into mic...'
                      : 'Type a message to Gemini Voice Assistant...'
                  }
                  className="flex-1 py-2 px-3.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
                />

                <button
                  type="submit"
                  disabled={!chatInput.trim() || isGeneratingTurn}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {currentMode === 'transcribe' && (
          <VoiceTranscribeTab
            onExportToNotes={handleExportToNotes}
            onExportToDocs={handleExportToDocs}
          />
        )}

        {currentMode === 'history' && (
          <VoiceConversationHistory
            sessions={sessions}
            onClearHistory={handleClearHistory}
          />
        )}
      </div>

      {/* ================= SETTINGS SHEET ================= */}
      <VoiceSettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={(v) => {
          setSelectedVoice(v);
          setLocalItem(`${STORAGE_VOICE_PREF}_voice`, v);
        }}
        selectedPersona={selectedPersona}
        onSelectPersona={(p) => setSelectedPersona(p)}
      />
    </div>
  );
};

export default HarmonyVoiceAppModule;
