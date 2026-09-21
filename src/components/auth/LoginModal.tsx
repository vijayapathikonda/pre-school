import React, { useState } from 'react';
import { Classroom } from '../../types/observation';
import { School, UserCheck, Shield, ChevronRight, Lock, AlertCircle } from 'lucide-react';

export type UserRole = 'teacher' | 'admin';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  currentRole: UserRole;
  currentClassroomId: string;
  onLoginTeacher: (classroomId: string) => void;
  onLoginAdmin: () => void;
  schoolName: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  classrooms,
  currentRole,
  currentClassroomId,
  onLoginTeacher,
  onLoginAdmin,
  schoolName,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole || 'teacher');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    currentClassroomId !== 'ALL' ? currentClassroomId : classrooms[0]?.id || ''
  );
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!isOpen) return null;

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    onLoginTeacher(selectedClassId);
    onClose();
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('admin_pin') || '1234';
    if (adminPin === storedPin || adminPin === '1234') {
      setPinError(false);
      onLoginAdmin();
      onClose();
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden my-6">
        
        {/* School Banner Header */}
        <div className="bg-slate-900 text-white p-5 text-center border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-2 shadow-sm">
            <School className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">{schoolName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Daily Child Observation & Activity Portal</p>

          {/* Role Tabs */}
          <div className="mt-4 grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('teacher');
                setPinError(false);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                selectedRole === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Teacher Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setPinError(false);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Login</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5">
          {selectedRole === 'teacher' ? (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Select Your Classroom / Grade:
                </label>
                <div className="space-y-2">
                  {classrooms.map((c) => {
                    const isSelected = selectedClassId === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClassId(c.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-2xs ring-1 ring-indigo-600'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{c.name}</p>
                          <p className="text-[11px] text-slate-500">{c.ageGroup}</p>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedClassId}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <span>Enter Classroom Observations</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Enter Admin Security PIN:
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Default PIN is <code className="font-mono font-bold text-indigo-600">1234</code>
                </p>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    maxLength={8}
                    placeholder="Enter PIN (1234)"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError(false);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                {pinError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Incorrect PIN. Default is 1234.</span>
                  </p>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Admin Privileges:</p>
                <p>• Student onboarding form & Excel/CSV bulk import</p>
                <p>• Full roster view across all nursery grades</p>
                <p>• Supabase cloud sync & database backups</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Unlock Admin Portal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
