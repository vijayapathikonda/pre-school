import React, { useState } from 'react';
import { Student, Classroom } from '../../types/observation';
import { db, resetToPragathiRoster } from '../../db/schema';
import { ExcelImportModal } from './ExcelImportModal';
import { downloadFile } from '../../db/exportImport';
import * as XLSX from 'xlsx';
import {
  UserPlus,
  Search,
  Trash2,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  School,
  RotateCcw
} from 'lucide-react';

interface StudentListProps {
  students: Student[];
  classrooms: Classroom[];
  selectedClassroomId: string;
  onRefreshRoster: () => void;
  isAdmin: boolean;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  classrooms,
  selectedClassroomId,
  onRefreshRoster,
  isAdmin,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // New student form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassroomId, setNewClassroomId] = useState(
    classrooms.find((c) => c.id === selectedClassroomId)?.id || classrooms[0]?.id || ''
  );
  const [newNotes, setNewNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-indigo-600');
  const [message, setMessage] = useState<string | null>(null);

  const AVATAR_PALETTE = [
    { label: 'Indigo', class: 'bg-indigo-600' },
    { label: 'Emerald', class: 'bg-emerald-600' },
    { label: 'Rose', class: 'bg-rose-600' },
    { label: 'Amber', class: 'bg-amber-600' },
    { label: 'Blue', class: 'bg-blue-600' },
    { label: 'Violet', class: 'bg-violet-600' },
    { label: 'Teal', class: 'bg-teal-600' },
    { label: 'Purple', class: 'bg-purple-600' },
  ];

  const filtered = students.filter((s) => {
    const matchesClass = selectedClassroomId === 'ALL' || s.classroomId === selectedClassroomId;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const classroom = classrooms.find((c) => c.id === newClassroomId) || classrooms[0];
    const newStudent: Student = {
      id: `std_${Date.now()}`,
      name: newStudentName.trim(),
      classroomId: classroom.id,
      classroomName: classroom.name,
      avatarColor: selectedColor,
      notes: newNotes.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await db.students.add(newStudent);
    setShowAddModal(false);
    setNewStudentName('');
    setNewNotes('');
    onRefreshRoster();
    setMessage(`Successfully onboarded ${newStudent.name} into ${classroom.name}!`);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(`Remove student "${name}" from roster?`)) {
      await db.students.delete(id);
      onRefreshRoster();
      setMessage(`Removed ${name} from roster.`);
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const handleResetPragathi = async () => {
    if (confirm('Reset roster back to Pragathi Vidyalaya School official 18 students (Jnana, Satya, Shaurya)?')) {
      await resetToPragathiRoster();
      onRefreshRoster();
      setMessage('Roster reset to official Pragathi Vidyalaya School students.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // 1-Click Download Sample Excel
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      ['Student Name', 'Class Name', 'Notes'],
      ['Charvik', 'Nursery Jnana', 'Enjoys outdoor sand play'],
      ['Gharshith gurram', 'Nursery Satya', 'Loves story circles'],
      ['Haripriya', 'Nursery Shaurya', 'Helpful and friendly with peers'],
      ['Aarav Reddy', 'Nursery Jnana', 'Allergic to peanuts'],
      ['Sahasra siri', 'Nursery Satya', 'Enjoys drawing watercolors']
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    downloadFile(csvOutput, 'student_onboarding_template.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 mb-4 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <School className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold">Student Roster & Onboarding</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Currently managing <span className="font-bold text-white">{students.length} students</span> across{' '}
              {classrooms.length} nursery classrooms.
            </p>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSampleExcel}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
                title="Download Sample Excel/CSV Template"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sample Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import Excel / CSV</span>
              </button>

              <button
                type="button"
                onClick={handleResetPragathi}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Reset to Pragathi Official Roster (18 Students)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Action Controls & Single Student Onboard */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setNewClassroomId(
                classrooms.find((c) => c.id === selectedClassroomId)?.id || classrooms[0]?.id || ''
              );
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Student</span>
          </button>
        )}
      </div>

      {/* Student List Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students found for this view.
            </div>
          ) : (
            filtered.map((student, idx) => (
              <div
                key={student.id}
                className="p-3 sm:p-4 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 w-5 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs ${
                      student.avatarColor || 'bg-slate-700'
                    }`}
                  >
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      <span className="font-semibold text-indigo-700">{student.classroomName}</span>
                      {student.notes ? ` • ${student.notes}` : ''}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleDeleteStudent(student.id, student.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Single Student Onboarding Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Student Onboarding Form</h3>
            <p className="text-xs text-slate-500 mb-4">Enroll an individual child into a classroom</p>

            <form onSubmit={handleAddStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Child Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Charvik"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Classroom / Grade *
                </label>
                <select
                  value={newClassroomId}
                  onChange={(e) => setNewClassroomId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ageGroup})
                    </option>
                  ))}
                </select>
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Avatar Badge Color:
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_PALETTE.map((c) => (
                    <button
                      key={c.class}
                      type="button"
                      onClick={() => setSelectedColor(c.class)}
                      className={`w-7 h-7 rounded-full ${c.class} transition-all ${
                        selectedColor === c.class ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Optional Notes (Parent Info, Medical, Diet)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Loves sensory blocks, allergic to peanuts"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
                >
                  Save & Enroll Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        classrooms={classrooms}
        onImportSuccess={onRefreshRoster}
      />
    </div>
  );
};
