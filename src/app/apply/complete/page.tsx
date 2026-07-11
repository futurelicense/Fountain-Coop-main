'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import {
  ApiError,
  createMembershipAccount,
  fetchMe,
  persistSupabaseSession,
  supabasePasswordSignIn,
  verifyApplicationPayment,
} from '@/api';
import { AlertBanner } from '@/components/member/ui/AlertBanner';

type Phase = 'verifying' | 'set-password' | 'creating' | 'done' | 'error';

export default function ApplicationCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans">
          <Loader2Icon className="w-8 h-8 text-fountain-blue animate-spin" />
        </div>
      }
    >
      <ApplicationCompleteContent />
    </Suspense>
  );
}

function ApplicationCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const reference = searchParams?.get('reference') ?? searchParams?.get('trxref');
    if (!reference) {
      setError('Missing payment reference. If you already paid, check your email or contact the cooperative.');
      setPhase('error');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const result = await verifyApplicationPayment(reference);
        if (cancelled) return;
        setApplicationId(result.applicationId);
        setEmail(result.email);
        setFullName(result.fullName);
        if (result.status === 'account_created') {
          setPhase('done');
        } else {
          setPhase('set-password');
        }
      } catch (e) {
        if (cancelled) return;
        const code = e instanceof ApiError ? (e.body as { error?: string })?.error : null;
        if (code === 'payment_not_successful') {
          setError('Your payment could not be confirmed yet. If you completed checkout, please wait a moment and refresh.');
        } else {
          setError('We could not verify your payment. Please contact the cooperative with your payment receipt.');
        }
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const handleCreateAccount = async () => {
    setError(null);
    if (!applicationId) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setPhase('creating');
    try {
      await createMembershipAccount(applicationId, password);
      const data = await supabasePasswordSignIn(email, password);
      if (data.access_token && data.refresh_token) {
        await persistSupabaseSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }
      await fetchMe();
      router.replace('/member');
    } catch (e) {
      const code = e instanceof ApiError ? (e.body as { error?: string; hint?: string })?.error : null;
      const hint = e instanceof ApiError ? (e.body as { hint?: string })?.hint : null;
      if (code === 'email_already_registered') {
        setError(hint ?? 'An account with this email already exists. Please sign in instead.');
      } else {
        setError('Could not create your account. Please try again.');
      }
      setPhase('set-password');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm">
        {phase === 'verifying' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-fountain-gray-200 p-8 text-center space-y-3">
            <Loader2Icon className="w-8 h-8 text-fountain-blue animate-spin mx-auto" />
            <p className="text-sm text-fountain-gray-600">Confirming your payment…</p>
          </div>
        ) : null}

        {phase === 'error' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-fountain-gray-200 p-6 space-y-4">
            <AlertBanner tone="error" message={error ?? 'Something went wrong.'} />
            <button
              type="button"
              onClick={() => router.push('/apply')}
              className="w-full py-3 bg-fountain-blue text-white rounded-xl text-sm font-semibold"
            >
              Back to application
            </button>
          </div>
        ) : null}

        {phase === 'done' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-fountain-gray-200 p-8 text-center space-y-4">
            <CheckCircleIcon className="w-14 h-14 text-fountain-green mx-auto" />
            <h2 className="text-lg font-bold text-fountain-gray-900">Account already set up</h2>
            <p className="text-sm text-fountain-gray-500">Sign in with {email} to access your account.</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-fountain-blue text-white rounded-xl text-sm font-semibold"
            >
              Go to sign in
            </button>
          </div>
        ) : null}

        {phase === 'set-password' || phase === 'creating' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-fountain-gray-200 p-6 space-y-4">
            <div className="text-center mb-2">
              <CheckCircleIcon className="w-12 h-12 text-fountain-green mx-auto mb-3" />
              <h1 className="text-xl font-bold text-fountain-gray-900">Payment received!</h1>
              <p className="text-sm text-fountain-gray-500 mt-1">
                Welcome, {fullName || 'there'}. Set a password to finish creating your account.
              </p>
            </div>

            {error ? <AlertBanner tone="warning" message={error} /> : null}

            <div>
              <label className="block text-sm font-medium text-fountain-gray-700 mb-1.5">
                Membership email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-fountain-gray-100 border border-fountain-gray-200 rounded-xl text-sm text-fountain-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-fountain-gray-700 mb-1.5">
                Create a password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 pr-11 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue focus:ring-2 focus:ring-fountain-blue/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fountain-gray-400 hover:text-fountain-gray-600"
                >
                  {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-fountain-gray-700 mb-1.5">
                Confirm password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-fountain-gray-50 border border-fountain-gray-200 rounded-xl text-sm outline-none focus:border-fountain-blue focus:ring-2 focus:ring-fountain-blue/20 transition-all"
              />
            </div>

            <button
              type="button"
              disabled={phase === 'creating'}
              onClick={() => void handleCreateAccount()}
              className="w-full py-3.5 bg-fountain-blue text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-fountain-blue/25 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {phase === 'creating' ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" /> Creating your account…
                </>
              ) : (
                'Create account & sign in'
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
