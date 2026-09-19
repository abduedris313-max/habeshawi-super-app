import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  increment, 
  Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../../../firebase-applet-config.json';
import { Manuscript, Contribution, UserProfile, Comment } from '../types';
import { sampleManuscripts } from '../data/sampleManuscripts';

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info('[Ajam Script Firebase Auth] Google sign-in popup closed by user.');
      return null;
    }
    console.warn('[Ajam Script Firebase Auth] Google sign in status:', error?.code || error?.message);
    throw error;
  }
}

/**
 * Sign in Anonymously as Guest Scholar
 */
export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  await ensureUserProfile(result.user);
  return result.user;
}

/**
 * Sign Out
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Create or sync user profile in Firestore
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'user_profiles', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  } else {
    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || (user.isAnonymous ? 'Guest Scholar' : 'Ajam Enthusiast'),
      email: user.email || 'guest@harmonyajam.org',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      savedManuscriptIds: [],
      role: 'user',
      bio: 'Preserving Ethiopian Sufi Ajam manuscript tradition.',
      created_at: new Date().toISOString()
    };
    await setDoc(userRef, profile);
    return profile;
  }
}

/**
 * Fetch All Manuscripts from Firestore with fallback to sample data if database is empty
 */
export async function fetchManuscripts(): Promise<Manuscript[]> {
  try {
    const manuscriptCol = collection(db, 'manuscripts');
    const snap = await getDocs(manuscriptCol);
    if (!snap.empty) {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Manuscript));
      return docs;
    } else {
      // Seed initial historical sample manuscripts to Firestore
      await seedInitialManuscripts();
      return sampleManuscripts;
    }
  } catch (err) {
    console.warn("Firestore fetch manuscripts error, returning sample Manuscripts:", err);
    return sampleManuscripts;
  }
}

/**
 * Seed initial manuscripts to Firestore
 */
export async function seedInitialManuscripts(): Promise<void> {
  try {
    const manuscriptCol = collection(db, 'manuscripts');
    for (const item of sampleManuscripts) {
      const docRef = doc(manuscriptCol, item.id);
      await setDoc(docRef, item);
    }
    console.log("Successfully seeded sample manuscripts to Firestore!");
  } catch (err) {
    console.error("Error seeding initial manuscripts:", err);
  }
}

/**
 * Toggle Save/Favorite Manuscript for User Profile
 */
export async function toggleSaveManuscript(uid: string, manuscriptId: string): Promise<string[]> {
  try {
    const userRef = doc(db, 'user_profiles', uid);
    const snap = await getDoc(userRef);
    let currentSaved: string[] = [];
    if (snap.exists()) {
      currentSaved = snap.data().savedManuscriptIds || [];
    }
    let updated: string[];
    if (currentSaved.includes(manuscriptId)) {
      updated = currentSaved.filter(id => id !== manuscriptId);
    } else {
      updated = [...currentSaved, manuscriptId];
    }
    await updateDoc(userRef, { savedManuscriptIds: updated });
    return updated;
  } catch (err) {
    console.error("Error toggling saved manuscript:", err);
    return [];
  }
}

/**
 * Like a Manuscript
 */
export async function toggleLikeManuscript(manuscriptId: string): Promise<number> {
  try {
    const manuscriptRef = doc(db, 'manuscripts', manuscriptId);
    await updateDoc(manuscriptRef, { likesCount: increment(1) });
    const snap = await getDoc(manuscriptRef);
    return snap.exists() ? (snap.data().likesCount || 0) : 1;
  } catch (err) {
    console.error("Error liking manuscript:", err);
    return 1;
  }
}

/**
 * Submit Community Manuscript Contribution
 */
export async function addContribution(contribution: Omit<Contribution, 'id' | 'createdAt' | 'status'>): Promise<string> {
  try {
    const colRef = collection(db, 'contributions');
    const newDoc = await addDoc(colRef, {
      ...contribution,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return newDoc.id;
  } catch (err) {
    console.error("Error adding contribution:", err);
    throw err;
  }
}

/**
 * Fetch Comments for a Manuscript
 */
export async function fetchComments(manuscriptId: string): Promise<Comment[]> {
  try {
    const commentsCol = collection(db, 'comments');
    const q = query(commentsCol, where("manuscriptId", "==", manuscriptId));
    const snap = await getDocs(q);
    const comments = snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn("Error fetching comments:", err);
    return [];
  }
}

/**
 * Add Comment to Manuscript
 */
export async function addComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
  try {
    const commentsCol = collection(db, 'comments');
    const payload = {
      ...comment,
      createdAt: new Date().toISOString()
    };
    const ref = await addDoc(commentsCol, payload);
    return { id: ref.id, ...payload };
  } catch (err) {
    console.error("Error adding comment:", err);
    throw err;
  }
}

