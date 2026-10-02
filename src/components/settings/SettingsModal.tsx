import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Cloud,
  Database,
  Download,
  Upload,
  Building2,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Shield,
} from 'lucide-react';
import {
  getTursoCredentials,
  saveTursoCredentials,
  getTurso,
  testTursoConnection,
  syncRosterToCloud,
  fetchAllStaff,
  saveStaffToCloud,
  deleteStaffFromCloud,
  StaffRecord,
} from '../../db/tursoClient';
import { db } from '../../db/schema';
import { exportAllDataAsJSON, importDataFromJSON, downloadFile } from '../../db/exportImport';
import { Classroom } from '../../types/observation';
import { REAL_CLASSROOMS } from '../../db/sampleData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  onUpdateSchoolName: (name: string) => void;
  onDataImported: () => void;
  classrooms?: Classroom[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  onUpdateSchoolName,
  onDataImported,
  classrooms = [],
}) => {
  const creds = getTursoCredentials();
  const [activeTab, setActiveTab] = useState<'cloud' | 'staff'>('cloud');
  const [tursoUrl, setTursoUrl] = useState(creds.url);
  const [tursoToken, setTursoToken] = useState(creds.token);
  const [currentSchoolName, setCurrentSchoolName] = useState(schoolName);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);

  // Staff Management State
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<'Teacher' | 'Admin'>('Teacher');
  const [formAssignedClasses, setFormAssignedClasses] = useState<string[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [staffMessage, setStaffMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const availableClassrooms = classrooms.length > 0 ? classrooms : REAL_CLASSROOMS;

  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      const records = await fetchAllStaff();
      setStaffList(records);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  // Filtered staff records (must be called unconditionally before early return)
  const filteredStaff = useMemo(() => {
    if (!staffSearchQuery.trim()) return staffList;
    const q = staffSearchQuery.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.assigned_classes.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q)
    );
  }, [staffList, staffSearchQuery]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!tursoUrl.trim() || !tursoToken.trim()) {
      setSyncStatusMsg('⚠️ Please enter both Turso Database URL and Auth Token.');
      return;
    }
    setIsTesting(true);
    setSyncStatusMsg('Testing connection to Turso SQLite database...');
    saveTursoCredentials(tursoUrl, tursoToken);
    const res = await testTursoConnection(tursoUrl, tursoToken);
    setIsTesting(false);
    if (res.success) {
      setSyncStatusMsg(`🎉 ${res.message}`);
    } else {
      setSyncStatusMsg(`⚠️ ${res.message}`);
    }
  };

  const handleSyncRoster = async () => {
    if (!tursoUrl.trim() || !tursoToken.trim()) {
      setSyncStatusMsg('⚠️ Please enter both Turso Database URL and Auth Token first.');
      return;
    }
    saveTursoCredentials(tursoUrl, tursoToken);
    setIsSyncingRoster(true);
    setSyncStatusMsg('Syncing students and classrooms to Turso...');
    const localClassrooms = await db.classrooms.toArray();
    const students = await db.students.toArray();
    const result = await syncRosterToCloud(localClassrooms, students);
    setIsSyncingRoster(false);
    if (result.success) {
      setSyncStatusMsg(`🎉 Successfully synced ${result.count} students and ${localClassrooms.length} classrooms to Turso!`);
    } else {
      setSyncStatusMsg(`⚠️ Roster sync error: ${result.error}`);
    }
  };

  const handleSaveSettings = () => {
    saveTursoCredentials(tursoUrl, tursoToken);
    onUpdateSchoolName(currentSchoolName);

    const client = getTurso();
    if (tursoUrl && tursoToken && client) {
      setSyncStatusMsg('✅ Cloud settings saved. Turso client initialized!');
    } else {
      setSyncStatusMsg('✅ Settings saved in offline-first mode.');
    }
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleDownloadBackup = async () => {
    const json = await exportAllDataAsJSON();
    downloadFile(
      json,
      `Preschool_Backup_${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importDataFromJSON(text);
      onDataImported();
      alert(`Backup successfully restored: ${result.studentsCount} students, ${result.obsCount} observations.`);
    } catch (err: any) {
      alert(`Error restoring backup: ${err?.message || 'Invalid format'}`);
    }
  };

  // Staff Handlers
  const handleToggleClass = (className: string) => {
    setFormAssignedClasses((prev) =>
      prev.includes(className) ? prev.filter((c) => c !== className) : [...prev, className]
    );
  };

  const handleSelectAllClasses = () => {
    setFormAssignedClasses(availableClassrooms.map((c) => c.name));
  };

  const handleClearAllClasses = () => {
    setFormAssignedClasses([]);
  };

  const handleStartAdd = () => {
    setEditingStaffId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('Teacher');
    setFormAssignedClasses([]);
    setStaffMessage(null);
    setShowAddForm(true);
  };

  const handleStartEdit = (staff: StaffRecord) => {
    setEditingStaffId(staff.id);
    setFormName(staff.name);
    setFormEmail(staff.email);
    setFormRole(staff.role);
    setStaffMessage(null);

    if (staff.role === 'Admin') {
      setFormAssignedClasses([]);
    } else {
      const parts = staff.assigned_classes.split(',').map((p) => p.trim());
      setFormAssignedClasses(parts);
    }
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingStaffId(null);
    setStaffMessage(null);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      setStaffMessage({ text: 'Please fill in both name and Gmail address.', type: 'error' });
      return;
    }

    if (!formEmail.includes('@') || !formEmail.includes('.')) {
      setStaffMessage({ text: 'Please enter a valid email address.', type: 'error' });
      return;
    }

    let assignedStr = 'All Classes (*)';
    if (formRole === 'Teacher') {
      if (formAssignedClasses.length === 0) {
        setStaffMessage({ text: 'Please select at least one assigned class for the teacher.', type: 'error' });
        return;
      }
      assignedStr = formAssignedClasses.join(', ');
    }

    setFormSubmitting(true);
    setStaffMessage(null);

    const result = await saveStaffToCloud({
      id: editingStaffId || undefined,
      name: formName.trim(),
      email: formEmail.trim().toLowerCase(),
      role: formRole,
      assigned_classes: assignedStr,
    });

    setFormSubmitting(false);

    if (result.success) {
      setStaffMessage({
        text: `Successfully ${editingStaffId ? 'updated' : 'added'} ${formName}! They can now sign in with Google immediately.`,
        type: 'success',
      });
      setFormName('');
      setFormEmail('');
      setFormRole('Teacher');
      setFormAssignedClasses([]);
      setEditingStaffId(null);
      setShowAddForm(false);
      await loadStaff();
    } else {
      setStaffMessage({ text: `Failed to save: ${result.error}`, type: 'error' });
    }
  };

  const handleDeleteStaff = async (staff: StaffRecord) => {
    if (
      !confirm(
        `Are you sure you want to remove ${staff.name} (${staff.email}) from the staff directory? They will no longer be able to log in.`
      )
    ) {
      return;
    }

    const res = await deleteStaffFromCloud(staff.id);
    if (res.success) {
      setStaffMessage({ text: `Removed ${staff.name} from staff directory.`, type: 'success' });
      await loadStaff();
    } else {
      setStaffMessage({ text: `Failed to delete: ${res.error}`, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">School & Cloud Database Settings</h3>
              <p className="text-[11px] text-slate-400">Turso LibSQL Edge Database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'cloud'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Cloud & Database</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'staff'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Teachers</span>
            {staffList.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                {staffList.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: CLOUD & DATABASE */}
          {activeTab === 'cloud' && (
            <div className="space-y-5">
              {/* School Name */}
              <section>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Preschool / Institution Name:
                </label>
                <input
                  type="text"
                  value={currentSchoolName}
                  onChange={(e) => setCurrentSchoolName(e.target.value)}
                  placeholder="e.g. Pragathi Vidyalaya School"
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                />
              </section>

              {/* Cloud Database (Turso Free Tier) */}
              <section className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900">Turso Cloud Database (LibSQL)</h4>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    9 GB Free Storage
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                  Connected to your Turso edge SQLite database. High-speed multi-device synchronization with 1 billion reads/month at $0/month.
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Turso Database URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-db.turso.io"
                      value={tursoUrl}
                      onChange={(e) => setTursoUrl(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Turso Auth Token
                    </label>
                    <input
                      type="password"
                      placeholder="eyJh..."
                      value={tursoToken}
                      onChange={(e) => setTursoToken(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs disabled:opacity-50"
                    >
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{isTesting ? 'Testing...' : '⚡ Test Connection Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncRoster}
                      disabled={isSyncingRoster}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs disabled:opacity-50 border border-slate-700"
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isSyncingRoster ? 'Syncing...' : '👥 Push Roster to Turso'}</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Backup & Restore */}
              <section className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-4 h-4 text-slate-700" />
                  <h4 className="text-xs font-bold text-slate-900">Data Safety, Backup & Restore</h4>
                </div>
                <p className="text-[11px] text-slate-600 mb-3">
                  Export all student rosters and observation history to a local backup file, or restore from a previous file.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 shadow-2xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download Full Backup (JSON)</span>
                  </button>

                  <label className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300 shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Restore Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </section>

              {syncStatusMsg && (
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-medium">
                  {syncStatusMsg}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STAFF & TEACHERS MANAGEMENT */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or class..."
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {!showAddForm && (
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Add New Teacher</span>
                  </button>
                )}
              </div>

              {/* Status Message */}
              {staffMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                    staffMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  {staffMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{staffMessage.text}</span>
                </div>
              )}

              {/* Add / Edit Staff Form */}
              {showAddForm && (
                <form
                  onSubmit={handleSaveStaff}
                  className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-4 space-y-3.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-indigo-700" />
                      <h4 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
                        {editingStaffId ? 'Edit Staff Member' : 'Add New Staff / Teacher'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Teacher / Staff Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pooja Sharma"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Google Gmail Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. pooja.pragathi@gmail.com"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Role
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as 'Teacher' | 'Admin')}
                        className="w-full text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Teacher">Teacher</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      {formRole === 'Admin' ? (
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Admins have full access to all 12 classes & Settings.</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-600">
                          Select the specific classroom(s) this teacher is authorized to access:
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Classroom Checkboxes for Teachers */}
                  {formRole === 'Teacher' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800">
                          Assigned Classrooms ({formAssignedClasses.length} selected):
                        </label>
                        <div className="space-x-2 text-[10px]">
                          <button
                            type="button"
                            onClick={handleSelectAllClasses}
                            className="text-indigo-600 hover:underline font-semibold"
                          >
                            Select All
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={handleClearAllClasses}
                            className="text-slate-500 hover:underline font-semibold"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                        {availableClassrooms.map((c) => {
                          const isChecked = formAssignedClasses.includes(c.name);
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center space-x-1.5 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                isChecked
                                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleClass(c.name)}
                                className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-0"
                              />
                              <span className="truncate">{c.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-2 border-t border-indigo-200/60">
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formSubmitting}
                      className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {formSubmitting
                        ? 'Saving to Cloud...'
                        : editingStaffId
                        ? 'Update Staff Member'
                        : 'Save & Onboard Teacher'}
                    </button>
                  </div>
                </form>
              )}

              {/* Staff Directory List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                  <span>Registered Staff & Teachers ({filteredStaff.length})</span>
                  {staffLoading && <span className="text-slate-400 font-normal">Refreshing...</span>}
                </div>

                {filteredStaff.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                    {staffSearchQuery ? 'No staff match your search.' : 'No staff members found.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredStaff.map((staff) => {
                      const isAdmin = staff.role === 'Admin';
                      const initial = staff.name.charAt(0).toUpperCase() || 'T';

                      return (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors gap-2"
                        >
                          {/* Info */}
                          <div className="flex items-center space-x-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                isAdmin ? 'bg-amber-600' : 'bg-indigo-600'
                              }`}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-xs font-bold text-slate-900 truncate">
                                  {staff.name}
                                </p>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.2 rounded-full border ${
                                    isAdmin
                                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                                      : 'bg-indigo-100 border-indigo-300 text-indigo-800'
                                  }`}
                                >
                                  {staff.role}
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-slate-500 truncate">
                                {staff.email}
                              </p>
                              <p className="text-[10px] font-semibold text-slate-600 truncate mt-0.5">
                                📌 {staff.assigned_classes}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(staff)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit teacher"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete teacher"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          {activeTab === 'cloud' && (
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
