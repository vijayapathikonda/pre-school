import React, { useState } from 'react';
import {
  X,
  Cloud,
  Database,
  Download,
  Upload,
  Building2,
} from 'lucide-react';
import {
  getTursoCredentials,
  saveTursoCredentials,
  getTurso,
  testTursoConnection,
  syncRosterToCloud
} from '../../db/tursoClient';
import { db } from '../../db/schema';
import { exportAllDataAsJSON, importDataFromJSON, downloadFile } from '../../db/exportImport';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  onUpdateSchoolName: (name: string) => void;
  onDataImported: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  schoolName,
  onUpdateSchoolName,
  onDataImported,
}) => {
  const creds = getTursoCredentials();
  const [tursoUrl, setTursoUrl] = useState(creds.url);
  const [tursoToken, setTursoToken] = useState(creds.token);
  const [currentSchoolName, setCurrentSchoolName] = useState(schoolName);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);

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
    const classrooms = await db.classrooms.toArray();
    const students = await db.students.toArray();
    const result = await syncRosterToCloud(classrooms, students);
    setIsSyncingRoster(false);
    if (result.success) {
      setSyncStatusMsg(`🎉 Successfully synced ${result.count} students and ${classrooms.length} classrooms to Turso!`);
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-6">
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

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
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

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
