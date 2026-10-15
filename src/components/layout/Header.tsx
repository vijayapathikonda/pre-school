import React, { useState, useRef, useEffect } from 'react';
import { Classroom, TeacherDelegation, SchoolHoliday } from '../../types/observation';
import { Calendar, Settings, Users, Shield, UserCheck, LogOut, RefreshCw, CalendarCheck, CalendarOff, BookOpen, ChevronDown } from 'lucide-react';
import { getTurso } from '../../db/tursoClient';
import { SchoolLogo } from '../common/SchoolLogo';
import { AuthUser } from '../auth/LoginPage';
import { generateUserManualPDF } from '../reports/pdfGenerator';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  classrooms: Classroom[];
  selectedClassroomId: string;
  onClassroomChange: (id: string) => void;
  onOpenSettings: () => void;
  onOpenSubstitutes?: () => void;
  onOpenHolidays?: () => void;
  schoolName: string;
  totalStudents: number;
  currentUser: AuthUser;
  onLogout: () => void;
  isSyncing?: boolean;
  onManualSync?: () => Promise<void>;
  lastSyncTime?: string | null;
  activeDelegations?: TeacherDelegation[];
  effectiveAssignedClasses?: string[];
  activeHoliday?: SchoolHoliday;
  isSunday?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onDateChange,
  classrooms,
  selectedClassroomId,
  onClassroomChange,
  onOpenSettings,
  onOpenSubstitutes,
  onOpenHolidays,
  schoolName,
  totalStudents,
  currentUser,
  onLogout,
  isSyncing = false,
  onManualSync,
  lastSyncTime,
  activeDelegations = [],
  effectiveAssignedClasses,
  activeHoliday,
  isSunday = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const isCloudActive = !!getTurso();
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const currentClass = classrooms.find((c) => c.id === selectedClassroomId);

  // Filter available classrooms for the teacher (including temporary substitute delegations!)
  const effectiveClasses = effectiveAssignedClasses || currentUser.assignedClasses || [];
  const availableClassrooms =
    currentUser.role === 'admin' || effectiveClasses.includes('*')
      ? classrooms
      : classrooms.filter((c) => effectiveClasses.includes(c.id));

  // Dynamic Observation Title based on active classroom
  const dynamicObservationTitle = currentClass
    ? `Daily Child Observation — ${currentClass.name}`
    : `Daily Child Observation — All Classes (${totalStudents} Students)`;

  const shortUsername = currentUser.username.split(' ')[0] || currentUser.username;

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      {/* Top Brand & User Session Bar */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
        
        {/* School Crest Logo & Dynamic Title */}
        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
          <SchoolLogo size="sm" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white leading-tight truncate">
              {schoolName || 'Pragathi Vidyalaya School'}
            </h1>
            <p className="text-[11px] font-bold text-amber-400 truncate">
              {dynamicObservationTitle}
            </p>
          </div>
        </div>

        {/* Cloud Sync + Options Dropdown Menu */}
        <div className="flex items-center space-x-2 shrink-0">
          
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
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
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

          {/* User & Quick Actions Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                currentUser.role === 'admin'
                  ? 'bg-amber-950/80 hover:bg-amber-900/80 border-amber-700/80 text-amber-300'
                  : 'bg-indigo-950/80 hover:bg-indigo-900/80 border-indigo-700/80 text-indigo-300'
              }`}
              title="Open Menu (Substitutes, Holidays, User Guide, Settings & Logout)"
            >
              {currentUser.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              )}
              <span className="capitalize sm:hidden max-w-[85px] truncate">{shortUsername}</span>
              <span className="capitalize hidden sm:inline">{currentUser.username}</span>
              {activeDelegations.length > 0 && currentUser.role === 'admin' && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0">
                  {activeDelegations.length}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 shrink-0 ${
                  isMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Panel */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-50 divide-y divide-slate-800">
                {/* Signed-in User Info */}
                <div className="px-3.5 py-2.5 bg-slate-950/60">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-extrabold text-white capitalize truncate">
                      {currentUser.username}
                    </p>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${
                        currentUser.role === 'admin'
                          ? 'bg-amber-950/90 border-amber-700 text-amber-300'
                          : 'bg-indigo-950/90 border-indigo-700 text-indigo-300'
                      }`}
                    >
                      {currentUser.role === 'admin' ? 'Admin' : 'Teacher'}
                    </span>
                  </div>
                  {currentUser.email && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {currentUser.email}
                    </p>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {/* Daily Substitutes (Admin only) */}
                  {currentUser.role === 'admin' && onOpenSubstitutes && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSubstitutes();
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-800/70 text-amber-400">
                          <CalendarCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-100">Daily Substitutes</p>
                          <p className="text-[10px] text-slate-400">Assign temporary class cover</p>
                        </div>
                      </div>
                      {activeDelegations.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                          {activeDelegations.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Holidays & Closures (Admin only) */}
                  {currentUser.role === 'admin' && onOpenHolidays && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenHolidays();
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800 flex items-center space-x-2.5 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800/70 text-rose-400">
                        <CalendarOff className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100">Holidays & Closures</p>
                        <p className="text-[10px] text-slate-400">Manage non-working days</p>
                      </div>
                    </button>
                  )}

                  {/* User Guide PDF (All Users) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      generateUserManualPDF(schoolName);
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800 flex items-center space-x-2.5 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/70 text-indigo-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">User Guide (PDF)</p>
                      <p className="text-[10px] text-slate-400">Download operations manual</p>
                    </div>
                  </button>

                  {/* School & Cloud Settings (Admin only) */}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800 flex items-center space-x-2.5 transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100">School & Cloud Settings</p>
                        <p className="text-[10px] text-slate-400">Database, backup & school info</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Logout */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-rose-950/60 flex items-center space-x-2.5 text-rose-400 transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-800/70 text-rose-400">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-300">Log Out</p>
                      <p className="text-[10px] text-rose-400/80">Sign out of your account</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Classroom Switcher & Date Filter Bar */}
      <div className="bg-slate-800/90 backdrop-blur border-t border-slate-700/60 px-4 py-2">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          
          {/* Classroom Selector */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">Class:</span>
            {availableClassrooms.length <= 1 ? (
              <span className="bg-slate-900 text-amber-300 font-extrabold text-xs rounded-md px-3 py-1.5 border border-slate-700 tracking-wide shadow-xs">
                {availableClassrooms[0]?.name || currentClass?.name || 'Assigned Class'}
              </span>
            ) : (
              <select
                value={selectedClassroomId}
                onChange={(e) => onClassroomChange(e.target.value)}
                className="bg-slate-900 text-amber-300 font-bold text-xs rounded-md px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[210px] sm:max-w-[280px]"
              >
                {currentUser.role === 'admin' && (
                  <option value="ALL">All Classes ({totalStudents} students)</option>
                )}
                {availableClassrooms.map((c) => {
                  const isDelegated = activeDelegations.some(
                    (d) =>
                      d.classroom_id === c.id &&
                      d.substitute_teacher_email.toLowerCase() === currentUser.email?.toLowerCase()
                  );
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {isDelegated ? '⚡ (Covering Today)' : ''}
                    </option>
                  );
                })}
              </select>
            )}
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

      {/* Non-Working Day / School Holiday Notification Banner */}
      {(activeHoliday || isSunday) && (
        <div
          className={`px-4 py-2 border-t text-xs font-medium flex items-center justify-between ${
            activeHoliday
              ? 'bg-rose-950/95 border-rose-800 text-rose-200'
              : 'bg-amber-950/95 border-amber-800 text-amber-200'
          }`}
        >
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <CalendarOff
                className={`w-4 h-4 shrink-0 ${
                  activeHoliday ? 'text-rose-400' : 'text-amber-400'
                }`}
              />
              <span className="truncate">
                {activeHoliday ? (
                  <>
                    <strong className="text-white">School Holiday / Non-Working Day:</strong>{' '}
                    <span className="underline font-bold text-rose-300">{activeHoliday.name}</span>{' '}
                    <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-rose-900 border border-rose-700 text-rose-200">
                      {activeHoliday.category}
                    </span>
                    {activeHoliday.endDate && activeHoliday.endDate > activeHoliday.date && (
                      <span className="text-[11px] font-bold text-amber-300 ml-1.5 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                        📅 {activeHoliday.date} to {activeHoliday.endDate}
                      </span>
                    )}
                    {activeHoliday.description && (
                      <span className="hidden sm:inline text-slate-300 ml-1.5 italic">
                        — {activeHoliday.description}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <strong className="text-white">Sunday (Weekend):</strong> School is closed today.
                    Daily observations are not required.
                  </>
                )}
              </span>
            </div>

            {currentUser.role === 'admin' && onOpenHolidays && (
              <button
                type="button"
                onClick={onOpenHolidays}
                className="text-[11px] font-bold underline shrink-0 hover:text-white transition-colors"
              >
                {activeHoliday ? 'Edit Holiday' : 'Holiday Settings'}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
