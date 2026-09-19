/**
 * @file googleCalendar.ts
 * @description Google Calendar API client using Firebase Auth OAuth Access Token.
 * Supports:
 * - Fetching upcoming calendar events
 * - Creating new calendar events synced with Google Calendar
 * - In-memory access token cache
 * - Error handling & re-authentication trigger
 */

import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from './firebase';

export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

// In-memory access token cache
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
}

/**
 * Set or clear the cached access token
 */
export function setCachedGoogleAccessToken(token: string | null, expiresInSeconds: number = 3600) {
  cachedAccessToken = token;
  tokenExpiresAt = token ? Date.now() + expiresInSeconds * 1000 : 0;
}

export function getCachedGoogleAccessToken(): string | null {
  if (!cachedAccessToken) return null;
  if (Date.now() > tokenExpiresAt) {
    cachedAccessToken = null;
    return null;
  }
  return cachedAccessToken;
}

/**
 * Interactive sign-in with Google to request Calendar Scopes
 */
export async function connectGoogleCalendar(): Promise<{ user: User; accessToken: string } | null> {
  const provider = new GoogleAuthProvider();
  CALENDAR_SCOPES.forEach(scope => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'offline'
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google OAuth access token.');
    }

    setCachedGoogleAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('[Google Calendar] Connect popup closed by user.');
      return null;
    }
    throw error;
  }
}

/**
 * Disconnect Google Calendar (clear in-memory token)
 */
export function disconnectGoogleCalendar(): void {
  setCachedGoogleAccessToken(null);
}

/**
 * Fetch calendar events from primary Google Calendar
 */
export async function listGoogleCalendarEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
  const token = getCachedGoogleAccessToken();
  if (!token) {
    throw new Error('Google Calendar is not connected. Please connect your Google account.');
  }

  const now = new Date();
  const defaultMin = timeMin || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const defaultMax = timeMax || new Date(now.getFullYear(), now.getMonth() + 2, 28).toISOString();

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', defaultMin);
  url.searchParams.set('timeMax', defaultMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '100');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      setCachedGoogleAccessToken(null);
      throw new Error('Google Calendar authorization expired. Please reconnect.');
    }
    const errText = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary || 'Untitled Event',
    description: item.description || '',
    location: item.location || '',
    start: item.start || {},
    end: item.end || {},
    htmlLink: item.htmlLink
  }));
}

/**
 * Create a new event on Google Calendar
 */
export async function createGoogleCalendarEvent(eventData: {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO String e.g. 2026-09-02T10:00:00Z
  endDateTime: string;   // ISO String
}): Promise<GoogleCalendarEvent> {
  const token = getCachedGoogleAccessToken();
  if (!token) {
    throw new Error('Google Calendar is not connected. Please connect your Google account.');
  }

  const payload = {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: eventData.startDateTime
    },
    end: {
      dateTime: eventData.endDateTime
    }
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    if (response.status === 401) {
      setCachedGoogleAccessToken(null);
      throw new Error('Google Calendar authorization expired. Please reconnect.');
    }
    const errText = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${errText}`);
  }

  const item = await response.json();
  return {
    id: item.id,
    summary: item.summary,
    description: item.description,
    location: item.location,
    start: item.start,
    end: item.end,
    htmlLink: item.htmlLink
  };
}
