/**
 * @file WidgetFramework.tsx
 * @description iOS Smart Stack Widget Framework for Harmony OS Home Screen.
 * Renders extensible summary data snippet widgets for mini-apps (Calendar, Finance, Music, AI, etc.)
 * with live user resizing (Small, Medium, Large), layout customization, and persistent local storage.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, Check, X, Layers, RotateCcw, Sparkles } from 'lucide-react';
import { HarmonyCalendarEvent, HarmonyNote, HarmonyWritingDraft, Track } from '../../types';
import { HomeWidgetId, WidgetSize, AVAILABLE_WIDGETS } from './types';
import { CalendarWidget } from './CalendarWidget';
import { FinanceWidget } from './FinanceWidget';
import { MusicWidget } from './MusicWidget';
import { DocsAiWidget } from './DocsAiWidget';
import { NotesWidget } from './NotesWidget';
import { WritingWidget } from './WritingWidget';
import { getLocalItem, setLocalItem, STORAGE_KEYS, DEFAULT_WIDGET_SIZES } from '../../lib/offlinePersistence';
import { soundManager } from '../../lib/soundManager';
import { triggerHaptic } from '../../utils/haptics';

interface WidgetFrameworkProps {
  onOpenApp: (appId: string) => void;
  calendarEvents?: HarmonyCalendarEvent[];
  recentNotes?: HarmonyNote[];
  latestDraft?: HarmonyWritingDraft;
  currentTrack?: Track | null;
  isPlayingMusic: boolean;
  onTogglePlayMusic: () => void;
  isDarkMode?: boolean;
  enabledWidgetIds?: HomeWidgetId[];
  onUpdateWidgets?: (widgets: HomeWidgetId[]) => void;
  widgetSizes?: Record<string, WidgetSize>;
  onUpdateWidgetSizes?: (sizes: Record<string, WidgetSize>) => void;
}

const DEFAULT_WIDGETS: HomeWidgetId[] = ['calendar', 'finance', 'music', 'docs-ai'];

export const WidgetFramework: React.FC<WidgetFrameworkProps> = ({
  onOpenApp,
  calendarEvents = [],
  recentNotes = [],
  latestDraft,
  currentTrack = null,
  isPlayingMusic,
  onTogglePlayMusic,
  isDarkMode = true,
  enabledWidgetIds: externalEnabledWidgetIds,
  onUpdateWidgets: externalOnUpdateWidgets,
  widgetSizes: externalWidgetSizes,
  onUpdateWidgetSizes: externalOnUpdateWidgetSizes,
}) => {
  const [internalEnabledWidgetIds, setInternalEnabledWidgetIds] = useState<HomeWidgetId[]>(() => {
    return getLocalItem<HomeWidgetId[]>(STORAGE_KEYS.HOME_WIDGETS, DEFAULT_WIDGETS);
  });

  const [internalWidgetSizes, setInternalWidgetSizes] = useState<Record<string, WidgetSize>>(() => {
    return getLocalItem<Record<string, WidgetSize>>(STORAGE_KEYS.WIDGET_SIZES, DEFAULT_WIDGET_SIZES);
  });

  const enabledWidgetIds = externalEnabledWidgetIds || internalEnabledWidgetIds;
  const widgetSizes = externalWidgetSizes || internalWidgetSizes;

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

  // Sync changes to persistent storage
  const handleToggleWidget = (id: HomeWidgetId) => {
    soundManager.playClickSound();
    triggerHaptic('selection');
    let next: HomeWidgetId[];
    if (enabledWidgetIds.includes(id)) {
      if (enabledWidgetIds.length <= 1) return;
      next = enabledWidgetIds.filter(w => w !== id);
    } else {
      next = [...enabledWidgetIds, id];
    }
    if (externalOnUpdateWidgets) {
      externalOnUpdateWidgets(next);
    } else {
      setInternalEnabledWidgetIds(next);
    }
    setLocalItem(STORAGE_KEYS.HOME_WIDGETS, next);
  };

  const handleResizeWidget = (id: HomeWidgetId, size: WidgetSize) => {
    soundManager.playHapticClick();
    triggerHaptic('selection');
    const updated = {
      ...widgetSizes,
      [id]: size
    };
    if (externalOnUpdateWidgetSizes) {
      externalOnUpdateWidgetSizes(updated);
    } else {
      setInternalWidgetSizes(updated);
    }
    setLocalItem(STORAGE_KEYS.WIDGET_SIZES, updated);
  };

  const handleResetDefaults = () => {
    soundManager.playClickSound();
    if (externalOnUpdateWidgets) {
      externalOnUpdateWidgets(DEFAULT_WIDGETS);
    } else {
      setInternalEnabledWidgetIds(DEFAULT_WIDGETS);
    }
    if (externalOnUpdateWidgetSizes) {
      externalOnUpdateWidgetSizes(DEFAULT_WIDGET_SIZES);
    } else {
      setInternalWidgetSizes(DEFAULT_WIDGET_SIZES);
    }
    setLocalItem(STORAGE_KEYS.HOME_WIDGETS, DEFAULT_WIDGETS);
    setLocalItem(STORAGE_KEYS.WIDGET_SIZES, DEFAULT_WIDGET_SIZES);
  };

  const getGridSpanClass = (size: WidgetSize = 'small') => {
    switch (size) {
      case 'large':
        return 'col-span-2 sm:col-span-2 md:col-span-4';
      case 'medium':
        return 'col-span-2 sm:col-span-2';
      case 'small':
      default:
        return 'col-span-1';
    }
  };

  return (
    <div className="w-full mb-2">
      {/* Widget Section Header */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2">
          <h2 className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${
            isDarkMode ? 'text-white/90' : 'text-slate-800'
          }`}>
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Smart Stack Widgets</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">
            · {enabledWidgetIds.length} Active
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundManager.playClickSound();
            setIsCustomizeModalOpen(true);
          }}
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
            isDarkMode
              ? 'bg-slate-900/80 text-slate-300 hover:text-white border-white/10 hover:border-amber-500/40'
              : 'bg-white/90 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-400'
          }`}
          title="Customize Home Screen Widgets & Sizes"
        >
          <SlidersHorizontal className="w-3 h-3 text-amber-500" />
          <span>Edit & Resize</span>
        </button>
      </div>

      {/* iOS Smart Stack Dynamic CSS Grid */}
      <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 items-start">
        {enabledWidgetIds.map((widgetId) => {
          const currentSize = widgetSizes[widgetId] || (AVAILABLE_WIDGETS.find(w => w.id === widgetId)?.defaultSize || 'small');
          const spanClass = getGridSpanClass(currentSize);

          return (
            <motion.div
              key={widgetId}
              layout
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`w-full ${spanClass}`}
            >
              {widgetId === 'calendar' && (
                <CalendarWidget
                  events={calendarEvents}
                  onOpenApp={onOpenApp}
                  isDarkMode={isDarkMode}
                  size={currentSize}
                  onResize={(s) => handleResizeWidget('calendar', s)}
                />
              )}
              {widgetId === 'finance' && (
                <FinanceWidget
                  onOpenApp={onOpenApp}
                  isDarkMode={isDarkMode}
                  size={currentSize}
                  onResize={(s) => handleResizeWidget('finance', s)}
                />
              )}
              {widgetId === 'music' && (
                <MusicWidget
                  currentTrack={currentTrack}
                  isPlayingMusic={isPlayingMusic}
                  onTogglePlayMusic={onTogglePlayMusic}
                  onOpenApp={onOpenApp}
                  isDarkMode={isDarkMode}
                  size={currentSize}
                  onResize={(s) => handleResizeWidget('music', s)}
                />
              )}
              {widgetId === 'docs-ai' && (
                <DocsAiWidget
                  onOpenApp={onOpenApp}
                  isDarkMode={isDarkMode}
                  size={currentSize}
                  onResize={(s) => handleResizeWidget('docs-ai', s)}
                />
              )}
              {widgetId === 'notes' && (
                <NotesWidget
                  notes={recentNotes}
                  onOpenApp={onOpenApp}
                  isDarkMode={isDarkMode}
                  size={currentSize}
                  onResize={(s) => handleResizeWidget('notes', s)}
                />
              )}
              {widgetId === 'writing' && (
                <WritingWidget
                  latestDraft={latestDraft}
                  onOpenApp={onOpenApp}
                  isDarkMode={isDarkMode}
                  size={currentSize}
                  onResize={(s) => handleResizeWidget('writing', s)}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Widget Customization Modal */}
      <AnimatePresence>
        {isCustomizeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setIsCustomizeModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl p-5 border shadow-2xl ${
                isDarkMode ? 'bg-[#161b22] border-[#30363d] text-white' : 'bg-white border-neutral-200 text-neutral-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-700/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Smart Widgets & Sizes</h3>
                    <p className="text-[11px] text-neutral-400">Toggle widgets and configure sizes (Small, Medium, Large)</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCustomizeModalOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Widget List */}
              <div className="space-y-3 my-4 max-h-[380px] overflow-y-auto pr-1">
                {AVAILABLE_WIDGETS.map((w) => {
                  const isEnabled = enabledWidgetIds.includes(w.id);
                  const currentSize = widgetSizes[w.id] || w.defaultSize || 'small';

                  return (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all ${
                        isEnabled
                          ? isDarkMode
                            ? 'bg-[#0d1117] border-indigo-500/50 shadow-sm'
                            : 'bg-indigo-50/40 border-indigo-300 shadow-sm'
                          : isDarkMode
                            ? 'bg-[#161b22] border-[#30363d] opacity-60'
                            : 'bg-neutral-50 border-neutral-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0" onClick={() => handleToggleWidget(w.id)}>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{w.title}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-mono font-medium">
                              {w.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                            {w.description}
                          </p>
                        </div>

                        {/* iOS Toggle Switch */}
                        <div
                          onClick={() => handleToggleWidget(w.id)}
                          className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                            isEnabled ? 'bg-indigo-600 justify-end' : 'bg-neutral-600 justify-start'
                          }`}
                        >
                          <motion.div
                            layout
                            className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center"
                          >
                            {isEnabled && <Check className="w-3 h-3 text-indigo-600" />}
                          </motion.div>
                        </div>
                      </div>

                      {/* Size Selector Control */}
                      {isEnabled && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                          <span className="text-neutral-400 font-medium">Card Layout Size:</span>
                          <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/10">
                            {(['small', 'medium', 'large'] as WidgetSize[]).map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => handleResizeWidget(w.id, sz)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize transition-all ${
                                  currentSize === sz
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : isDarkMode ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {sz === 'small' ? '1×1 Small' : sz === 'medium' ? '2×1 Medium' : '2×2 Large'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-700/50 text-xs">
                <button
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Defaults
                </button>
                <button
                  onClick={() => setIsCustomizeModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
