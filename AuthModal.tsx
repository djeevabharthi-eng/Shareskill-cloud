import React, { useState } from 'react';
import { RefreshCw, ArrowRight, X } from 'lucide-react';
import type { UserProfile } from '../types.ts';

const AUTH_REQUEST_TIMEOUT_MS = 10_000;

async function fetchAuthWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function getAuthenticationError(error: unknown): string {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'The authentication request timed out. Please check that the backend is running and try again.';
  }
  if (error instanceof TypeError) {
    return 'Unable to reach the ShareSkill Cloud backend. Please check your connection and try again.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Authentication failed. Please try again.';
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (!isSignIn && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!isSignIn && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isSignIn ? '/api/auth/login' : '/api/auth/signup';
      const body = isSignIn
        ? { email: normalizedEmail, password }
        : { email: normalizedEmail, password, name: name.trim() };
      const res = await fetchAuthWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Authentication failed');
      }
      if (!data?.id) {
        throw new Error('The backend returned an invalid authentication response.');
      }
      onLoginSuccess(data);
      onClose();
    } catch (err: unknown) {
      setError(getAuthenticationError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetchAuthWithTimeout('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'jeeva@shareskill.cloud', provider: 'google' })
      });
      const user = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(user?.error || 'Google authentication failed');
      }
      if (!user?.id) {
        throw new Error('The backend returned an invalid authentication response.');
      }
      onLoginSuccess(user);
      onClose();
    } catch (err: unknown) {
      setError(getAuthenticationError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0f1629] border border-[#213052] shadow-2xl shadow-purple-950/40 text-center space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2540] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Title */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">ShareSkill Cloud</h2>
          <p className="text-xs text-slate-400">Exchange skills. Grow together.</p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#152038] border border-[#1e2e4f]">
          <button
            type="button"
            id="auth-tab-signin"
            onClick={() => setIsSignIn(true)}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
              isSignIn
                ? 'bg-[#1e2c4d] text-white shadow-sm border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            id="auth-tab-create-account"
            onClick={() => setIsSignIn(false)}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
              !isSignIn
                ? 'bg-[#1e2c4d] text-white shadow-sm border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {!isSignIn && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Your name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jeeva bharathi D"
                className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@shareskill.cloud"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>{isSignIn ? 'Sign in' : 'Create account'}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1e2c4d] w-full"></div>
          <span className="bg-[#0f1629] px-3 text-[11px] uppercase tracking-wider text-slate-400 absolute">
            OR
          </span>
        </div>

        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#141d33] hover:bg-[#1a2542] text-slate-200 border border-[#233357] text-xs font-semibold transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-[11px] text-slate-400">
          By continuing, you agree to our <span className="underline hover:text-purple-400 cursor-pointer">Terms</span> & <span className="underline hover:text-purple-400 cursor-pointer">Privacy</span>.
        </p>
      </div>
    </div>
  );
};
