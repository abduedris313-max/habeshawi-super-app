/**
 * @file VoiceTranscribeTab.tsx
 * @description Voice Memo Dictation & Transcription studio powered by Gemini 3.5 Transcribe.
 * Allows users to record voice memos, generate structured transcripts, summaries, and action items.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  Sparkles, 
  FileText, 
  ListChecks, 
  RotateCcw,
  Languages,
  Clock,
  ArrowRight
} from 'lucide-react';
import { VoiceTranscriptionResult } from '../types';
import { triggerHaptic } from '../../../utils/haptics';
import { soundManager } from '../../../lib/soundManager';

interface VoiceTranscribeTabProps {
  onExportToNotes?: (title: string, text: string) => void;
  onExportToDocs?: (title: string, text: string) => void;
}

export const VoiceTranscribeTab: React.FC<VoiceTranscribeTabProps> = ({
  onExportToNotes,
  onExportToDocs,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [result, setResult] = useState<VoiceTranscriptionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      setResult(null);
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      triggerHaptic('heavy');
      soundManager.playClickSound();
    } catch (err: any) {
      console.error('[Microphone Access Error]:', err);
      setErrorMsg('Microphone access denied. Please grant permission in browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      triggerHaptic('selection');
      soundManager.playClickSound();
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    try {
      setIsTranscribing(true);
      setErrorMsg(null);
      triggerHaptic('light');

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = audioBlob.type || 'audio/webm';

        const response = await fetch('/api/voice/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const data = await response.json();
        const transcription: VoiceTranscriptionResult = {
          id: `tr-${Date.now()}`,
          transcript: data.transcript || data.text || 'Transcription complete.',
          detectedLanguage: data.language || 'English / Multilingual',
          durationSeconds: recordingSeconds,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          title: `Voice Memo (${new Date().toLocaleDateString()})`,
          summary: data.summary,
          actionItems: data.actionItems,
        };

        setResult(transcription);
        setIsTranscribing(false);
        triggerHaptic('success');
      };
    } catch (err: any) {
      console.error('[Transcription Error]:', err);
      setErrorMsg(err.message || 'Failed to transcribe audio with Gemini 3.5 Transcribe.');
      setIsTranscribing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleCopy = () => {
    if (!result?.transcript) return;
    navigator.clipboard.writeText(result.transcript);
    setCopied(true);
    triggerHaptic('selection');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-4 space-y-4 text-white">
      {/* Header Info Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
              Gemini 3.5 Transcribe Lab
            </h3>
            <p className="text-[11px] text-neutral-400">
              Record voice memos, speech, or dictation for accurate AI transcription.
            </p>
          </div>
        </div>
      </div>

      {/* Recording Studio Card */}
      <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 border border-neutral-800/80 shadow-lg relative overflow-hidden">
        {/* Pulsing indicator when recording */}
        {isRecording && (
          <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
        )}

        {/* Live Timer */}
        <div className="flex items-center gap-2 text-2xl font-mono font-bold tracking-wider mb-4">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-neutral-600'}`} />
          <span className={isRecording ? 'text-red-400' : 'text-neutral-400'}>
            {formatSeconds(recordingSeconds)}
          </span>
        </div>

        {/* Big Record Button */}
        <motion.button
          onClick={isRecording ? stopRecording : startRecording}
          whileTap={{ scale: 0.94 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all border ${
            isRecording
              ? 'bg-red-600 border-red-400 text-white shadow-red-600/40 ring-4 ring-red-500/30'
              : 'bg-gradient-to-tr from-amber-500 to-orange-600 border-amber-300 text-white shadow-amber-500/30 hover:scale-105'
          }`}
        >
          {isRecording ? (
            <Square className="w-8 h-8 fill-current" />
          ) : (
            <Mic className="w-9 h-9" />
          )}
        </motion.button>

        <p className="mt-4 text-xs font-medium text-neutral-400">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </p>

        {/* Audio Player and Transcribe Action */}
        {audioUrl && !isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mt-5 pt-4 border-t border-neutral-800 w-full justify-center"
          >
            <button
              onClick={togglePlayback}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700 transition-colors"
            >
              {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlayingAudio ? 'Pause' : 'Play Memo'}
            </button>

            <button
              onClick={handleTranscribe}
              disabled={isTranscribing}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isTranscribing ? 'Transcribing with Gemini 3.5...' : 'Transcribe Audio'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Transcription Results Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-4"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  gemini-3.5-transcribe
                </span>
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  {result.detectedLanguage}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Main Transcript Body */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Spoken Audio Transcript
              </label>
              <div className="mt-1.5 p-3.5 rounded-2xl bg-black/40 border border-neutral-800/80 text-sm leading-relaxed text-neutral-200 select-text whitespace-pre-wrap">
                {result.transcript}
              </div>
            </div>

            {/* Executive Summary if available */}
            {result.summary && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Key Takeaways
                </label>
                <p className="mt-1 text-xs text-neutral-300 bg-amber-950/20 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
                  {result.summary}
                </p>
              </div>
            )}

            {/* Action Items if available */}
            {result.actionItems && result.actionItems.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <ListChecks className="w-3 h-3" /> Action Items
                </label>
                <ul className="mt-1 space-y-1 text-xs text-neutral-300">
                  {result.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-neutral-800/50 p-2 rounded-lg">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Export actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800">
              {onExportToNotes && (
                <button
                  onClick={() => onExportToNotes(result.title, result.transcript)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-amber-300 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Save to Notes
                </button>
              )}

              {onExportToDocs && (
                <button
                  onClick={() => onExportToDocs(result.title, result.transcript)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-blue-300 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export to Docs
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
