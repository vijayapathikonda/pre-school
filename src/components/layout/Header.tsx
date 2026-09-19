import React from 'react';
import { Classroom } from '../../types/observation';
import { Calendar, Cloud, CloudOff, Settings, School, Users } from 'lucide-react';
import { getSupabase } from '../../db/supabaseClient';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  classrooms: Classroom[];
  selectedClassroomId: string;
  onClassroomChange: (id: string) => void;
  onOpenSettings: () => void;
  schoolName: string;
  totalStudents: number;
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
}) => {
  const isCloudActive = !!getSupabase();
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      {/* Top Brand & Sync Bar */}
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
            <School className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              {schoolName || 'Preschool Portal'}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Daily Child Observation (V1)</p>
          </div>
        </div>

        {/* Sync Status & Settings Action */}
        <div className="flex items-center space-x-2">
          {isCloudActive ? (
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[11px] font-medium">
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>Cloud Sync Active</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
              <CloudOff className="w-3 h-3 text-amber-400" />
              <span>Offline Local Storage</span>
            </div>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="School & Cloud Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Classroom & Date Filter Bar */}
      <div className="bg-slate-800/90 backdrop-blur border-t border-slate-700/60 px-4 py-2">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          
          {/* Classroom Selector */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium shrink-0">Class:</span>
            <select
              value={selectedClassroomId}
              onChange={(e) => onClassroomChange(e.target.value)}
              className="bg-slate-900 text-slate-100 text-xs font-semibold rounded-md px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px] sm:max-w-[260px]"
            >
              <option value="ALL">All Classrooms ({totalStudents} students)</option>
              {classrooms.map((c) => (
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
