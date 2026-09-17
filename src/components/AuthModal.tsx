/**
 * @file AuthModal.tsx
 * @description iOS style Firebase Auth sheet modal for Harmony Super App.
 * Supports Sign In, Sign Up with Display Name, Forgot Password with email reset,
 * and seamless Guest/Anonymous mode with theme support (Light & Dark).
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Flame, User, Mail, Lock, LogIn, UserPlus, LogOut, 
  CheckCircle2, KeyRound, ArrowLeft, AlertCircle, Edit2, Check, Sparkles,
  ExternalLink, Copy, ShieldAlert, Globe
} from 'lucide-react';
import { 
  loginWithGoogle,
  loginWithGoogleRedirect,
  loginAnonymously, 
  loginWithEmail, 
  registerWithEmail, 
  resetUserPassword, 
  updateUserDisplayName, 
  logoutUser 
} from '../lib/firebase';
import { HarmonyLogo } from './HarmonyLogo';
import { SystemUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SystemUser | null;
  isDarkMode?: boolean;
  initialMode?: 'signin' | 'signup' | 'forgot' | 'profile';
  onAuthSuccess?: (message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser, 
  isDarkMode = true,
  initialMode,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'profile'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Profile editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Set initial mode based on authentication state
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setAuthErrorCode(null);
      setCopiedDomain(false);
      setSuccessMsg('');
      if (initialMode) {
        setMode(initialMode);
      } else if (currentUser && !currentUser.isAnonymous) {
        setMode('profile');
      } else {
        setMode('signin');
      }

      if (currentUser?.displayName) {
        setNewDisplayName(currentUser.displayName);
      }
    }
  }, [isOpen, currentUser, initialMode]);

  if (!isOpen) return null;

  const getFriendlyErrorMessage = (error: any): string => {
    const code = error?.code || '';
    const message = error?.message || '';
    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
      return `This domain (${typeof window !== 'undefined' ? window.location.hostname : 'current site'}) is not authorized in Firebase. Add it in Firebase Console under Authentication -> Settings -> Authorized domains.`;
    }
    if (code === 'auth/popup-blocked') {
      return 'The sign-in popup was blocked by the browser. You can use the direct redirect sign-in option below.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Google Sign-In is not enabled for this Firebase project. Please enable the Google provider in Firebase Console -> Authentication -> Sign-in method.';
    }
    if (code === 'auth/cancelled-popup-request') {
      return 'Sign-in was cancelled due to a newer sign-in attempt. Please try again.';
    }
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Incorrect email or password. Please try again.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password must be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    return message || 'Authentication failed. Please check your credentials.';
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      if (onAuthSuccess) {
        onAuthSuccess(`Welcome back, ${email}! Cloud sync enabled.`);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(email.trim(), password, displayName.trim() || undefined);
      if (onAuthSuccess) {
        onAuthSuccess(`Account created for ${displayName || email}! Cloud sync active.`);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    try {
      await resetUserPassword(email.trim());
      setSuccessMsg(`Password reset email sent to ${email.trim()}. Please check your inbox and spam folder.`);
    } catch (err: any) {
      setErrorMsg(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setAuthErrorCode(null);
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user && onAuthSuccess) {
        onAuthSuccess(`Signed in with Google as ${user.displayName || user.email}! Cloud sync active.`);
      }
      onClose();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        const code = err?.code || (err?.message?.includes('unauthorized-domain') ? 'auth/unauthorized-domain' : '');
        setAuthErrorCode(code);
        setErrorMsg(getFriendlyErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousAuth = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      await loginAnonymously();
      onClose();
    } catch {
      // Seamless guest mode fallback with local cache
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newDisplayName.trim()) return;
    setIsLoading(true);
    try {
      await updateUserDisplayName(newDisplayName.trim());
      setIsEditingName(false);
      setSuccessMsg('Display name updated successfully.');
    } catch (err: any) {
      setErrorMsg('Failed to update display name.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setMode('signin');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
    } catch (err: any) {
      setErrorMsg('Failed to sign out.');
    } finally {
      setIsLoading(false);
    }
  };

  const isGuest = !currentUser || currentUser.isAnonymous;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl relative border transition-colors ${
          isDarkMode
            ? 'bg-[#161b22] border-[#30363d] text-[#c9d1d9]'
            : 'bg-white border-neutral-200 text-neutral-800 shadow-neutral-500/20'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b mb-5 ${
          isDarkMode ? 'border-[#30363d]' : 'border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <HarmonyLogo size="sm" isDarkMode={isDarkMode} />
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-neutral-900'
              }`}>
                <span>
                  {mode === 'profile' 
                    ? 'Habeshawi Account' 
                    : mode === 'signup' 
                    ? 'Create Habeshawi Account' 
                    : mode === 'forgot' 
                    ? 'Reset Password' 
                    : 'Sign In to Habeshawi'}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isGuest 
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {isGuest ? 'Guest Mode' : 'Cloud Sync'}
                </span>
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-500'}`}>
                {mode === 'profile' 
                  ? 'Connected to Firebase Cloud' 
                  : 'Optional account for cross-device sync'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-full transition-colors ${
              isDarkMode
                ? 'bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900'
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications & Error Feedback */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Actionable Solution Card for Unauthorized Domain */}
          {authErrorCode === 'auth/unauthorized-domain' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`mb-4 p-4 rounded-2xl border text-xs space-y-3 ${
                isDarkMode 
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' 
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-amber-400">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>How to Authorize this Deployed Domain</span>
              </div>
              <p className="leading-relaxed text-[11px] opacity-90">
                Firebase Authentication restricts OAuth popups to authorized domains. Add this deployed domain to your Firebase Console:
              </p>
              
              <div className={`p-2.5 rounded-xl font-mono text-[11px] flex items-center justify-between gap-2 border ${
                isDarkMode ? 'bg-black/40 border-amber-500/20 text-white' : 'bg-white border-amber-200 text-neutral-900'
              }`}>
                <span className="truncate">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.hostname);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2500);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-sans font-medium text-[10px] flex items-center gap-1 transition-all ${
                    copiedDomain 
                      ? 'bg-emerald-500 text-white' 
                      : isDarkMode ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {copiedDomain ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedDomain ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <a
                  href="https://console.firebase.google.com/project/concrete-lead-kc9s2/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Firebase Console Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-[10px] opacity-75 leading-tight text-center">
                  Scroll to <b>Authorized domains</b> &rarr; Click <b>Add domain</b> &rarr; Paste and Save.
                </p>
              </div>
            </motion.div>
          )}

          {/* Actionable Solution Card for Popup Blocked */}
          {authErrorCode === 'auth/popup-blocked' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 text-xs space-y-2.5 text-blue-300"
            >
              <div className="flex items-center gap-2 font-semibold text-blue-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Popup Blocked by Browser or iFrame</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Your browser or iframe environment blocked the authentication popup. You can sign in using full redirect mode:
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await loginWithGoogleRedirect();
                  } catch (err: any) {
                    setErrorMsg(getFriendlyErrorMessage(err));
                    setIsLoading(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Sign In via Full-Page Redirect</span>
              </button>
            </motion.div>
          )}

          {/* Actionable Solution Card for Operation Not Allowed */}
          {authErrorCode === 'auth/operation-not-allowed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-xs space-y-2.5 text-rose-300"
            >
              <div className="flex items-center gap-2 font-semibold text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Google Sign-In Provider Disabled</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Google provider must be enabled in Firebase Console &rarr; Authentication &rarr; Sign-in method.
              </p>
              <a
                href="https://console.firebase.google.com/project/concrete-lead-kc9s2/authentication/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Enable Google in Firebase Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODE 1: USER PROFILE VIEW (When logged in with registered account) */}
        {mode === 'profile' && currentUser && !currentUser.isAnonymous && (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border text-center relative ${
              isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50/70 border-indigo-200'
            }`}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mx-auto flex items-center justify-center mb-3 shadow-md">
                <User className="w-8 h-8" />
              </div>

              {/* Display Name Row */}
              {isEditingName ? (
                <div className="flex items-center justify-center gap-2 max-w-xs mx-auto mb-2">
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border focus:outline-none ${
                      isDarkMode
                        ? 'bg-[#0d1117] border-[#30363d] text-white'
                        : 'bg-white border-neutral-300 text-neutral-900'
                    }`}
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                    title="Save Name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className={`p-1.5 rounded-lg border ${
                      isDarkMode ? 'border-[#30363d] text-[#8b949e]' : 'border-neutral-200 text-neutral-600'
                    }`}
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <h4 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'Habeshawi User'}
                  </h4>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded text-neutral-400 hover:text-indigo-400"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                {currentUser.email}
              </p>
              <p className="text-[10px] text-neutral-500 font-mono">UID: {currentUser.uid.slice(0, 16)}...</p>

              <div className="mt-3 flex items-center justify-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time Cloud Sync Active</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('signin')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  isDarkMode
                    ? 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d]'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Switch Account</span>
              </button>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: SIGN IN VIEW */}
        {mode === 'signin' && (
          <div>
            {/* Optional Banner Note */}
            <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              isDarkMode ? 'bg-neutral-800/40 border-neutral-700/50 text-[#8b949e]' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
            }`}>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Optional Account</strong>: Habeshawi works 100% offline out-of-the-box. Signing in links your notes, docs, and preferences to Firebase across all your browsers and phones.
              </span>
            </div>

            {/* Google Sign In (Firebase Recommended) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-3 mb-3 shadow-xs ${
                isDarkMode
                  ? 'bg-[#161b22] hover:bg-[#21262d] text-white border-[#30363d]'
                  : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="my-3 flex items-center gap-3">
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-[#30363d]' : 'bg-neutral-200'}`} />
              <span className={`text-[10px] uppercase font-mono ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`}>OR EMAIL</span>
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-[#30363d]' : 'bg-neutral-200'}`} />
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold mb-1 block ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-indigo-400 placeholder-[#8b949e]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500 placeholder-neutral-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs font-semibold ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setSuccessMsg('');
                      setMode('forgot');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-indigo-400 placeholder-[#8b949e]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500 placeholder-neutral-400'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Signing In...' : 'Sign In with Email'}</span>
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-[#30363d]' : 'bg-neutral-200'}`} />
              <span className={`text-[10px] uppercase font-mono ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`}>OR</span>
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-[#30363d]' : 'bg-neutral-200'}`} />
            </div>

            {/* Guest / Anonymous Quick Access */}
            <button
              onClick={handleAnonymousAuth}
              disabled={isLoading}
              className={`w-full py-2.5 rounded-xl border font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                isDarkMode
                  ? 'bg-[#21262d] hover:bg-[#30363d] text-white border-[#30363d]'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'
              }`}
            >
              <User className="w-4 h-4 text-amber-400" />
              <span>Continue as Guest (No Account Required)</span>
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('signup');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Don't have an account? <span className="underline font-bold">Sign Up</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: SIGN UP VIEW */}
        {mode === 'signup' && (
          <div>
            <div className={`mb-3 p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
              isDarkMode ? 'bg-neutral-800/40 border-neutral-700/50 text-[#8b949e]' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
            }`}>
              <UserPlus className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Create an account to synchronize notes, playlists, and documents.</span>
            </div>

            {/* Google Sign In Option */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-3 mb-3 shadow-xs ${
                isDarkMode
                  ? 'bg-[#161b22] hover:bg-[#21262d] text-white border-[#30363d]'
                  : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign Up with Google</span>
            </button>

            <div className="my-3 flex items-center gap-3">
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-[#30363d]' : 'bg-neutral-200'}`} />
              <span className={`text-[10px] uppercase font-mono ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`}>OR WITH EMAIL</span>
              <div className={`h-px flex-1 ${isDarkMode ? 'bg-[#30363d]' : 'bg-neutral-200'}`} />
            </div>

            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold mb-1 block ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-indigo-400 placeholder-[#8b949e]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500 placeholder-neutral-400'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold mb-1 block ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-indigo-400 placeholder-[#8b949e]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500 placeholder-neutral-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs font-semibold mb-1 block ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                        isDarkMode
                          ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-indigo-400 placeholder-[#8b949e]'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500 placeholder-neutral-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-xs font-semibold mb-1 block ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                    Confirm
                  </label>
                  <div className="relative">
                    <KeyRound className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat pass"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                        isDarkMode
                          ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-indigo-400 placeholder-[#8b949e]'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500 placeholder-neutral-400'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Creating Account...' : 'Create Habeshawi Account'}</span>
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('signin');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Already have an account? <span className="underline font-bold">Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 4: FORGOT PASSWORD VIEW */}
        {mode === 'forgot' && (
          <div>
            <div className={`mb-4 p-3 rounded-xl border text-xs ${
              isDarkMode ? 'bg-neutral-800/40 border-neutral-700/50 text-[#8b949e]' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
            }`}>
              Enter the email address associated with your Habeshawi account. We'll send a secure password reset link to your email.
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold mb-1 block ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-600'}`}>
                  Account Email
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-3 ${isDarkMode ? 'text-[#8b949e]' : 'text-neutral-400'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
                      isDarkMode
                        ? 'bg-[#0d1117] border-[#30363d] text-white focus:border-indigo-400 placeholder-[#8b949e]'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-indigo-500 placeholder-neutral-400'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isLoading ? 'Sending Link...' : 'Send Password Reset Link'}</span>
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('signin');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
