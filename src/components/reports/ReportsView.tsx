import React, { useState, useEffect } from 'react';
import { Student, DailyObservation, Classroom } from '../../types/observation';
import { db } from '../../db/schema';
import { FileText, Download, Share2, Calendar } from 'lucide-react';
import { generateDailyObservationPDF } from './pdfGenerator';
import { shareViaWhatsApp } from '../../utils/whatsappShare';
import { exportObservationsToCSV, downloadFile } from '../../db/exportImport';
import { fetchStudentCloudHistory } from '../../db/supabaseClient';

interface ReportsViewProps {
  students: Student[];
  classrooms?: Classroom[];
  schoolName: string;
  onNotify?: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  schoolName,
  onNotify,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [studentHistory, setStudentHistory] = useState<DailyObservation[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchHistory = async () => {
      setLoading(true);
      // 1. Instantly display local IndexedDB records
      const localRecords = await db.observations
        .where('studentId')
        .equals(selectedStudentId)
        .reverse()
        .sortBy('date');
      setStudentHistory(localRecords);

      // 2. Pull student history from Supabase cloud so records from other devices appear
      try {
        const cloudRecords = await fetchStudentCloudHistory(selectedStudentId);
        if (cloudRecords && cloudRecords.length > 0) {
          for (const obs of cloudRecords) {
            await db.observations.put(obs);
          }
          const updatedRecords = await db.observations
            .where('studentId')
            .equals(selectedStudentId)
            .reverse()
            .sortBy('date');
          setStudentHistory(updatedRecords);
        }
      } catch (err) {
        console.warn('Could not fetch student cloud history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedStudentId]);

  const handleExportAllCSV = async () => {
    try {
      onNotify?.('Exporting History', 'Generating full observation archive CSV...', 'info');
      const csv = await exportObservationsToCSV();
      downloadFile(csv, `Preschool_Full_Observation_Archive_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
      onNotify?.('Export Complete!', 'Downloaded complete historical observation archive CSV.', 'success');
    } catch (err: any) {
      onNotify?.('Export Error', err?.message || 'Could not export CSV archive.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Parent Slips & Historical Records</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review past observation entries, print official PDF slips, or export full school records.
          </p>
        </div>

        <button
          onClick={handleExportAllCSV}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export All History (CSV)</span>
        </button>
      </div>

      {/* Student Selector Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Select Student to View History & Slips:
        </label>
        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="w-full sm:max-w-md text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.classroomName})
            </option>
          ))}
        </select>
      </div>

      {/* History Timeline */}
      {selectedStudent && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  selectedStudent.avatarColor || 'bg-slate-700'
                }`}
              >
                {selectedStudent.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <h3 className="text-xs font-bold text-slate-800">
                Observation History for {selectedStudent.name}
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {studentHistory.length} recorded days
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading history...</div>
            ) : studentHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No observations recorded yet for {selectedStudent.name}. Switch to the Observe tab to record today&apos;s observations.
              </div>
            ) : (
              studentHistory.map((obs) => (
                <div key={obs.id} className="p-4 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{obs.date}</span>
                      </span>
                      {obs.present ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          ✓ Present
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          ✕ Absent
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          onNotify?.('WhatsApp', `Opening WhatsApp slip for ${selectedStudent.name}...`, 'info');
                          shareViaWhatsApp(selectedStudent, obs, schoolName);
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 text-xs font-bold flex items-center space-x-1 border border-emerald-200 transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => {
                          onNotify?.('PDF Slip', `Downloading observation slip for ${selectedStudent.name} (${obs.date})...`, 'info');
                          generateDailyObservationPDF(selectedStudent, obs, schoolName, selectedStudent.classroomName);
                        }}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold flex items-center space-x-1 border border-slate-200 transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">PDF Slip</span>
                      </button>
                    </div>
                  </div>

                  {obs.present && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50/60 p-3 rounded-lg border border-slate-100 mt-2">
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px]">1. Engagement:</span>{' '}
                        <span className="font-medium text-slate-800">{obs.engagement || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px]">2. Participation:</span>{' '}
                        <span className="font-medium text-slate-800">{obs.participation || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px]">3. Following:</span>{' '}
                        <span className="font-medium text-slate-800">{obs.following || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px]">6. Mood/State:</span>{' '}
                        <span className="font-medium text-slate-800">{(obs.state || []).join(', ') || 'Normal'}</span>
                      </div>
                      {obs.interest && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-slate-500 text-[11px]">7. Interest:</span>{' '}
                          <span className="font-medium text-slate-800">
                            {obs.interest} {obs.interestDetail ? `(${obs.interestDetail})` : ''}
                          </span>
                        </div>
                      )}
                      {obs.additionalObservation && (
                        <div className="sm:col-span-2 text-slate-600 italic mt-0.5">
                          &quot;{obs.additionalObservation}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
