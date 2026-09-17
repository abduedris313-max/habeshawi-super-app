/**
 * @file AdminAuthModal.tsx
 * @description Role-based authentication and registration modal for the Harmony App Store Developer Console.
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Building, 
  AtSign, 
  Key, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Code2, 
  Eye, 
  Crown,
  LogIn,
  UserPlus,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert
} from 'lucide-react';
import { AdminUserProfile, AdminUserRole } from '../types';
import { 
  loginAdminAccount, 
  registerAdminAccount, 
  loginAdminWithGoogleAccount, 
  getGuestDemoProfile 
} from '../services/adminAuthService';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (profile: AdminUserProfile) => void;
  isDarkMode: boolean;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  isDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regRole, setRegRole] = useState<AdminUserRole>('developer');
  const [adminSecretKey, setAdminSecretKey] = useState('');

  // UI status state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please provide email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const profile = await loginAdminAccount(loginEmail, loginPassword);
      setSuccessMsg(`Welcome back, ${profile.displayName}! Signed in as ${profile.role.toUpperCase()}`);
      setTimeout(() => {
        onAuthenticated(profile);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      setError('Name, email, and password are required.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const profile = await registerAdminAccount({
        email: regEmail,
        pass: regPassword,
        displayName: regName,
        desiredRole: regRole,
        organization: regOrg,
        developerHandle: regHandle,
        adminSecretKey
      });

      setSuccessMsg(`Account created! Logged in as ${profile.displayName} [${profile.role.toUpperCase()}]`);
      setTimeout(() => {
        onAuthenticated(profile);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setErrorCode(null);
    setLoading(true);
    try {
      const profile = await loginAdminWithGoogleAccount();
      setSuccessMsg(`Google Auth Success! Welcome, ${profile.displayName}`);
      setTimeout(() => {
        onAuthenticated(profile);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error(err);
      const code = err?.code || (err?.message?.includes('unauthorized-domain') ? 'auth/unauthorized-domain' : '');
      setErrorCode(code);
      if (code === 'auth/unauthorized-domain') {
        setError(`Deployment Domain Not Authorized: ${window.location.hostname} is not whitelisted in Firebase Console.`);
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign in popup was closed before completion.');
      } else if (code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked by browser. Please allow popups or use Demo Developer access.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in Firebase Console (Authentication -> Sign-in method).');
      } else {
        setError(err.message || 'Google Sign In failed. Please try email login or demo access.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = (role: AdminUserRole) => {
    const demoProfile = getGuestDemoProfile(role);
    onAuthenticated(demoProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden transition-all my-8 ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Top Modal Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Harmony App Store Console</h2>
              <p className="text-xs text-blue-100">Role-Based Developer Portal & Admin Management</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 mt-4 bg-black/20 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'bg-white text-slate-900 shadow-md' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'register' 
                  ? 'bg-white text-slate-900 shadow-md' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register Account
            </button>
          </div>
        </div>

        {/* Modal Form Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actionable Solution Card for Unauthorized Domain */}
          {errorCode === 'auth/unauthorized-domain' && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-3 text-amber-200">
              <div className="flex items-center gap-2 font-semibold text-amber-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Fix Google Sign-In for this Deployed Domain</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                Firebase restricts Google OAuth to whitelisted domains. To enable Google Sign-In on this Cloud Run URL:
              </p>
              <div className="p-2 rounded-lg bg-black/40 border border-amber-500/20 font-mono text-[11px] text-white flex items-center justify-between gap-2">
                <span className="truncate">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.hostname);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 2500);
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedDomain ? 'Copied' : 'Copy'}
                </button>
              </div>
              <a
                href="https://console.firebase.google.com/project/concrete-lead-kc9s2/authentication/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Firebase Authorized Domains</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[10px] text-slate-400 text-center">
                In Firebase Settings &rarr; Authorized domains &rarr; Add domain &rarr; Paste & Save.
              </p>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* SIGN IN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Developer Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="developer@harmony.dev"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                      isDarkMode 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Developer Console'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                <span className="relative px-3 text-[11px] text-slate-500 bg-slate-900">or continue with</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className={`w-full py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isDarkMode 
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign In with Google
              </button>
            </form>
          )}

          {/* REGISTER TAB */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-400">Developer Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="jane@company.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-400">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-400">Organization / Team</label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Acme Software Labs"
                      value={regOrg}
                      onChange={(e) => setRegOrg(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-slate-400">Developer Handle</label>
                  <div className="relative">
                    <AtSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="@janedoe_dev"
                      value={regHandle}
                      onChange={(e) => setRegHandle(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Console Role Selection */}
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-400">Account Console Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('developer')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      regRole === 'developer'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">Developer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      regRole === 'admin'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">Store Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('super_admin')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      regRole === 'super_admin'
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">Super Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('viewer')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      regRole === 'viewer'
                        ? 'bg-slate-600/20 border-slate-500 text-slate-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-[11px] font-semibold">Viewer</span>
                  </button>
                </div>
              </div>

              {/* Secret Key Input if Admin/Super Admin */}
              {(regRole === 'admin' || regRole === 'super_admin') && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <label className="block text-[11px] font-semibold mb-1 text-amber-300 flex items-center gap-1.5">
                    <Key className="w-3 h-3" />
                    Admin Access Security Key (Optional / Default Key: HARMONY-ADMIN-2026)
                  </label>
                  <input
                    type="text"
                    placeholder="HARMONY-ADMIN-2026"
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 text-xs text-amber-200 outline-none font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer mt-2"
              >
                {loading ? 'Creating Account...' : 'Register Developer Console Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Sandbox Demo Access Options */}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center">
              Quick Console Access (Sandbox Demo Mode):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoAccess('super_admin')}
                className="py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Crown className="w-3 h-3" />
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoAccess('developer')}
                className="py-1.5 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Code2 className="w-3 h-3" />
                Developer
              </button>
              <button
                type="button"
                onClick={() => handleDemoAccess('viewer')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                Auditor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
