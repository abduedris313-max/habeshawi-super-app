/**
 * @file SpotlightSearch.tsx
 * @description Universal iOS Spotlight search modal for Harmony OS Super App.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, X, Sparkles, Notebook, FileText, PenTool, Disc, ArrowRight } from 'lucide-react';
import { HARMONY_APPS } from '../config/apps';
import { HarmonyNote, HarmonyDoc, HarmonyWritingDraft } from '../types';
import { HabeshawiAppIcon } from './HabeshawiIcons';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApp: (appId: string) => void;
  notes: HarmonyNote[];
  docs: HarmonyDoc[];
  drafts: HarmonyWritingDraft[];
  isDarkMode?: boolean;
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({
  isOpen,
  onClose,
  onOpenApp,
  notes,
  docs,
  drafts,
  isDarkMode = true
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredApps = HARMONY_APPS.filter(app => 
    app.name.toLowerCase().includes(query.toLowerCase()) ||
    app.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(query.toLowerCase()) ||
    n.content.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDocs = docs.filter(d =>
    d.title.toLowerCase().includes(query.toLowerCase()) ||
    d.content.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDrafts = drafts.filter(dr =>
    dr.title.toLowerCase().includes(query.toLowerCase()) ||
    dr.content.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/70 backdrop-blur-2xl animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] border transition-colors ${
          isDarkMode
            ? 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]'
            : 'bg-white border-neutral-200 text-neutral-800 shadow-neutral-500/20'
        }`}
      >
        {/* Search Input Bar */}
        <div className={`p-4 border-b flex items-center gap-3 transition-colors ${
          isDarkMode ? 'bg-[#0d1117] border-[#30363d]' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <Search className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mini apps, notes, docs, drafts or ask AI..."
            className={`w-full bg-transparent focus:outline-none text-base ${
              isDarkMode ? 'text-white placeholder-[#8b949e]' : 'text-neutral-900 placeholder-neutral-400'
            }`}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className={`p-1 rounded-full transition-colors ${
                isDarkMode
                  ? 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white'
                  : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold px-2 py-1 hover:underline"
          >
            Cancel
          </button>
        </div>

        {/* Search Results List */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1 scrollbar-none">
          {/* Section 1: Integrated Habeshawi Mini Apps */}
          <div>
            <h4 className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${
              isDarkMode ? 'text-white/40' : 'text-neutral-500'
            }`}>
              Habeshawi Mini Apps
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    onOpenApp(app.id);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl cursor-pointer flex items-center gap-3 border transition-colors group ${
                    isDarkMode
                      ? 'bg-white/5 hover:bg-white/10 border-white/5'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200/80 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.colorGradient} flex items-center justify-center text-white shrink-0 shadow-sm p-1.5 border border-amber-400/30`}>
                    <HabeshawiAppIcon appId={app.id} iconName={app.iconName} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className={`text-xs font-semibold truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{app.name}</h5>
                    <p className={`text-[10px] truncate ${isDarkMode ? 'text-white/50' : 'text-neutral-500'}`}>{app.tagline}</p>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-colors ${
                    isDarkMode ? 'text-white/30 group-hover:text-white' : 'text-neutral-400 group-hover:text-neutral-900'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Synced Habeshawi Notes */}
          {filteredNotes.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-2">
                Habeshawi Notes ({filteredNotes.length})
              </h4>
              <div className="space-y-1.5">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      onOpenApp('harmony-notes');
                      onClose();
                    }}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isDarkMode
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20'
                        : 'bg-amber-50/70 hover:bg-amber-100/70 border-amber-200 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Notebook className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{note.title}</span>
                        <p className={`text-[11px] line-clamp-1 ${isDarkMode ? 'text-white/50' : 'text-neutral-600'}`}>{note.content}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-600 dark:text-amber-300 font-mono font-medium">{note.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Synced Habeshawi Docs */}
          {filteredDocs.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-500 mb-2">
                Habeshawi Docs ({filteredDocs.length})
              </h4>
              <div className="space-y-1.5">
                {filteredDocs.map((docItem) => (
                  <div
                    key={docItem.id}
                    onClick={() => {
                      onOpenApp('harmony-docs');
                      onClose();
                    }}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                      isDarkMode
                        ? 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20'
                        : 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200 text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>{docItem.title}</span>
                        <p className={`text-[11px] line-clamp-1 ${isDarkMode ? 'text-white/50' : 'text-neutral-600'}`}>{docItem.content}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-300 font-mono font-medium">{docItem.wordCount} words</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
