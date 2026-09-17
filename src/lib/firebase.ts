/**
 * @file firebase.ts
 * @description Firebase SDK initialization (Auth & Firestore) for Harmony OS Super App.
 * Handles authentication, real-time listeners, and cloud synchronization across all mini apps.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  persistentLocalCache,
  persistentMultipleTabManager,
  getDocFromServer,
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { HarmonyNote, HarmonyDoc, HarmonyWritingDraft, HarmonyPlaylist, HarmonyAiChat, HarmonyCalendarEvent, SystemSettings } from '../types';
import { FinanceTransaction, FinanceAccount, FinanceBudget, FinanceLoan, FinanceSubscription } from '../apps/finance/types';
import { 
  STORAGE_KEYS, 
  setLocalItem, 
  getLocalItem, 
  notifyServiceWorkerFirestoreData,
  INITIAL_OFFLINE_NOTES,
  INITIAL_OFFLINE_DOCS,
  INITIAL_OFFLINE_EVENTS 
} from './offlinePersistence';

// Support both environment variables (VITE_FIREBASE_*) and provisioned firebase-applet-config.json
const env = (import.meta as any).env || {};
const resolvedConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(resolvedConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);

// Initialize Firestore with auto-detect transport settings and robust local cache persistence
const databaseId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreInstance: Firestore;
if (typeof window !== 'undefined') {
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      },
      databaseId && databaseId !== '(default)' ? databaseId : undefined
    );
  } catch {
    try {
      firestoreInstance = databaseId && databaseId !== '(default)'
        ? getFirestore(app, databaseId)
        : getFirestore(app);
    } catch {
      firestoreInstance = getFirestore(app);
    }
  }
} else {
  firestoreInstance = databaseId && databaseId !== '(default)'
    ? getFirestore(app, databaseId)
    : getFirestore(app);
}

export const db: Firestore = firestoreInstance;
export const firestore = db;

// -----------------------------------------------------------------------------
// FIRESTORE CONNECTION VALIDATION & ERROR REPORTING (Firebase Integration Skill)
// -----------------------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to Firestore on boot as mandated by the Firebase Integration Skill.
 */
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Successfully verified connection to backend.');
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable')))
    ) {
      console.warn('[Firestore] Operating in offline mode. Local persistence and cache active.');
    } else {
      console.debug('[Firestore] Connection status check complete.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

// -----------------------------------------------------------------------------
// AUTHENTICATION HELPERS
// -----------------------------------------------------------------------------

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  try {
    const userCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error: any) {
    console.error('[Firebase Auth Error] Google Sign-In with popup failed:', error);
    if (error?.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      console.warn(`[Firebase Auth] Domain "${currentHost}" must be whitelisted in Firebase Console under Authentication -> Settings -> Authorized Domains.`);
    }
    throw error;
  }
}

export async function loginWithGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  await signInWithRedirect(auth, provider);
}

export async function checkAuthRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log('[Firebase Auth] Signed in via redirect result:', result.user.email);
      return result.user;
    }
  } catch (error: any) {
    console.warn('[Firebase Auth] Redirect result processing:', error?.message || error);
    throw error;
  }
  return null;
}
// -----------------------------------------------------------------------------

export async function loginAnonymously() {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.warn('[Firebase Auth Warning] Anonymous sign in fallback to offline user:', error);
    return null;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function registerWithEmail(email: string, pass: string, displayName?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName && userCredential.user) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch (e) {
      console.warn('Could not set displayName:', e);
    }
  }
  return userCredential.user;
}

export async function resetUserPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function updateUserDisplayName(name: string) {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
}

export async function logoutUser() {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// -----------------------------------------------------------------------------
// HARMONY NOTES FIRESTORE CRUD
// -----------------------------------------------------------------------------

const NOTES_COLLECTION = 'harmony_notes';

export async function saveHarmonyNote(userId: string, note: Partial<HarmonyNote> & { id: string; title: string }) {
  const noteRef = doc(db, NOTES_COLLECTION, note.id);
  const data: HarmonyNote = {
    id: note.id,
    userId,
    title: note.title,
    content: note.content || '',
    category: note.category || 'Personal',
    tags: note.tags || [],
    pinned: note.pinned || false,
    updatedAt: new Date().toISOString(),
    createdAt: note.createdAt || new Date().toISOString()
  };
  try {
    await setDoc(noteRef, data, { merge: true });
  } catch (err) {
    console.warn('[Firestore saveNote Warning] Queuing offline save:', err);
  }
  // Immediately update local storage and notify Service Worker
  const currentNotes = getLocalItem<HarmonyNote[]>(STORAGE_KEYS.NOTES, INITIAL_OFFLINE_NOTES);
  const updatedNotes = [data, ...currentNotes.filter(n => n.id !== data.id)];
  setLocalItem(STORAGE_KEYS.NOTES, updatedNotes);
  setLocalItem(STORAGE_KEYS.SYSTEM_NOTES, updatedNotes);
  notifyServiceWorkerFirestoreData('notes', updatedNotes);

  return data;
}

export async function deleteHarmonyNote(noteId: string) {
  await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
}

export function subscribeHarmonyNotes(userId: string, callback: (notes: HarmonyNote[]) => void) {
  const q = query(
    collection(db, NOTES_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const notes: HarmonyNote[] = [];
    snapshot.forEach((docSnap) => {
      notes.push(docSnap.data() as HarmonyNote);
    });
    // sort locally by updatedAt desc
    notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    // Save snapshot to local persistence and postMessage to Service Worker cache
    setLocalItem(STORAGE_KEYS.NOTES, notes);
    setLocalItem(STORAGE_KEYS.SYSTEM_NOTES, notes);
    notifyServiceWorkerFirestoreData('notes', notes);

    callback(notes);
  }, (err) => {
    console.warn('[Firestore Notes Listener Warning] Falling back to offline ServiceWorker/Local cache:', err);
    const cached = getLocalItem<HarmonyNote[]>(STORAGE_KEYS.NOTES, INITIAL_OFFLINE_NOTES);
    callback(cached);
  });
}

// -----------------------------------------------------------------------------
// HARMONY DOCS FIRESTORE CRUD
// -----------------------------------------------------------------------------

const DOCS_COLLECTION = 'harmony_docs';

export async function saveHarmonyDoc(userId: string, document: Partial<HarmonyDoc> & { id: string; title: string }) {
  const docRef = doc(db, DOCS_COLLECTION, document.id);
  const words = (document.content || '').trim().split(/\s+/).filter(Boolean).length;
  const data: HarmonyDoc = {
    id: document.id,
    userId,
    title: document.title,
    content: document.content || '',
    wordCount: words,
    readingTimeMinutes: Math.max(1, Math.ceil(words / 200)),
    category: document.category || 'General',
    updatedAt: new Date().toISOString(),
    createdAt: document.createdAt || new Date().toISOString()
  };
  try {
    await setDoc(docRef, data, { merge: true });
  } catch (err) {
    console.warn('[Firestore saveDoc Warning] Queuing offline save:', err);
  }
  const currentDocs = getLocalItem<HarmonyDoc[]>(STORAGE_KEYS.DOCS, INITIAL_OFFLINE_DOCS);
  const updatedDocs = [data, ...currentDocs.filter(d => d.id !== data.id)];
  setLocalItem(STORAGE_KEYS.DOCS, updatedDocs);
  setLocalItem(STORAGE_KEYS.SYSTEM_DOCS, updatedDocs);
  notifyServiceWorkerFirestoreData('docs', updatedDocs);

  return data;
}

export async function deleteHarmonyDoc(docId: string) {
  await deleteDoc(doc(db, DOCS_COLLECTION, docId));
}

export function subscribeHarmonyDocs(userId: string, callback: (docs: HarmonyDoc[]) => void) {
  const q = query(
    collection(db, DOCS_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const docs: HarmonyDoc[] = [];
    snapshot.forEach((docSnap) => {
      docs.push(docSnap.data() as HarmonyDoc);
    });
    docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Save snapshot to local persistence and postMessage to Service Worker cache
    setLocalItem(STORAGE_KEYS.DOCS, docs);
    setLocalItem(STORAGE_KEYS.SYSTEM_DOCS, docs);
    notifyServiceWorkerFirestoreData('docs', docs);

    callback(docs);
  }, (err) => {
    console.warn('[Firestore Docs Listener Warning] Falling back to offline ServiceWorker/Local cache:', err);
    const cached = getLocalItem<HarmonyDoc[]>(STORAGE_KEYS.DOCS, INITIAL_OFFLINE_DOCS);
    callback(cached);
  });
}

// -----------------------------------------------------------------------------
// HARMONY WRITING FIRESTORE CRUD
// -----------------------------------------------------------------------------

const WRITING_COLLECTION = 'harmony_writing';

export async function saveHarmonyDraft(userId: string, draft: Partial<HarmonyWritingDraft> & { id: string; title: string }) {
  const draftRef = doc(db, WRITING_COLLECTION, draft.id);
  const words = (draft.content || '').trim().split(/\s+/).filter(Boolean).length;
  const data: HarmonyWritingDraft = {
    id: draft.id,
    userId,
    title: draft.title,
    content: draft.content || '',
    targetWordCount: draft.targetWordCount || 500,
    currentWordCount: words,
    typewriterSound: draft.typewriterSound !== undefined ? draft.typewriterSound : true,
    theme: draft.theme || 'twilight',
    updatedAt: new Date().toISOString(),
    createdAt: draft.createdAt || new Date().toISOString()
  };
  await setDoc(draftRef, data, { merge: true });
  return data;
}

export async function deleteHarmonyDraft(draftId: string) {
  await deleteDoc(doc(db, WRITING_COLLECTION, draftId));
}

export function subscribeHarmonyDrafts(userId: string, callback: (drafts: HarmonyWritingDraft[]) => void) {
  const q = query(
    collection(db, WRITING_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const drafts: HarmonyWritingDraft[] = [];
    snapshot.forEach((docSnap) => {
      drafts.push(docSnap.data() as HarmonyWritingDraft);
    });
    drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    callback(drafts);
  }, (err) => {
    console.warn('[Firestore Drafts Listener Warning]', err);
  });
}

// -----------------------------------------------------------------------------
// HARMONY MUSIC FIRESTORE CRUD
// -----------------------------------------------------------------------------

const MUSIC_COLLECTION = 'harmony_music';

export async function saveHarmonyPlaylist(userId: string, playlist: Partial<HarmonyPlaylist> & { id: string; name: string }) {
  const ref = doc(db, MUSIC_COLLECTION, playlist.id);
  const data: HarmonyPlaylist = {
    id: playlist.id,
    userId,
    name: playlist.name,
    tracks: playlist.tracks || [],
    updatedAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export function subscribeHarmonyPlaylists(userId: string, callback: (playlists: HarmonyPlaylist[]) => void) {
  const q = query(
    collection(db, MUSIC_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const playlists: HarmonyPlaylist[] = [];
    snapshot.forEach((docSnap) => {
      playlists.push(docSnap.data() as HarmonyPlaylist);
    });
    callback(playlists);
  }, (err) => {
    console.warn('[Firestore Music Listener Warning]', err);
  });
}

// -----------------------------------------------------------------------------
// HARMONY DOCS AI FIRESTORE CRUD
// -----------------------------------------------------------------------------

const AI_CHATS_COLLECTION = 'harmony_ai_chats';

export async function saveHarmonyAiChat(userId: string, chat: Partial<HarmonyAiChat> & { id: string }) {
  const ref = doc(db, AI_CHATS_COLLECTION, chat.id);
  const data: HarmonyAiChat = {
    id: chat.id,
    userId,
    docTitle: chat.docTitle || 'Untitled Document Query',
    messages: chat.messages || [],
    updatedAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export function subscribeHarmonyAiChats(userId: string, callback: (chats: HarmonyAiChat[]) => void) {
  const q = query(
    collection(db, AI_CHATS_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const chats: HarmonyAiChat[] = [];
    snapshot.forEach((docSnap) => {
      chats.push(docSnap.data() as HarmonyAiChat);
    });
    chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    callback(chats);
  }, (err) => {
    console.warn('[Firestore AI Chats Listener Warning]', err);
  });
}

// -----------------------------------------------------------------------------
// SYSTEM SETTINGS FIRESTORE PERSISTENCE & MULTI-DEVICE SYNC
// -----------------------------------------------------------------------------

const SYSTEM_SETTINGS_COLLECTION = 'system_settings';

/**
 * Persists user system preferences (theme, volume, focusMode, etc.) to Firestore
 * so that they sync across devices in real time.
 */
export async function saveSystemSettings(userId: string, settings: Partial<SystemSettings>): Promise<SystemSettings> {
  const settingsRef = doc(db, SYSTEM_SETTINGS_COLLECTION, userId);
  const data: Partial<SystemSettings> & { userId: string; updatedAt: string } = {
    ...settings,
    userId,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(settingsRef, data, { merge: true });
    // Also save into users document for cross-compatibility
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { settings: data, updatedAt: data.updatedAt }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn('[Firestore SystemSettings Save Warning]', err);
  }

  return data as SystemSettings;
}

/**
 * Subscribes to real-time updates for a user's system settings across devices.
 */
export function subscribeSystemSettings(userId: string, callback: (settings: SystemSettings) => void) {
  const settingsRef = doc(db, SYSTEM_SETTINGS_COLLECTION, userId);
  return onSnapshot(settingsRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as SystemSettings;
      callback(data);
    }
  }, (err) => {
    console.warn('[Firestore SystemSettings Listener Warning]', err);
  });
}

// -----------------------------------------------------------------------------
// HARMONY CALENDAR FIRESTORE CRUD
// -----------------------------------------------------------------------------

const CALENDAR_COLLECTION = 'harmony_calendar';

export async function saveHarmonyCalendarEvent(
  userId: string,
  event: Partial<HarmonyCalendarEvent> & { id: string; title: string; gregorianDate: string }
): Promise<HarmonyCalendarEvent> {
  const ref = doc(db, CALENDAR_COLLECTION, event.id);
  const data: HarmonyCalendarEvent = {
    id: event.id,
    userId,
    title: event.title,
    description: event.description || '',
    location: event.location || '',
    gregorianDate: event.gregorianDate,
    startTime: event.startTime || '09:00',
    endTime: event.endTime || '10:00',
    allDay: event.allDay ?? false,
    color: event.color || '#ef4444',
    category: event.category || 'Personal',
    hijriDate: event.hijriDate || '',
    ethiopianDate: event.ethiopianDate || '',
    googleEventId: event.googleEventId || '',
    syncedToGoogle: event.syncedToGoogle || false,
    createdAt: event.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  try {
    await setDoc(ref, data, { merge: true });
  } catch (err) {
    console.warn('[Firestore saveCalendarEvent Warning] Queuing offline save:', err);
  }
  const currentEvents = getLocalItem<HarmonyCalendarEvent[]>(STORAGE_KEYS.CALENDAR, INITIAL_OFFLINE_EVENTS);
  const updatedEvents = [data, ...currentEvents.filter(e => e.id !== data.id)];
  setLocalItem(STORAGE_KEYS.CALENDAR, updatedEvents);
  setLocalItem(STORAGE_KEYS.SYSTEM_CALENDAR, updatedEvents);
  notifyServiceWorkerFirestoreData('calendar', updatedEvents);

  return data;
}

export async function deleteHarmonyCalendarEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, CALENDAR_COLLECTION, eventId));
}

export function subscribeHarmonyCalendarEvents(userId: string, callback: (events: HarmonyCalendarEvent[]) => void) {
  const q = query(
    collection(db, CALENDAR_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const events: HarmonyCalendarEvent[] = [];
    snapshot.forEach((docSnap) => {
      events.push(docSnap.data() as HarmonyCalendarEvent);
    });
    // Sort by gregorianDate asc, then startTime
    events.sort((a, b) => {
      const cmp = a.gregorianDate.localeCompare(b.gregorianDate);
      if (cmp !== 0) return cmp;
      return (a.startTime || '').localeCompare(b.startTime || '');
    });

    // Save snapshot to local persistence and postMessage to Service Worker cache
    setLocalItem(STORAGE_KEYS.CALENDAR, events);
    setLocalItem(STORAGE_KEYS.SYSTEM_CALENDAR, events);
    notifyServiceWorkerFirestoreData('calendar', events);

    callback(events);
  }, (err) => {
    console.warn('[Firestore Calendar Listener Warning] Falling back to offline ServiceWorker/Local cache:', err);
    const cached = getLocalItem<HarmonyCalendarEvent[]>(STORAGE_KEYS.CALENDAR, INITIAL_OFFLINE_EVENTS);
    callback(cached);
  });
}

// -----------------------------------------------------------------------------
// HARMONY FINANCE & LEDGER FIRESTORE CRUD
// -----------------------------------------------------------------------------

const FINANCE_TX_COLLECTION = 'harmony_finance_transactions';
const FINANCE_ACCOUNTS_COLLECTION = 'harmony_finance_accounts';
const FINANCE_BUDGETS_COLLECTION = 'harmony_finance_budgets';
const FINANCE_LOANS_COLLECTION = 'harmony_finance_loans';
const FINANCE_SUBSCRIPTIONS_COLLECTION = 'harmony_finance_subscriptions';

// --- Transactions ---
export async function saveFinanceTransaction(
  userId: string,
  tx: Partial<FinanceTransaction> & { id: string }
): Promise<FinanceTransaction> {
  const ref = doc(db, FINANCE_TX_COLLECTION, tx.id);
  const data: FinanceTransaction = {
    id: tx.id,
    userId,
    title: tx.title || 'Untitled Transaction',
    amount: tx.amount || 0,
    type: tx.type || 'expense',
    category: tx.category || 'Other',
    date: tx.date || new Date().toISOString().slice(0, 10),
    accountId: tx.accountId || 'acc-checking',
    toAccountId: tx.toAccountId,
    paymentMethod: tx.paymentMethod || 'bank_transfer',
    notes: tx.notes,
    tags: tx.tags || [],
    isRecurring: tx.isRecurring || false,
    createdAt: tx.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export async function deleteFinanceTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, FINANCE_TX_COLLECTION, id));
}

export function subscribeFinanceTransactions(userId: string, callback: (txs: FinanceTransaction[]) => void) {
  const q = query(
    collection(db, FINANCE_TX_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const list: FinanceTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as FinanceTransaction);
    });
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(list);
  }, (err) => {
    console.warn('[Firestore Finance Tx Listener Warning]', err);
  });
}

// --- Accounts ---
export async function saveFinanceAccount(
  userId: string,
  acc: Partial<FinanceAccount> & { id: string }
): Promise<FinanceAccount> {
  const ref = doc(db, FINANCE_ACCOUNTS_COLLECTION, acc.id);
  const data: FinanceAccount = {
    id: acc.id,
    userId,
    name: acc.name || 'Standard Account',
    type: acc.type || 'checking',
    balance: acc.balance !== undefined ? acc.balance : 0,
    currency: acc.currency || 'USD',
    institution: acc.institution,
    accountNumberMasked: acc.accountNumberMasked,
    color: acc.color || '#3b82f6',
    updatedAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export async function deleteFinanceAccount(id: string): Promise<void> {
  await deleteDoc(doc(db, FINANCE_ACCOUNTS_COLLECTION, id));
}

export function subscribeFinanceAccounts(userId: string, callback: (accounts: FinanceAccount[]) => void) {
  const q = query(
    collection(db, FINANCE_ACCOUNTS_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const list: FinanceAccount[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as FinanceAccount);
    });
    callback(list);
  }, (err) => {
    console.warn('[Firestore Finance Accounts Listener Warning]', err);
  });
}

// --- Budgets ---
export async function saveFinanceBudget(
  userId: string,
  budget: Partial<FinanceBudget> & { id: string }
): Promise<FinanceBudget> {
  const ref = doc(db, FINANCE_BUDGETS_COLLECTION, budget.id);
  const data: FinanceBudget = {
    id: budget.id,
    userId,
    category: budget.category || 'Other',
    monthlyLimit: budget.monthlyLimit || 500,
    alertThreshold: budget.alertThreshold || 80,
    currency: budget.currency || 'USD',
    createdAt: budget.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export async function deleteFinanceBudget(id: string): Promise<void> {
  await deleteDoc(doc(db, FINANCE_BUDGETS_COLLECTION, id));
}

export function subscribeFinanceBudgets(userId: string, callback: (budgets: FinanceBudget[]) => void) {
  const q = query(
    collection(db, FINANCE_BUDGETS_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const list: FinanceBudget[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as FinanceBudget);
    });
    callback(list);
  }, (err) => {
    console.warn('[Firestore Finance Budgets Listener Warning]', err);
  });
}

// --- Loans ---
export async function saveFinanceLoan(
  userId: string,
  loan: Partial<FinanceLoan> & { id: string }
): Promise<FinanceLoan> {
  const ref = doc(db, FINANCE_LOANS_COLLECTION, loan.id);
  const data: FinanceLoan = {
    id: loan.id,
    userId,
    title: loan.title || 'Untitled Loan',
    type: loan.type || 'borrowed',
    lenderOrBorrower: loan.lenderOrBorrower || 'Lender',
    originalPrincipal: loan.originalPrincipal || 10000,
    currentBalance: loan.currentBalance !== undefined ? loan.currentBalance : 10000,
    interestRate: loan.interestRate || 5.0,
    tenureMonths: loan.tenureMonths || 36,
    monthlyEmi: loan.monthlyEmi || 300,
    startDate: loan.startDate || new Date().toISOString().slice(0, 10),
    nextDueDate: loan.nextDueDate || new Date().toISOString().slice(0, 10),
    totalPaidSoFar: loan.totalPaidSoFar || 0,
    status: loan.status || 'active',
    notes: loan.notes,
    paymentHistory: loan.paymentHistory || [],
    createdAt: loan.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export async function deleteFinanceLoan(id: string): Promise<void> {
  await deleteDoc(doc(db, FINANCE_LOANS_COLLECTION, id));
}

export function subscribeFinanceLoans(userId: string, callback: (loans: FinanceLoan[]) => void) {
  const q = query(
    collection(db, FINANCE_LOANS_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const list: FinanceLoan[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as FinanceLoan);
    });
    callback(list);
  }, (err) => {
    console.warn('[Firestore Finance Loans Listener Warning]', err);
  });
}

// --- Subscriptions ---
export async function saveFinanceSubscription(
  userId: string,
  sub: Partial<FinanceSubscription> & { id: string }
): Promise<FinanceSubscription> {
  const ref = doc(db, FINANCE_SUBSCRIPTIONS_COLLECTION, sub.id);
  const data: FinanceSubscription = {
    id: sub.id,
    userId,
    name: sub.name || 'Subscription',
    amount: sub.amount || 9.99,
    category: sub.category || 'Subscriptions',
    billingCycle: sub.billingCycle || 'monthly',
    nextBillingDate: sub.nextBillingDate || new Date().toISOString().slice(0, 10),
    accountId: sub.accountId || 'acc-checking',
    status: sub.status || 'active',
    remindDaysBefore: sub.remindDaysBefore || 3,
    notes: sub.notes,
    serviceIcon: sub.serviceIcon,
    createdAt: sub.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(ref, data, { merge: true });
  return data;
}

export async function deleteFinanceSubscription(id: string): Promise<void> {
  await deleteDoc(doc(db, FINANCE_SUBSCRIPTIONS_COLLECTION, id));
}

export function subscribeFinanceSubscriptions(userId: string, callback: (subs: FinanceSubscription[]) => void) {
  const q = query(
    collection(db, FINANCE_SUBSCRIPTIONS_COLLECTION),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const list: FinanceSubscription[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as FinanceSubscription);
    });
    callback(list);
  }, (err) => {
    console.warn('[Firestore Finance Subs Listener Warning]', err);
  });
}


