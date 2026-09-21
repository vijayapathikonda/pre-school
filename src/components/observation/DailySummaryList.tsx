import React, { useState, useMemo } from 'react';
import { Student, DailyObservation } from '../../types/observation';
import {
  Check,
  UserX,
  Clock,
  Download,
  FileSpreadsheet,
  Share2,
  Search,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { exportObservationsToCSV, downloadFile } from '../../db/exportImport';
import { generateDailyObservationPDF } from '../reports/pdfGenerator';
import { shareViaWhatsApp } from '../../utils/whatsappShare';

interface DailySummaryListProps {
  students: Student[];
  observationsMap: Map<string, DailyObservation>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSelectStudent: (studentId: string) => void;
  schoolName: string;
  onNotify?: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const DailySummaryList: React.FC<DailySummaryListProps> = ({
  students,
  observationsMap,
  selectedDate,
  onDateChange,
  onSelectStudent,
  schoolName,
  onNotify,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'absent'>('all');
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const handlePrevDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() - 1);
    onDateChange(current.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + 1);
    onDateChange(current.toISOString().split('T')[0]);
  };

  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const completedStudents = students.filter((s) => {
    const obs = observationsMap.get(s.id);
    return obs && obs.present && !!obs.engagement;
  });

  const absentStudents = students.filter((s) => {
    const obs = observationsMap.get(s.id);
    return obs && !obs.present;
  });

  const pendingStudents = students.filter((s) => {
    const obs = observationsMap.get(s.id);
    return !obs || (obs.present && !obs.engagement);
  });

  const filteredStudents = students.filter((s) => {
    const obs = observationsMap.get(s.id);
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'completed') return obs && obs.present && !!obs.engagement;
    if (filter === 'absent') return obs && !obs.present;
    if (filter === 'pending') return !obs || (obs.present && !obs.engagement);
    return true;
  });

  const handleExportCSV = async () => {
    try {
      onNotify?.('Exporting CSV', `Generating daily summary report for ${selectedDate}...`, 'info');
      const csvData = await exportObservationsToCSV(selectedDate);
      downloadFile(csvData, `Observations_${selectedDate}.csv`, 'text/csv;charset=utf-8;');
      onNotify?.('Export Complete!', `Downloaded Observations_${selectedDate}.csv successfully.`, 'success');
    } catch (err: any) {
      onNotify?.('Export Error', err?.message || 'Could not export CSV.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Calendar Date Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Daily Observation Summary</h2>
              {isToday ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Today
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                  Past Date
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Showing records for <span className="font-bold text-indigo-950">{formattedDate}</span>
            </p>
          </div>

          {/* Calendar Picker & Controls */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isToday && (
              <button
                onClick={() => onDateChange(todayStr)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div
          onClick={() => setFilter('all')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Total Roster</p>
          <p className="text-2xl font-bold mt-0.5">{students.length}</p>
        </div>

        <div
          onClick={() => setFilter('completed')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'completed'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Completed</p>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-0.5 text-emerald-600">{completedStudents.length}</p>
        </div>

        <div
          onClick={() => setFilter('pending')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Pending</p>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-0.5 text-amber-600">{pendingStudents.length}</p>
        </div>

        <div
          onClick={() => setFilter('absent')}
          className={`p-3 rounded-xl border cursor-pointer transition-all ${
            filter === 'absent'
              ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
              : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Absent</p>
            <UserX className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-0.5 text-rose-600">{absentStudents.length}</p>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student in summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 border border-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredStudents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students found for current filter.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const obs = observationsMap.get(student.id);
              const isCompleted = obs && obs.present && !!obs.engagement;
              const isAbsent = obs && !obs.present;

              return (
                <div
                  key={student.id}
                  className="p-3 sm:p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  {/* Left: Avatar & Info */}
                  <div
                    onClick={() => onSelectStudent(student.id)}
                    className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                        student.avatarColor || 'bg-slate-600'
                      }`}
                    >
                      {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{student.name}</p>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Done
                          </span>
                        )}
                        {isAbsent && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            ✕ Absent
                          </span>
                        )}
                        {!isCompleted && !isAbsent && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Snippet */}
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {isCompleted
                          ? `${obs?.engagement || ''} • ${obs?.participation || ''} • Mood: ${(obs?.state || []).join(', ') || 'Normal'}`
                          : isAbsent
                          ? 'Marked absent for the day'
                          : 'Observation not yet filled'}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {isCompleted && obs && (
                      <>
                        <button
                          onClick={() => shareViaWhatsApp(student, obs, schoolName)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateDailyObservationPDF(student, obs, schoolName, student.classroomName)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => onSelectStudent(student.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1"
                    >
                      <span>{isCompleted ? 'Edit' : 'Observe'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
