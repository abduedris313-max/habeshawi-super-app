import React, { useState } from 'react';
import { X, LogIn, UserCheck, ShieldCheck, Sparkles, ExternalLink, Copy, Check, ShieldAlert } from 'lucide-react';
import { signInWithGoogle, signInAsGuest } from '../lib/firebase';
import firebaseConfig from '../../../../firebase-applet-config.json';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setErrorCode(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess();
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        const code = err?.code || (err?.message?.includes('unauthorized-domain') ? 'auth/unauthorized-domain' : '');
        setErrorCode(code);
        if (code === 'auth/unauthorized-domain') {
          setErrorMsg(`Deployment Domain Not Authorized: ${typeof window !== 'undefined' ? window.location.hostname : ''} is not registered in Firebase Authorized Domains.`);
        } else if (code === 'auth/popup-blocked') {
          setErrorMsg('Sign-in popup was blocked by browser. Please allow popups or use Guest Scholar mode.');
        } else {
          setErrorMsg(err?.message || 'Google Sign-In failed. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setErrorCode(null);
    try {
      await signInAsGuest();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Guest Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 relative overflow-hidden">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center border border-amber-500/20 font-ajam text-lg">
              ع
            </span>
            <h3 className="font-bold text-slate-100 text-lg">Scholar Sign In</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Access the Harmony Ajam digital manuscript archives, save favorite verses, and submit community transcriptions.
        </p>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {errorCode === 'auth/unauthorized-domain' && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-3 text-amber-200">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Domain Not Whitelisted in Firebase</span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              Google Sign-In requires adding this deployed domain to your Firebase Authorized Domains whitelist.
            </p>
            <div className="p-2 rounded-xl bg-black/40 border border-amber-500/20 font-mono text-[11px] text-white flex items-center justify-between gap-2">
              <span className="truncate">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.hostname);
                  setCopiedDomain(true);
                  setTimeout(() => setCopiedDomain(false), 2500);
                }}
                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
              >
                {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedDomain ? 'Copied' : 'Copy'}
              </button>
            </div>
            <a
              href={`https://console.firebase.google.com/project/${firebaseConfig.projectId || 'gen-lang-client-0142924503'}/authentication/settings`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Open Firebase Authorized Domains</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google Account
          </button>

          <button
            onClick={handleGuestSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            Continue as Guest Scholar
          </button>
        </div>

        <p className="text-[10px] text-slate-500 text-center">
          Secured by Firebase Authentication & Firestore Security Rules.
        </p>

      </div>

    </div>
  );
};
