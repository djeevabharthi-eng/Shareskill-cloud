import React, { useState } from 'react';
import { RefreshCw, ArrowRight, X } from 'lucide-react';
import type { UserProfile } from '../types.ts';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignIn) {
        // =========================
        // SUPABASE SIGN IN
        // =========================
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error('Login failed. User account was not found.');
        }

        // Get profile from Supabase
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        onLoginSuccess(profile as UserProfile);
      } else {
        // =========================
        // SUPABASE SIGN UP
        // =========================
        if (!name.trim()) {
          throw new Error('Please enter your name.');
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error('Account creation failed.');
        }

        // The Supabase database trigger automatically
        // creates the profile row.
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        onLoginSuccess(profile as UserProfile);
      }

      // Clear form
      setEmail('');
      setPassword('');
      setName('');
      setError(null);

      onClose();
    } catch (err: any) {
      console.error('Authentication error:', err);

      setError(
        err?.message ||
          'Authentication failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      // Real Google OAuth through Supabase
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Google authentication error:', err);

      setError(
        err?.message ||
          'Google authentication failed. Please try again.'
      );

      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0f1629] border border-[#213052] shadow-2xl shadow-purple-950/40 text-center space-y-6">

        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2540] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Title */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/40">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            ShareSkill Cloud
          </h2>

          <p className="text-xs text-slate-400">
            Exchange skills. Grow together.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#152038] border border-[#1e2e4f]">

          <button
            type="button"
            id="auth-tab-signin"
            onClick={() => {
              setIsSignIn(true);
              setError(null);
            }}
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
            onClick={() => {
              setIsSignIn(false);
              setError(null);
            }}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
              !isSignIn
                ? 'bg-[#1e2c4d] text-white shadow-sm border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create account
          </button>

        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">

          {/* Name */}
          {!isSignIn && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Your name
              </label>

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

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Email
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@shareskill.cloud"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#141d33] border border-[#213052] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            id="auth-submit-btn"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-purple-900/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />

                <span>
                  {isSignIn ? 'Sign in' : 'Create account'}
                </span>
              </>
            )}
          </button>

        </form>

        {/* OR */}
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
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#141d33] hover:bg-[#1a2542] text-slate-200 border border-[#233357] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
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

        {/* Terms */}
        <p className="text-[11px] text-slate-400">
          By continuing, you agree to our{' '}
          <span className="underline hover:text-purple-400 cursor-pointer">
            Terms
          </span>{' '}
          &{' '}
          <span className="underline hover:text-purple-400 cursor-pointer">
            Privacy
          </span>
          .
        </p>

      </div>
    </div>
  );
};