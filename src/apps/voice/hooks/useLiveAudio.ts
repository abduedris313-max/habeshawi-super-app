/**
 * @file useLiveAudio.ts
 * @description Hook managing real-time microphone capture (16kHz PCM),
 * WebSocket streaming with Gemini 3.8 Live API, volume metering, and 24kHz audio playback.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiVoiceName } from '../types';

interface UseLiveAudioOptions {
  voiceName: GeminiVoiceName;
  systemInstruction?: string;
  onTurnComplete?: () => void;
  onError?: (err: string) => void;
}

export function useLiveAudio({
  voiceName,
  systemInstruction,
  onTurnComplete,
  onError,
}: UseLiveAudioOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is talking
  const [isListening, setIsListening] = useState(false); // Mic is sending
  const [isMuted, setIsMuted] = useState(false);
  const [inputVolume, setInputVolume] = useState(0); // 0 to 1
  const [outputVolume, setOutputVolume] = useState(0); // 0 to 1
  const [lastModelText, setLastModelText] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Audio Contexts & Web Audio Nodes
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Playback queue & scheduling
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Convert Float32Array to 16-bit PCM little-endian ArrayBuffer
  const floatTo16BitPCM = useCallback((float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }, []);

  // Convert ArrayBuffer to base64
  const arrayBufferToBase64 = useCallback((buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Convert base64 16-bit PCM back to Float32Array for Web Audio playback
  const base64ToFloat32Array = useCallback((base64String: string): Float32Array => {
    const binary = atob(base64String);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return float32;
  }, []);

  // Stop currently playing audio and clear queue (for interruptions)
  const stopPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  }, []);

  // Play a received 24kHz PCM chunk
  const playAudioChunk = useCallback(
    (base64Audio: string) => {
      try {
        if (!outputAudioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          outputAudioCtxRef.current = new AudioContextClass({ sampleRate: 24000 });
        }
        const ctx = outputAudioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const floatData = base64ToFloat32Array(base64Audio);
        if (floatData.length === 0) return;

        const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
        audioBuffer.copyToChannel(floatData, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        if (!outputAnalyserRef.current) {
          outputAnalyserRef.current = ctx.createAnalyser();
          outputAnalyserRef.current.fftSize = 64;
        }

        source.connect(outputAnalyserRef.current);
        outputAnalyserRef.current.connect(ctx.destination);

        const currentTime = ctx.currentTime;
        const startTime = Math.max(currentTime, nextPlayTimeRef.current);
        source.start(startTime);
        nextPlayTimeRef.current = startTime + audioBuffer.duration;

        activeSourcesRef.current.push(source);
        setIsSpeaking(true);

        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
          if (activeSourcesRef.current.length === 0) {
            setIsSpeaking(false);
          }
        };
      } catch (err: any) {
        console.error('[Live Audio Playback Error]:', err);
      }
    },
    [base64ToFloat32Array]
  );

  // Volume meter animation loop
  const updateVolumeMeters = useCallback(() => {
    // Input meter
    if (inputAnalyserRef.current && isListening && !isMuted) {
      const data = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
      inputAnalyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const avg = sum / data.length / 255;
      setInputVolume(Math.min(1, avg * 2.2));
    } else {
      setInputVolume(0);
    }

    // Output meter
    if (outputAnalyserRef.current && isSpeaking) {
      const data = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
      outputAnalyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i];
      }
      const avg = sum / data.length / 255;
      setOutputVolume(Math.min(1, avg * 2.4));
    } else {
      setOutputVolume(0);
    }

    animFrameRef.current = requestAnimationFrame(updateVolumeMeters);
  }, [isListening, isMuted, isSpeaking]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateVolumeMeters);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [updateVolumeMeters]);

  // Connect to Gemini Live WebSocket
  const startLiveSession = useCallback(async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;

      // 2. Setup input AudioContext (16kHz)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inCtx;
      if (inCtx.state === 'suspended') {
        await inCtx.resume();
      }

      const sourceNode = inCtx.createMediaStreamSource(stream);
      const analyser = inCtx.createAnalyser();
      analyser.fftSize = 64;
      inputAnalyserRef.current = analyser;

      // ScriptProcessorNode for reading audio chunks
      const processor = inCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      sourceNode.connect(analyser);
      analyser.connect(processor);
      // Connect to destination to keep audio process alive
      processor.connect(inCtx.destination);

      // 3. Setup WebSocket connection to server Live proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/voice/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnecting(false);
        setIsConnected(true);
        setIsListening(true);

        // Send initial handshake with configuration
        ws.send(
          JSON.stringify({
            type: 'init',
            voiceName,
            systemInstruction:
              systemInstruction ||
              'You are Habeshawi Voice, a warm and intelligent voice assistant in the Habeshawi Super App. Keep your answers concise, spoken-style, and helpful.',
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.type === 'text' && msg.text) {
            setLastModelText((prev) => (prev ? `${prev} ${msg.text}` : msg.text));
          }
          if (msg.type === 'interrupted') {
            stopPlayback();
          }
          if (msg.type === 'turnComplete') {
            onTurnComplete?.();
          }
          if (msg.type === 'error') {
            setConnectionError(msg.message || 'Error from Live API');
            onError?.(msg.message || 'Error from Live API');
          }
        } catch (err: any) {
          console.error('[WS Parse Error]:', err);
        }
      };

      ws.onerror = (e) => {
        console.error('[Live WebSocket Error]:', e);
        setIsConnecting(false);
        setConnectionError('WebSocket connection error. Make sure server is reachable.');
        onError?.('Live connection error.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setIsListening(false);
        setIsSpeaking(false);
      };

      // 4. Capture microphone buffer and send to WebSocket
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (isMuted) return;

        const inputBuffer = e.inputBuffer.getChannelData(0);
        const pcmBuffer = floatTo16BitPCM(inputBuffer);
        const base64Audio = arrayBufferToBase64(pcmBuffer);

        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Audio,
          })
        );
      };
    } catch (err: any) {
      console.error('[Start Live Session Failed]:', err);
      setIsConnecting(false);
      setIsConnected(false);
      const errMsg = err?.message || 'Failed to access microphone or connect.';
      setConnectionError(errMsg);
      onError?.(errMsg);
    }
  }, [
    voiceName,
    systemInstruction,
    isMuted,
    floatTo16BitPCM,
    arrayBufferToBase64,
    playAudioChunk,
    stopPlayback,
    onTurnComplete,
    onError,
  ]);

  // End live session and release mic
  const endLiveSession = useCallback(() => {
    stopPlayback();

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsListening(false);
    setIsSpeaking(false);
    setInputVolume(0);
    setOutputVolume(0);
  }, [stopPlayback]);

  // Send text to live session
  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endLiveSession();
    };
  }, [endLiveSession]);

  return {
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
  };
}
