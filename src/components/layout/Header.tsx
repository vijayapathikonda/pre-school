import React from 'react';
import { Classroom } from '../../types/observation';
import { Calendar, Settings, Users, Shield, UserCheck, LogOut, RefreshCw } from 'lucide-react';
import { getTurso } from '../../db/tursoClient';
import { SchoolLogo } from '../common/SchoolLogo';
import { AuthUser } from '../auth/LoginPage';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  classrooms: Classroom[];
  selectedClassroomId: string;
  onClassroomChange: (id: string) => void;
  onOpenSettings: () => void;
  schoolName: string;
  totalStudents: number;
  currentUser: AuthUser;
  onLogout: () => void;
  isSyncing?: boolean;
  onManualSync?: () => Promise<void>;
  lastSyncTime?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  classrooms,
  selectedClassroomId,
  onClassroomChange,
  onOpenSettings,
  schoolName,
  totalStudents,
  currentUser,
  onLogout,
  isSyncing = false,
  onManualSync,
  lastSyncTime,
}) => {
  const isCloudActive = !!getTurso();
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const currentClass = classrooms.find((c) => c.id === selectedClassroomId);

  // Filter available classrooms for the teacher
  const availableClassrooms =
    currentUser.role === 'admin' || (currentUser.assignedClasses && currentUser.assignedClasses.includes('*'))
      ? classrooms
      : classrooms.filter((c) => currentUser.assignedClasses?.includes(c.id));

  // Dynamic Observation Title based on active classroom
  const dynamicObservationTitle = currentClass
    ? `Daily Child Observation — ${currentClass.name}`
    : `Daily Child Observation — All Classes (${totalStudents} Students)`;

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      {/* Top Brand & User Session Bar */}
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
        
        {/* School Crest Logo & Dynamic Title */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <SchoolLogo size="sm" />
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight truncate">
              {schoolName || 'Pragathi Vidyalaya School'}
            </h1>
            <p className="text-[11px] font-bold text-amber-400 truncate">
              {dynamicObservationTitle}
            </p>
          </div>
        </div>

        {/* User Session Badge & Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* User Role Badge */}
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center space-x-1.5 ${
              currentUser.role === 'admin'
                ? 'bg-amber-950/80 border-amber-700/80 text-amber-300'
                : 'bg-indigo-950/80 border-indigo-700/80 text-indigo-300'
            }`}
          >
            {currentUser.role === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="capitalize">{currentUser.username}</span>
          </div>

          {/* Cloud Sync Button & Status */}
          {onManualSync && (
            <button
              onClick={() => onManualSync()}
              disabled={isSyncing}
              title={
                isSyncing
                  ? 'Syncing with Turso Database...'
                  : isCloudActive
                  ? `Turso Cloud Connected${lastSyncTime ? ` (Last sync: ${lastSyncTime})` : ''}. Tap to sync latest observations.`
                  : 'Running in offline mode. Tap to retry connection.'
              }
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                isSyncing
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300 cursor-wait'
                  : isCloudActive
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700/80 text-emerald-300 active:scale-95 cursor-pointer'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isSyncing
                    ? 'animate-spin text-amber-400'
                    : isCloudActive
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isSyncing ? 'Syncing...' : isCloudActive ? 'Sync Now' : 'Offline'}
              </span>
            </button>
          )}

          {/* Settings icon (Admin only or all) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="School & Cloud Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 px-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-rose-200 border border-rose-800/80 text-xs font-bold flex items-center space-x-1.5 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Classroom Switcher & Date Filter Bar */}
      <div className="bg-slate-800/90 backdrop-blur border-t border-slate-700/60 px-4 py-2">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          
          {/* Classroom Selector */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">Class:</span>
            <select
              value={selectedClassroomId}
              onChange={(e) => onClassroomChange(e.target.value)}
              className="bg-slate-900 text-amber-300 font-bold text-xs rounded-md px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[210px] sm:max-w-[280px]"
            >
              {currentUser.role === 'admin' && (
                <option value="ALL">All Classes ({totalStudents} students)</option>
              )}
              {availableClassrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center space-x-2 justify-between sm:justify-end">
            <div className="flex items-center space-x-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-600">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none"
              />
            </div>

            {!isToday && (
              <button
                onClick={() => onDateChange(todayStr)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline px-1"
              >
                Jump to Today
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
