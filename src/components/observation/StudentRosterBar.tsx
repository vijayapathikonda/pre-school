import React, { useState } from 'react';
import { Student, DailyObservation } from '../../types/observation';
import { Check, UserX, Search } from 'lucide-react';

interface StudentRosterBarProps {
  students: Student[];
  observationsMap: Map<string, DailyObservation>;
  activeStudentId: string;
  onSelectStudent: (id: string) => void;
}

export const StudentRosterBar: React.FC<StudentRosterBarProps> = ({
  students,
  observationsMap,
  activeStudentId,
  onSelectStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = students.filter((s) => {
    const obs = observationsMap.get(s.id);
    return obs && (obs.present ? !!obs.engagement : true);
  }).length;

  const percentComplete = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      {/* Progress & Quick Search */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700">Roster Progress:</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
            {completedCount} / {students.length}
          </span>
          <div className="w-16 sm:w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            {percentComplete}%
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative w-36 sm:w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search child..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div className="px-3 py-2.5 overflow-x-auto no-scrollbar flex items-center space-x-2">
        {filteredStudents.length === 0 ? (
          <div className="text-xs text-slate-400 py-1 px-2">No students match &quot;{searchQuery}&quot;</div>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = student.id === activeStudentId;
            const obs = observationsMap.get(student.id);
            const isCompleted = obs && obs.present && !!obs.engagement;
            const isAbsent = obs && !obs.present;

            // Student initials
            const initials = student.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <button
                key={student.id}
                onClick={() => onSelectStudent(student.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg shrink-0 transition-all border text-left ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-indigo-500/20'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Avatar with Status Badge */}
                <div className="relative">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs ${
                      student.avatarColor || 'bg-slate-600'
                    }`}
                  >
                    {initials}
                  </div>
                  {/* Status Indicator */}
                  {isCompleted ? (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-2 ring-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  ) : isAbsent ? (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center ring-2 ring-white">
                      <UserX className="w-2 h-2 text-white" />
                    </span>
                  ) : (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-2 ring-white" />
                  )}
                </div>

                {/* Name */}
                <div className="max-w-[105px] truncate">
                  <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {student.name}
                  </p>
                  <p className={`text-[10px] leading-tight truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {isCompleted ? 'Completed' : isAbsent ? 'Absent' : 'Pending'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
