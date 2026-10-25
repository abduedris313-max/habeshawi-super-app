/**
 * @file adminAuthService.ts
 * @description Role-based authentication, user profile registration, and permission management for the Harmony App Store Developer Console.
 */

import { doc, getDoc, setDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
import { 
  auth, 
  db, 
  loginWithEmail, 
  registerWithEmail, 
  loginWithGoogle, 
  logoutUser 
} from '../../src/lib/firebase';
import { AdminUserProfile, AdminUserRole, AdminRolePermissions } from '../types';

const ADMIN_USERS_COLLECTION = 'admin_users';

/**
 * Derives detailed permissions matrix based on Admin user role
 */
export function getRolePermissions(role: AdminUserRole): AdminRolePermissions {
  switch (role) {
    case 'super_admin':
      return {
        canPublish: true,
        canEditApp: true,
        canDeleteApp: true,
        canManageRepositories: true,
        canManageRoles: true,
        canSeedCatalog: true,
      };
    case 'admin':
      return {
        canPublish: true,
        canEditApp: true,
        canDeleteApp: true,
        canManageRepositories: true,
        canManageRoles: false,
        canSeedCatalog: true,
      };
    case 'developer':
      return {
        canPublish: true,
        canEditApp: true,
        canDeleteApp: true,
        canManageRepositories: false,
        canManageRoles: false,
        canSeedCatalog: false,
      };
    case 'viewer':
    default:
      return {
        canPublish: false,
        canEditApp: false,
        canDeleteApp: false,
        canManageRepositories: false,
        canManageRoles: false,
        canSeedCatalog: false,
      };
  }
}

/**
 * Fetches user's Admin Console role profile from Firestore
 */
export async function fetchAdminUserProfile(uid: string): Promise<AdminUserProfile | null> {
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as AdminUserProfile;
    }
  } catch (err) {
    console.warn('[AdminAuthService] Failed to fetch admin user doc from Firestore:', err);
  }
  return null;
}

/**
 * Saves or updates user's Admin profile in Firestore
 */
export async function saveAdminUserProfile(profile: AdminUserProfile): Promise<AdminUserProfile> {
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, profile.uid);
    await setDoc(docRef, profile, { merge: true });
  } catch (err) {
    console.warn('[AdminAuthService] Failed to save admin profile to Firestore:', err);
  }
  return profile;
}

/**
 * Registers a new Admin / Developer account in Firebase Auth + Firestore
 */
export async function registerAdminAccount(params: {
  email: string;
  pass: string;
  displayName: string;
  desiredRole: AdminUserRole;
  organization?: string;
  developerHandle?: string;
  adminSecretKey?: string;
}): Promise<AdminUserProfile> {
  const { email, pass, displayName, desiredRole, organization, developerHandle, adminSecretKey } = params;

  // Validate secret key for elevated roles (super_admin / admin)
  // Security Fix: Ensure secret key verification cannot be bypassed for 'admin' role.
  let assignedRole: AdminUserRole = 'developer';
  if (desiredRole === 'super_admin' || desiredRole === 'admin') {
    if (adminSecretKey?.trim() === 'HARMONY-ADMIN-2026' || adminSecretKey?.trim() === 'ADMIN-SUPER-KEY') {
      assignedRole = desiredRole;
    } else {
      assignedRole = 'developer';
    }
  } else if (desiredRole === 'viewer') {
    assignedRole = 'viewer';
  } else {
    assignedRole = 'developer';
  }

  const user = await registerWithEmail(email, pass, displayName);
  
  const profile: AdminUserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || user.displayName || email.split('@')[0],
    role: assignedRole,
    organization: organization || 'Independent Developer',
    developerHandle: developerHandle || `@${(displayName || email.split('@')[0]).toLowerCase().replace(/\s+/g, '')}`,
    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=3b82f6&color=fff`,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  await saveAdminUserProfile(profile);
  return profile;
}

/**
 * Logs in with Email/Password and returns or creates Admin Profile
 */
export async function loginAdminAccount(email: string, pass: string): Promise<AdminUserProfile> {
  const user = await loginWithEmail(email, pass);
  let profile = await fetchAdminUserProfile(user.uid);

  if (!profile) {
    profile = {
      uid: user.uid,
      email: user.email || email,
      displayName: user.displayName || email.split('@')[0],
      role: 'developer',
      organization: 'Harmony Developer Community',
      developerHandle: `@${(user.displayName || email.split('@')[0]).toLowerCase().replace(/\s+/g, '')}`,
      photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'Dev')}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    await saveAdminUserProfile(profile);
  } else {
    profile.lastLoginAt = new Date().toISOString();
    saveAdminUserProfile(profile).catch(() => {});
  }

  return profile;
}

/**
 * Logs in via Google Popup and syncs Admin Profile
 */
export async function loginAdminWithGoogleAccount(): Promise<AdminUserProfile> {
  const user = await loginWithGoogle();
  let profile = await fetchAdminUserProfile(user.uid);

  if (!profile) {
    profile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Google Developer',
      role: 'developer',
      organization: 'Google Developer Community',
      developerHandle: `@${(user.displayName || 'dev').toLowerCase().replace(/\s+/g, '')}`,
      photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Dev')}&background=3b82f6&color=fff`,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    await saveAdminUserProfile(profile);
  } else {
    profile.lastLoginAt = new Date().toISOString();
    saveAdminUserProfile(profile).catch(() => {});
  }

  return profile;
}

/**
 * Creates or retrieves Guest Developer demo profile
 */
export function getGuestDemoProfile(role: AdminUserRole = 'developer'): AdminUserProfile {
  const titles = {
    super_admin: 'Super Administrator',
    admin: 'Store Operations Admin',
    developer: 'Ecosystem Developer',
    viewer: 'Auditor / Viewer'
  };

  return {
    uid: `guest-demo-${role}-${Date.now()}`,
    email: `demo.${role}@harmony.internal`,
    displayName: `Demo ${titles[role]}`,
    role,
    organization: 'Harmony Developer Sandbox',
    developerHandle: `@demo_${role}`,
    photoURL: `https://ui-avatars.com/api/?name=Demo+${role}&background=3b82f6&color=fff`,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
}

/**
 * Fetches all registered admin users (Super Admin capability)
 */
export async function fetchAllAdminUsers(): Promise<AdminUserProfile[]> {
  try {
    const querySnap = await getDocs(collection(db, ADMIN_USERS_COLLECTION));
    return querySnap.docs.map(doc => doc.data() as AdminUserProfile);
  } catch (err) {
    console.warn('[AdminAuthService] Could not list admin users:', err);
    return [];
  }
}

/**
 * Updates a target user's role in Firestore
 */
export async function updateAdminUserRole(targetUid: string, newRole: AdminUserRole): Promise<void> {
  try {
    const docRef = doc(db, ADMIN_USERS_COLLECTION, targetUid);
    await updateDoc(docRef, { role: newRole });
  } catch (err) {
    console.error('[AdminAuthService] Failed to update user role:', err);
    throw err;
  }
}

export { logoutUser };
