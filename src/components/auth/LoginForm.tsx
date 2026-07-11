'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import {
  ApiError,
  fetchMe,
  loginRequest,
  persistSupabaseSession,
  setToken,
  supabasePasswordSignIn,
} from '@/api';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { isLegacyAuthEnabled } from '@/lib/config/app-mode';
import { demoSupabaseEmailForIdentifier } from '@/lib/demoSupabaseSignIn';
import type { LoginResponse } from '@/api/types';

interface LoginFormProps {
  onLoginSuccess: (session: LoginResponse) => void;
}

const LEGACY_IDENTIFIER_BY_DEMO_EMAIL: Record<string, string> = {
  'demo-super-admin@fountain.coop': 'super_admin',
  'demo-tenant-admin@fountain.coop': 'tenant_admin',
  'demo-group-admin@fountain.coop': 'group_admin',
  'demo-member@fountain.coop': 'FC-1001',
};

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const trimmed = identifier.trim();
      const supabaseCfg = getSupabaseConfig();
      const emailForSupabase = trimmed.includes('@')
        ? trimmed.toLowerCase()
        : demoSupabaseEmailForIdentifier(trimmed);
      const needsSupabaseSession = Boolean(emailForSupabase);

      if (needsSupabaseSession && !supabaseCfg) {
        setError(
          'Member and email sign-in need Supabase. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.example), restart the dev server, then try again.'
        );
        return;
      }

      if (supabaseCfg && emailForSupabase) {
        try {
          const data = await supabasePasswordSignIn(emailForSupabase, password);
          if (data.access_token && data.refresh_token) {
            await persistSupabaseSession({
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            });
          }
          const me = await fetchMe();
          onLoginSuccess({
            token: data.access_token ?? '',
            user: me.user,
          });
          return;
        } catch (supabaseErr) {
          const fallbackIdentifier =
            LEGACY_IDENTIFIER_BY_DEMO_EMAIL[emailForSupabase];
          if (
            isLegacyAuthEnabled() &&
            fallbackIdentifier &&
            supabaseErr instanceof ApiError &&
            supabaseErr.status === 401
          ) {
            const session = await loginRequest(fallbackIdentifier, password);
            setToken(session.token);
            onLoginSuccess(session);
            return;
          }
          throw supabaseErr;
        }
      }

      if (!isLegacyAuthEnabled()) {
        setError(
          'Use your email address to sign in (e.g. demo-member@fountain.coop). Member ID–only login is disabled in wired test mode.'
        );
        return;
      }

      const session = await loginRequest(trimmed, password);
      setToken(session.token);
      onLoginSuccess(session);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        const id = identifier.trim();
        const usedSupabaseLogin =
          Boolean(id.includes('@') || demoSupabaseEmailForIdentifier(id));
        const hint = (err.body as { hint?: string } | null)?.hint;
        setError(
          usedSupabaseLogin
            ? hint
              ? `Invalid email or password. ${hint}`
              : 'Invalid email or password.'
            : 'Invalid Member ID, phone, or password.'
        );
      } else if (err instanceof ApiError && err.status === 503) {
        const body = err.body as { error?: string; hint?: string } | null;
        if (body?.error === 'supabase_unreachable' && body.hint) {
          setError(body.hint);
        } else {
          setError(
            'Supabase is not configured on the server. Check .env.local and restart the dev server.'
          );
        }
      } else {
        setError(
          'Could not complete sign-in. If you use local Supabase, run `supabase start` and ensure NEXT_PUBLIC_SUPABASE_URL reaches it (try http://localhost:54321).'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-fountain-gray-200 flex items-center justify-center mx-auto mb-5 p-2">
            <img
              src="/712c64ce-2884-4e65-9cac-33dd260726c9.png"
              alt="Fountain Coop Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-fountain-dark mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-fountain-gray-500">
            Sign in to your Fountain Coop account
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-fountain-gray-200 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-fountain-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue focus:ring-2 focus:ring-fountain-blue/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fountain-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue focus:ring-2 focus:ring-fountain-blue/20 transition-all placeholder:text-fountain-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fountain-gray-400 hover:text-fountain-gray-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-fountain-red font-medium">{error}</p>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-fountain-gray-300 text-fountain-blue focus:ring-fountain-blue/20"
                />
                <span className="text-xs text-fountain-gray-500 font-medium">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-xs text-fountain-blue font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-fountain-blue/25 flex items-center justify-center group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
              <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-fountain-gray-400 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/apply" className="text-fountain-blue font-semibold hover:underline">
            Be a Member
          </Link>
        </p>
      </div>
    </div>
  );
}
