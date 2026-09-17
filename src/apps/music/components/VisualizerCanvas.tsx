import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';
import { VisualizerMode } from '../types';

interface VisualizerCanvasProps {
  isPlaying: boolean;
  mode: VisualizerMode;
  accentColor?: string;
  className?: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  isPlaying,
  mode,
  className = 'w-full h-24',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const freqData = new Uint8Array(64);
    const waveData = new Uint8Array(128);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        audioEngine.getFrequencyData(freqData);
        audioEngine.getWaveformData(waveData);
      } else {
        freqData.fill(0);
        waveData.fill(128);
      }

      if (mode === 'bars') {
        const barWidth = (width / freqData.length) * 1.5;
        let x = 0;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#d946ef');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = gradient;

        for (let i = 0; i < freqData.length; i++) {
          let barHeight = (freqData[i] / 255) * height;
          if (!isPlaying) {
            barHeight = 4 + Math.sin(Date.now() / 400 + i * 0.2) * 2;
          }
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
          ctx.fill();
          x += barWidth;
          if (x >= width) break;
        }
      } else if (mode === 'wave') {
        ctx.lineWidth = 3;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#e879f9');
        gradient.addColorStop(0.5, '#38bdf8');
        gradient.addColorStop(1, '#a855f7');
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        const sliceWidth = width / waveData.length;
        let x = 0;

        for (let i = 0; i < waveData.length; i++) {
          let v = waveData[i] / 128.0;
          if (!isPlaying) {
            v = 1 + Math.sin(Date.now() / 300 + i * 0.1) * 0.05;
          }
          const y = (v * height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else if (mode === 'pulse') {
        // Radial pulse aura centered on canvas
        const centerX = width / 2;
        const centerY = height / 2;
        let avgFreq = 0;
        for (let i = 0; i < freqData.length; i++) {
          avgFreq += freqData[i];
        }
        avgFreq = avgFreq / freqData.length;

        const baseRadius = Math.min(width, height) * 0.25;
        const pulseRadius = isPlaying ? baseRadius + (avgFreq / 255) * 20 : baseRadius;

        const radGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          5,
          centerX,
          centerY,
          pulseRadius + 20
        );
        radGrad.addColorStop(0, 'rgba(217, 70, 239, 0.8)');
        radGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
        radGrad.addColorStop(1, 'rgba(13, 17, 23, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius + 20, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, mode]);

  if (mode === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={90}
      className={`rounded-2xl backdrop-blur-md bg-black/10 dark:bg-black/30 border border-white/10 ${className}`}
    />
  );
};
