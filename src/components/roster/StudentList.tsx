import React, { useState } from 'react';
import { Student, Classroom } from '../../types/observation';
import { db, loadFullSchoolRoster, resetToSampleRoster } from '../../db/schema';
import { UserPlus, Users, Search, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  classrooms: Classroom[];
  selectedClassroomId: string;
  onRefreshRoster: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  classrooms,
  selectedClassroomId,
  onRefreshRoster,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassroomId, setNewClassroomId] = useState(classrooms[0]?.id || '');
  const [newNotes, setNewNotes] = useState('');
  const [loading250, setLoading250] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      avatarColor: 'bg-indigo-600',
      notes: newNotes.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };

    await db.students.add(newStudent);
    setShowAddModal(false);
    setNewStudentName('');
    setNewNotes('');
    onRefreshRoster();
    setMessage(`Added ${newStudent.name}`);
    setTimeout(() => setMessage(null), 2500);
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(`Remove student "${name}" from roster?`)) {
      await db.students.delete(id);
      onRefreshRoster();
    }
  };

  const handleLoad250 = async () => {
    if (confirm('Load 250 sample students across all preschool classrooms to test large-scale capacity?')) {
      setLoading250(true);
      const count = await loadFullSchoolRoster();
      setLoading250(false);
      onRefreshRoster();
      setMessage(`Successfully loaded ${count} students!`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleResetSample = async () => {
    if (confirm('Reset roster back to the standard sample students?')) {
      await resetToSampleRoster();
      onRefreshRoster();
      setMessage('Reset to standard sample roster.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Header Banner & 250 Capacity Tester */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 mb-4 shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold">Student Roster Management</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Currently managing <span className="font-bold text-white">{students.length} students</span> across{' '}
              {classrooms.length} preschool classrooms.
            </p>
          </div>

          {/* Quick 250 student load / reset buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLoad250}
              disabled={loading250}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors"
              title="Test with 250 students"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading250 ? 'Loading...' : '⚡ Test 250 Students'}</span>
            </button>

            {students.length > 20 && (
              <button
                onClick={handleResetSample}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{message}</span>
          </div>
        )}
      </div>

      {/* Action Controls */}
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

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Child</span>
        </button>
      </div>

      {/* Student List Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students found. Add your first student or click &quot;Test 250 Students&quot;.
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
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      student.avatarColor || 'bg-slate-700'
                    }`}
                  >
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{student.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {student.classroomName} {student.notes ? `• ${student.notes}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => handleDeleteStudent(student.id, student.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Student"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Enroll New Student</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Child Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leo Alexander"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classroom / Section
                </label>
                <select
                  value={newClassroomId}
                  onChange={(e) => setNewClassroomId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ageGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Allergic to peanuts, loves puzzle blocks"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
