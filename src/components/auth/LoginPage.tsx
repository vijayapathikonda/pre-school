import React, { useState } from 'react';
import { SchoolLogo } from '../common/SchoolLogo';
import { User, Lock, ArrowRight, Shield, UserCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserRole } from './LoginModal';

export interface AuthUser {
  username: string;
  role: UserRole;
}

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  schoolName?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  schoolName = 'Pragathi Vidyalaya School',
}) => {
  const [role, setRole] = useState<UserRole>('teacher');
  const [username, setUsername] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg('Please enter your username.');
      return;
    }

    if (!pin.trim()) {
      setErrorMsg('Please enter your security PIN.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (role === 'admin') {
        const storedAdminPin = localStorage.getItem('admin_pin') || '1234';
        if (pin !== storedAdminPin && pin !== '1234') {
          setErrorMsg('Invalid Admin PIN. (Default is 1234)');
          setLoading(false);
          return;
        }
      } else {
        // Teacher login: accepts default PIN 1234
        if (pin !== '1234') {
          setErrorMsg('Invalid Teacher PIN. (Default is 1234)');
          setLoading(false);
          return;
        }
      }

      const authUser: AuthUser = {
        username: cleanUsername,
        role,
      };

      localStorage.setItem('pragathi_auth_user', JSON.stringify(authUser));
      setLoading(false);
      onLoginSuccess(authUser);
    }, 300);
  };

  const handleQuickFill = (targetRole: UserRole) => {
    setRole(targetRole);
    setUsername(targetRole === 'admin' ? 'admin' : 'teacher');
    setPin('1234');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10">
        
        {/* School Crest & Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <SchoolLogo size="lg" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            {schoolName}
          </h1>
          <p className="text-xs font-semibold text-amber-400 mt-1 uppercase tracking-wider">
            Daily Child Observation Portal
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Nursery Jnana • Nursery Satya • Nursery Shaurya
          </p>
        </div>

        {/* Role Selection Toggle */}
        <div className="mb-5 grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              role === 'teacher'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Teacher Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              role === 'admin'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              {role === 'admin' ? 'Admin Username' : 'Teacher Username'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                required
                placeholder={role === 'admin' ? 'e.g. admin' : 'e.g. teacher_sarah'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                autoFocus
              />
            </div>
          </div>

          {/* Security PIN Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Security PIN
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Default: 1234</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                required
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl text-white text-xs font-bold shadow-lg flex items-center justify-center space-x-2 transition-all ${
              role === 'admin'
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <span>{loading ? 'Authenticating...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Teacher'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-center space-x-3 text-[11px] text-slate-400">
          <span>Quick fill:</span>
          <button
            type="button"
            onClick={() => handleQuickFill('teacher')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
          >
            Teacher (1234)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleQuickFill('admin')}
            className="text-amber-400 hover:text-amber-300 font-semibold underline"
          >
            Admin (1234)
          </button>
        </div>
      </div>
    </div>
  );
};
