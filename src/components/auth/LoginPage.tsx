import React, { useState } from 'react';
import { SchoolLogo } from '../common/SchoolLogo';
import { AlertCircle, ShieldCheck, School } from 'lucide-react';
import { loginWithGoogle } from '../../auth/firebase';

export type UserRole = 'admin' | 'teacher';

export interface AuthUser {
  username: string;
  email?: string;
  role: UserRole;
  assignedClasses?: string[];
  defaultClassId?: string;
  photoUrl?: string;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  schoolName?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  schoolName = 'Pragathi Vidyalaya School',
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setErrorMsg(null);
      const { user, teacher } = await loginWithGoogle();

      const authUser: AuthUser = {
        username: teacher.name,
        email: user.email || undefined,
        role: teacher.role === 'Admin' ? 'admin' : 'teacher',
        assignedClasses: teacher.assignedClasses,
        defaultClassId: teacher.defaultClassId,
        photoUrl: user.photoURL || undefined,
      };

      localStorage.setItem('pragathi_auth_user', JSON.stringify(authUser));
      onLoginSuccess(authUser);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed. Please try again.');
      } else if (err.code === 'auth/configuration-not-found' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
        setErrorMsg(
          'Firebase Authentication is not yet enabled. In Firebase Console, go to Build > Authentication, click "Get Started", enable Google, and save.'
        );
      } else {
        setErrorMsg(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6">
        {/* School Crest & Title */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <SchoolLogo size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            {schoolName}
          </h1>
          <p className="text-xs font-semibold text-amber-400 mt-1 uppercase tracking-wider">
            Child Observation & Daily Summary
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            12 Classes • 266 Students • Turso Cloud Synchronized
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2.5 py-1">
          <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized Teachers</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-slate-300">
            <School className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Auto Class Scope</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/90 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Google Sign-In Action */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-lg transition-all duration-150 disabled:opacity-60 cursor-pointer active:scale-98"
          >
            {googleLoading ? (
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Connecting to Google...</span>
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
                <span className="text-sm font-bold tracking-wide">Sign in with School Gmail</span>
              </>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-400 leading-relaxed px-2">
            Use your registered Gmail ID. You will be automatically directed to your assigned classroom section.
          </p>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            For login issues or new teacher onboarding, contact{' '}
            <a
              href="mailto:vijaya.pathikonda@gmail.com"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              vijaya.pathikonda@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
