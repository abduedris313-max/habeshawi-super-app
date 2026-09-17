import React, { useState, useRef } from 'react';
import { HardDriveUpload, X, CheckCircle2, Music, FolderUp, FileAudio } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (files: FileList | File[]) => Promise<void>;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    triggerHaptic('medium');
    try {
      await onFileUpload(files);
      setUploadedCount(files.length);
      triggerHaptic('success');
      setTimeout(() => {
        setIsLoading(false);
        setUploadedCount(null);
        onClose();
      }, 1200);
    } catch {
      setIsLoading(false);
    }
  };

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
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#161b22] border border-neutral-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 dark:text-neutral-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-fuchsia-500/15 text-fuchsia-500">
            <HardDriveUpload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Import Local Audio</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Files are processed locally & persisted in browser IndexedDB
            </p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging
              ? 'border-fuchsia-500 bg-fuchsia-500/10'
              : 'border-neutral-300 dark:border-white/20 hover:border-fuchsia-400 dark:hover:border-fuchsia-500 bg-neutral-50 dark:bg-white/5'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center py-4">
              <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold text-neutral-800 dark:text-white">
                Parsing Audio Metadata & Saving...
              </p>
            </div>
          ) : uploadedCount !== null ? (
            <div className="flex flex-col items-center py-4 text-emerald-500">
              <CheckCircle2 className="w-12 h-12 mb-2 animate-bounce" />
              <p className="text-sm font-bold">Successfully imported {uploadedCount} track(s)!</p>
            </div>
          ) : (
            <>
              <FileAudio className="w-12 h-12 text-fuchsia-500 mb-3" />
              <p className="text-sm font-bold text-neutral-800 dark:text-white text-center">
                Drag & Drop Audio Files Here
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-4 text-center">
                or click to browse from device (.mp3, .wav, .m4a, .aac, .flac, .ogg)
              </p>

              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-xs shadow-md"
                >
                  <Music className="w-4 h-4" />
                  <span>Choose Files</span>
                </button>

                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-white font-semibold text-xs transition-colors"
                >
                  <FolderUp className="w-4 h-4 text-fuchsia-500" />
                  <span>Select Folder</span>
                </button>
              </div>
            </>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory attribute for directory select
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
