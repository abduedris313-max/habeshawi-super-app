/**
 * @file DraggablePinnedApp.tsx
 * @description Draggable & Droppable Pinned Application icon component using React DnD.
 * Allows users to intuitively reorder Home Screen springboard applications via drag-and-drop.
 */

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'motion/react';
import { Minus } from 'lucide-react';
import { MiniAppConfig, LauncherIconStyle } from '../types';
import { soundManager } from '../lib/soundManager';
import { triggerHaptic } from '../utils/haptics';

export const DND_ITEM_TYPE_PINNED_APP = 'PINNED_APP';

export interface DragPinnedAppItem {
  id: string;
  index: number;
}

interface DraggablePinnedAppProps {
  app: MiniAppConfig;
  index: number;
  isEditMode: boolean;
  onOpenApp: (appId: string) => void;
  onTogglePinApp?: (appId: string) => void;
  moveApp: (dragIndex: number, hoverIndex: number) => void;
  onCommitReorder: () => void;
  iconStyle: LauncherIconStyle;
  isDarkMode: boolean;
  showLabels: boolean;
  getAppIconContainerStyle: (app: MiniAppConfig, index: number) => string;
  getIconComponent: (iconName: string, appId?: string) => React.ReactNode;
}

export const DraggablePinnedApp: React.FC<DraggablePinnedAppProps> = ({
  app,
  index,
  isEditMode,
  onOpenApp,
  onTogglePinApp,
  moveApp,
  onCommitReorder,
  iconStyle: _iconStyle,
  isDarkMode,
  showLabels,
  getAppIconContainerStyle,
  getIconComponent,
}) => {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const dragStartTimeRef = useRef<number>(0);

  // React DnD Drag hook
  const [{ isDragging }, dragRef] = useDrag({
    type: DND_ITEM_TYPE_PINNED_APP,
    item: () => {
      dragStartTimeRef.current = Date.now();
      triggerHaptic('medium');
      soundManager.playClickSound();
      return { id: app.id, index } as DragPinnedAppItem;
    },
    end: (_item, monitor) => {
      onCommitReorder();
      if (monitor.didDrop()) {
        triggerHaptic('light');
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // React DnD Drop hook
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: DND_ITEM_TYPE_PINNED_APP,
    hover: (draggedItem: DragPinnedAppItem) => {
      if (!itemRef.current) return;
      const dragIndex = draggedItem.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Perform the repositioning in local springboard state
      moveApp(dragIndex, hoverIndex);

      // Mutate the draggedItem index for smooth continuous dragging
      draggedItem.index = hoverIndex;
    },
    drop: () => {
      onCommitReorder();
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Attach both drag and drop connectors to the item container
  dragRef(dropRef(itemRef));

  const handleClick = (e: React.MouseEvent) => {
    // If we just dragged, prevent triggering click to open app
    const dragDuration = Date.now() - dragStartTimeRef.current;
    if (dragStartTimeRef.current > 0 && dragDuration > 250) {
      dragStartTimeRef.current = 0;
      e.stopPropagation();
      return;
    }

    if (!isEditMode) {
      onOpenApp(app.id);
    }
  };

  return (
    <div
      ref={itemRef}
      id={`draggable-app-${app.id}`}
      data-testid={`draggable-app-${app.id}`}
      onClick={handleClick}
      className={`relative flex flex-col items-center group select-none transition-all ${
        isDragging 
          ? 'opacity-30 scale-95 z-40' 
          : isOver && canDrop
            ? 'scale-105 z-30'
            : 'opacity-100 z-10'
      }`}
      style={{ touchAction: 'none' }}
    >
      <motion.div
        whileHover={isEditMode ? {} : { scale: 1.06 }}
        whileTap={isEditMode ? {} : { scale: 0.92 }}
        className={`flex flex-col items-center cursor-grab active:cursor-grabbing relative ${
          isEditMode ? (index % 2 === 0 ? 'animate-jiggle' : 'animate-jiggle-alt') : ''
        }`}
      >
        {/* Jiggle / Edit Mode Minus (Unpin) Button */}
        {isEditMode && onTogglePinApp && (
          <button
            id={`btn-unpin-${app.id}`}
            type="button"
            aria-label={`Unpin ${app.name}`}
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playClickSound();
              onTogglePinApp(app.id);
            }}
            className="absolute -top-1.5 -left-1.5 z-30 w-5 h-5 rounded-full bg-neutral-800 text-white border border-neutral-600 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
          >
            <Minus className="w-3 h-3 stroke-[3]" />
          </button>
        )}

        {/* Squircle App Icon Container */}
        <div 
          id={`app-icon-${app.id}`}
          className={`w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] p-1 flex flex-col items-center justify-center relative overflow-hidden transition-all group-hover:shadow-lg ${
            isOver && canDrop ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-neutral-900 shadow-indigo-500/40 shadow-lg' : ''
          } ${getAppIconContainerStyle(app, index)}`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none rounded-[16px]" />
          <div className="z-10 flex flex-col items-center justify-center w-full h-full">
            {getIconComponent(app.iconName, app.id)}
          </div>
          {app.badge && !isEditMode && (
            <span className="absolute top-0.5 right-0.5 px-1.5 py-0.2 rounded-full bg-red-500 text-[8px] font-bold text-white shadow-xs">
              {app.badge}
            </span>
          )}
        </div>

        {/* App Text Label */}
        {showLabels && (
          <span className={`mt-1.5 text-[10.5px] sm:text-[11.5px] text-center tracking-tight leading-tight line-clamp-2 max-w-[74px] sm:max-w-[82px] select-none ${
            isDarkMode
              ? 'text-white/95 font-semibold drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]'
              : 'text-neutral-900 font-bold drop-shadow-xs'
          }`}>
            {app.name}
          </span>
        )}
      </motion.div>
    </div>
  );
};
