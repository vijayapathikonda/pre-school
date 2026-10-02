import React, { useState, useRef, useEffect } from 'react';
import { Student, DailyObservation } from '../../types/observation';
import { Check, UserX, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeStudentRef = useRef<HTMLButtonElement>(null);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const completedCount = students.filter((s) => {
    const obs = observationsMap.get(s.id);
    return obs && (obs.present ? !!obs.engagement : true);
  }).length;

  const percentComplete = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;

  // Automatically scroll the carousel to keep the active student centered in view
  useEffect(() => {
    if (activeStudentRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeStudentRef.current;

      const elementOffsetLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;
      const containerWidth = container.clientWidth;

      const targetScroll = elementOffsetLeft - (containerWidth / 2) + (elementWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeStudentId]);

  const handleManualScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

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

      {/* Horizontal Scrollable Carousel with Arrow Controls */}
      <div className="relative flex items-center px-1 sm:px-2 py-1.5 bg-slate-50/30">
        {/* Left Scroll Arrow */}
        <button
          type="button"
          onClick={() => handleManualScroll('left')}
          className="p-1 sm:p-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-xs shrink-0 transition-all active:scale-95 z-10 mr-1"
          title="Scroll Left"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="px-1 py-1.5 overflow-x-auto no-scrollbar flex items-center space-x-2 scroll-smooth w-full"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
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
                  ref={isSelected ? activeStudentRef : null}
                  onClick={() => onSelectStudent(student.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg shrink-0 transition-all border text-left ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-indigo-500/30 scale-102'
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

        {/* Right Scroll Arrow */}
        <button
          type="button"
          onClick={() => handleManualScroll('right')}
          className="p-1 sm:p-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shadow-xs shrink-0 transition-all active:scale-95 z-10 ml-1"
          title="Scroll Right"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
};
