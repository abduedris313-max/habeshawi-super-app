/**
 * @file index.tsx
 * @description Harmony Calendar Mini App Module.
 * Tri-Calendar platform supporting Gregorian, Hijri, and Ethiopian calendar systems,
 * bidirectional astronomical converters, and Google Calendar two-way synchronization.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRightLeft, 
  Cloud, 
  Plus, 
  Globe2, 
  Sunrise, 
  Compass,
  List,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import { HarmonyCalendarEvent, SystemUser } from '../../types';
import { CalendarSystem, CalendarViewMode } from './types';
import { CalendarMonthGrid } from './components/CalendarMonthGrid';
import { DayAgendaPanel } from './components/DayAgendaPanel';
import { CalendarConverterView } from './components/CalendarConverterView';
import { GoogleSyncView } from './components/GoogleSyncView';
import { EventModal } from './components/EventModal';
import { 
  GREGORIAN_MONTH_NAMES,
  HIJRI_MONTH_NAMES,
  ETHIOPIAN_MONTH_NAMES,
  getCalendarBundleFromGregorian,
  formatGregorianString,
  formatHijriString,
  formatEthiopianString
} from '../../lib/calendarConversions';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  listGoogleCalendarEvents,
  createGoogleCalendarEvent,
  getCachedGoogleAccessToken,
  GoogleCalendarEvent
} from '../../lib/googleCalendar';
import {
  saveHarmonyCalendarEvent,
  deleteHarmonyCalendarEvent,
  subscribeHarmonyCalendarEvents
} from '../../lib/firebase';
import {
  getLocalItem,
  setLocalItem,
  STORAGE_KEYS,
  INITIAL_OFFLINE_EVENTS
} from '../../lib/offlinePersistence';
import { useTheme } from '../../hooks/useTheme';

interface HarmonyCalendarAppModuleProps {
  user?: SystemUser | null;
  events?: HarmonyCalendarEvent[];
  onSaveEvent?: (event: Partial<HarmonyCalendarEvent> & { id: string; title: string; gregorianDate: string }) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<void>;
}

export const HarmonyCalendarAppModule: React.FC<HarmonyCalendarAppModuleProps> = ({
  user,
  events: initialPropEvents,
  onSaveEvent: propOnSaveEvent,
  onDeleteEvent: propOnDeleteEvent
}) => {
  const theme = useTheme();
  // Calendar View mode: 'month' | 'converter' | 'events' | 'google-sync'
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Primary Calendar Display System: Gregorian, Hijri, Ethiopian
  const [primarySystem, setPrimarySystem] = useState<CalendarSystem>('gregorian');

  // Active viewing anchor date
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-12
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Events state: Firestore synchronized with LocalStorage fallback
  const [events, setEvents] = useState<HarmonyCalendarEvent[]>(() => {
    if (initialPropEvents && initialPropEvents.length > 0) return initialPropEvents;
    return getLocalItem<HarmonyCalendarEvent[]>(STORAGE_KEYS.CALENDAR, INITIAL_OFFLINE_EVENTS);
  });

  // Event Modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string>(selectedDate);
  const [eventToEdit, setEventToEdit] = useState<HarmonyCalendarEvent | null>(null);

  // Google Calendar Integration state
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => {
    return !!getCachedGoogleAccessToken();
  });
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState<boolean>(false);

  // Subscribe to Firestore calendar events if user logged in
  useEffect(() => {
    if (!user || user.isAnonymous) {
      // Offline / anonymous mode fallback to local cache
      const cached = getLocalItem<HarmonyCalendarEvent[]>(STORAGE_KEYS.CALENDAR, INITIAL_OFFLINE_EVENTS);
      setEvents(cached);
      return;
    }

    const unsubscribe = subscribeHarmonyCalendarEvents(user.uid, (cloudEvents) => {
      if (cloudEvents.length > 0) {
        setEvents(cloudEvents);
        setLocalItem(STORAGE_KEYS.CALENDAR, cloudEvents);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Derived tri-calendar bundle for currently selected day or month anchor
  const currentMonthBundle = useMemo(() => {
    return getCalendarBundleFromGregorian(currentYear, currentMonth, 1);
  }, [currentYear, currentMonth]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  };

  // Event Management Handlers
  const handleOpenNewEvent = (dateStr?: string) => {
    setEventToEdit(null);
    setModalInitialDate(dateStr || selectedDate);
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (event: HarmonyCalendarEvent) => {
    setEventToEdit(event);
    setModalInitialDate(event.gregorianDate);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (
    eventData: Partial<HarmonyCalendarEvent> & { id: string; title: string; gregorianDate: string },
    syncToGoogle?: boolean
  ) => {
    let googleId = eventData.googleEventId;

    // Optional push to Google Calendar if requested
    if (syncToGoogle && isGoogleConnected) {
      try {
        const startIso = eventData.allDay 
          ? `${eventData.gregorianDate}T00:00:00Z`
          : `${eventData.gregorianDate}T${eventData.startTime || '09:00'}:00Z`;
        const endIso = eventData.allDay 
          ? `${eventData.gregorianDate}T23:59:59Z`
          : `${eventData.gregorianDate}T${eventData.endTime || '10:00'}:00Z`;

        const gRes = await createGoogleCalendarEvent({
          summary: eventData.title,
          description: eventData.description,
          location: eventData.location,
          startDateTime: startIso,
          endDateTime: endIso
        });
        googleId = gRes.id;
        eventData.syncedToGoogle = true;
        eventData.googleEventId = googleId;
      } catch (err) {
        console.warn('Google Calendar push failed during save:', err);
      }
    }

    const payload: HarmonyCalendarEvent = {
      id: eventData.id,
      userId: user?.uid || 'offline-user',
      title: eventData.title,
      description: eventData.description || '',
      location: eventData.location || '',
      gregorianDate: eventData.gregorianDate,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      allDay: eventData.allDay ?? false,
      color: eventData.color || '#ef4444',
      category: eventData.category || 'Personal',
      hijriDate: eventData.hijriDate,
      ethiopianDate: eventData.ethiopianDate,
      googleEventId: googleId,
      syncedToGoogle: !!googleId,
      createdAt: eventData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update state & local storage immediately
    const updated = [payload, ...events.filter(e => e.id !== payload.id)];
    setEvents(updated);
    setLocalItem(STORAGE_KEYS.CALENDAR, updated);

    // Save to Firestore if available
    if (propOnSaveEvent) {
      await propOnSaveEvent(payload);
    } else if (user && !user.isAnonymous) {
      await saveHarmonyCalendarEvent(user.uid, payload);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    setLocalItem(STORAGE_KEYS.CALENDAR, updated);

    if (propOnDeleteEvent) {
      await propOnDeleteEvent(id);
    } else if (user && !user.isAnonymous) {
      await deleteHarmonyCalendarEvent(id);
    }
  };

  // Google Calendar Connection Handlers
  const handleConnectGoogle = async () => {
    setIsGoogleSyncing(true);
    try {
      const conn = await connectGoogleCalendar();
      if (conn) {
        setIsGoogleConnected(true);
        await handleRefreshGoogleEvents();
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        console.warn('Google Calendar connection failed:', err?.message || err);
      }
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleCalendar();
    setIsGoogleConnected(false);
    setGoogleEvents([]);
  };

  const handleRefreshGoogleEvents = async () => {
    setIsGoogleSyncing(true);
    try {
      const gEvents = await listGoogleCalendarEvents();
      setGoogleEvents(gEvents);
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const handleImportGoogleEvent = async (gEv: GoogleCalendarEvent) => {
    const startStr = gEv.start.dateTime || gEv.start.date || new Date().toISOString();
    const [datePart, timePart] = startStr.split('T');
    const startTime = timePart ? timePart.substring(0, 5) : '09:00';

    const endStr = gEv.end.dateTime || gEv.end.date || '';
    const endTime = endStr.includes('T') ? endStr.split('T')[1].substring(0, 5) : '10:00';

    const [y, m, d] = datePart.split('-').map(Number);
    const bundle = getCalendarBundleFromGregorian(y || 2026, m || 1, d || 1);

    const newEvent: HarmonyCalendarEvent = {
      id: `imported-${gEv.id}`,
      userId: user?.uid || 'offline-user',
      title: gEv.summary,
      description: gEv.description || '',
      location: gEv.location || '',
      gregorianDate: datePart,
      startTime: gEv.start.dateTime ? startTime : undefined,
      endTime: gEv.end.dateTime ? endTime : undefined,
      allDay: !gEv.start.dateTime,
      category: 'Work',
      color: '#3b82f6',
      hijriDate: formatHijriString(bundle.hijri),
      ethiopianDate: formatEthiopianString(bundle.ethiopian),
      googleEventId: gEv.id,
      syncedToGoogle: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await handleSaveEvent(newEvent);
  };

  const handleExportToGoogle = async (event: HarmonyCalendarEvent) => {
    const startIso = event.allDay 
      ? `${event.gregorianDate}T00:00:00Z`
      : `${event.gregorianDate}T${event.startTime || '09:00'}:00Z`;
    const endIso = event.allDay 
      ? `${event.gregorianDate}T23:59:59Z`
      : `${event.gregorianDate}T${event.endTime || '10:00'}:00Z`;

    const gRes = await createGoogleCalendarEvent({
      summary: event.title,
      description: event.description,
      location: event.location,
      startDateTime: startIso,
      endDateTime: endIso
    });

    const updatedEvent: HarmonyCalendarEvent = {
      ...event,
      googleEventId: gRes.id,
      syncedToGoogle: true,
      updatedAt: new Date().toISOString()
    };

    await handleSaveEvent(updatedEvent);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-[#0d1117] text-neutral-900 dark:text-white select-none overflow-hidden">
      {/* Top Application Bar */}
      <header className="px-4 py-2.5 border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161b22] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Title, Navigation & Quick 'Today' button */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
            <CalendarIcon className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white min-w-[150px] text-center">
              {GREGORIAN_MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h1>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleJumpToToday}
              className="ml-1 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Center Multi-Calendar Subtitle */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Sunrise className="w-3.5 h-3.5" />
            {HIJRI_MONTH_NAMES[currentMonthBundle.hijri.month - 1]?.split(' ')[0]} {currentMonthBundle.hijri.year} AH
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Compass className="w-3.5 h-3.5" />
            {ETHIOPIAN_MONTH_NAMES[currentMonthBundle.ethiopian.month - 1]?.split(' ')[0]} {currentMonthBundle.ethiopian.year} EE
          </span>
        </div>

        {/* View Switcher, Primary System Selector & Add Event Button */}
        <div className="flex items-center gap-2">
          {/* Primary View Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'month' ? 'bg-rose-500 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('converter')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                viewMode === 'converter' ? 'bg-rose-500 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" />
              Converter
            </button>
            <button
              type="button"
              onClick={() => setViewMode('google-sync')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
                viewMode === 'google-sync' ? 'bg-blue-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Cloud className="w-3 h-3" />
              Google Sync
              {isGoogleConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          </div>

          {/* New Event Button */}
          <button
            type="button"
            onClick={() => handleOpenNewEvent(selectedDate)}
            className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </header>

      {/* Sub-header for Primary Calendar System Focus (when in month view) */}
      {viewMode === 'month' && (
        <div className="px-4 py-1.5 bg-neutral-100/70 dark:bg-[#161b22]/70 border-b border-neutral-200 dark:border-white/5 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Primary System:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPrimarySystem('gregorian')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  primarySystem === 'gregorian' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold' : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Gregorian (Standard)
              </button>
              <button
                type="button"
                onClick={() => setPrimarySystem('hijri')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  primarySystem === 'hijri' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Hijri (Islamic)
              </button>
              <button
                type="button"
                onClick={() => setPrimarySystem('ethiopian')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  primarySystem === 'ethiopian' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold' : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Ethiopian (Ge'ez)
              </button>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 hidden md:block">
            Double-click any day to create an event • All 3 systems computed synchronously
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {viewMode === 'month' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <CalendarMonthGrid
              currentYear={currentYear}
              currentMonth={currentMonth}
              primarySystem={primarySystem}
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onOpenNewEvent={handleOpenNewEvent}
              onOpenEditEvent={handleOpenEditEvent}
            />
            <DayAgendaPanel
              selectedDate={selectedDate}
              events={events}
              onOpenNewEvent={handleOpenNewEvent}
              onOpenEditEvent={handleOpenEditEvent}
            />
          </div>
        )}

        {viewMode === 'converter' && (
          <CalendarConverterView />
        )}

        {viewMode === 'google-sync' && (
          <GoogleSyncView
            isGoogleConnected={isGoogleConnected}
            googleEvents={googleEvents}
            isSyncing={isGoogleSyncing}
            onConnectGoogle={handleConnectGoogle}
            onDisconnectGoogle={handleDisconnectGoogle}
            onRefreshGoogleEvents={handleRefreshGoogleEvents}
            onImportGoogleEvent={handleImportGoogleEvent}
            onExportToGoogle={handleExportToGoogle}
            localEvents={events}
          />
        )}
      </main>

      {/* Event Creation & Editing Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventToEdit={eventToEdit}
        initialDate={modalInitialDate}
        isGoogleConnected={isGoogleConnected}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
};

export default HarmonyCalendarAppModule;
