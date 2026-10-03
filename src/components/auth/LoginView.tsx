import React, { useState } from 'react';
import { loginWithGoogle } from '../../auth/firebase';
import { AlertCircle, ShieldCheck, Users } from 'lucide-react';
import { SchoolLogo } from '../common/SchoolLogo';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const rawMsg = err?.message || (typeof err === 'string' ? err : err ? JSON.stringify(err) : 'An error occurred during Google sign-in.');
      if (err?.code === 'auth/popup-closed-by-user' || String(rawMsg).includes('popup-closed-by-user')) {
        setErrorMessage('Sign-in popup was closed. Please try again.');
      } else {
        setErrorMessage(rawMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <SchoolLogo size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Pragathi Vidyalaya
          </h1>
          <p className="text-sm font-medium text-indigo-600">
            Child Observation & Daily Summary System
          </p>
          <p className="text-xs text-gray-500">
            Authorized Teacher & Staff Portal
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-700">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Secure Gmail Access</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-700">
            <Users className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>Auto Class Mapping</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium whitespace-pre-line break-words">{errorMessage}</div>
          </div>
        )}

        {/* Google Sign-in Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-sm hover:shadow transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm">Sign in with Google</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-gray-500 leading-normal px-2">
            Use the registered school Gmail ID listed in the teachers roster.
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500">
            Need access? Contact Admin at{' '}
            <a
              href="mailto:vijaya.pathikonda@gmail.com"
              className="text-indigo-600 hover:underline font-medium"
            >
              vijaya.pathikonda@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
