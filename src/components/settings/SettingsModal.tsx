import React, { useState } from 'react';
import {
  X,
  Cloud,
  Database,
  Download,
  Upload,
  Copy,
  Check,
  Building2
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  SUPABASE_SETUP_SQL,
  getSupabase,
  testSupabaseConnection,
  syncRosterToCloud
} from '../../db/supabaseClient';
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
  const creds = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(creds.url);
  const [supabaseKey, setSupabaseKey] = useState(creds.key);
  const [currentSchoolName, setCurrentSchoolName] = useState(schoolName);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSyncStatusMsg('⚠️ Please enter both Project URL and Anon Public Key first.');
      return;
    }
    setIsTesting(true);
    setSyncStatusMsg('Testing connection to Supabase...');
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setIsTesting(false);
    if (res.success) {
      setSyncStatusMsg(`🎉 ${res.message}`);
    } else {
      setSyncStatusMsg(`⚠️ ${res.message}`);
    }
  };

  const [isSyncingRoster, setIsSyncingRoster] = useState(false);

  const handleSyncRoster = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSyncStatusMsg('⚠️ Please enter both Project URL and Anon Public Key first.');
      return;
    }
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setIsSyncingRoster(true);
    setSyncStatusMsg('Syncing students and classrooms to Supabase...');
    const classrooms = await db.classrooms.toArray();
    const students = await db.students.toArray();
    const result = await syncRosterToCloud(classrooms, students);
    setIsSyncingRoster(false);
    if (result.success) {
      setSyncStatusMsg(`🎉 Successfully synced ${result.count} students and ${classrooms.length} classrooms to Supabase!`);
    } else {
      setSyncStatusMsg(`⚠️ Roster sync error: ${result.error}`);
    }
  };

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    onUpdateSchoolName(currentSchoolName);

    const client = getSupabase();
    if (supabaseUrl && supabaseKey && client) {
      setSyncStatusMsg('✅ Cloud settings saved. Supabase client initialized!');
    } else {
      setSyncStatusMsg('✅ Settings saved in offline-first mode.');
    }
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
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
              <p className="text-[11px] text-slate-400">Zero-cost multi-device sync configuration</p>
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
              placeholder="e.g. Sunshine Preschool & Daycare"
              className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </section>

          {/* Cloud Database (Supabase Free Tier) */}
          <section className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-900">Supabase Cloud Database (Free Tier)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                $0 / month
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
              Connect your free Supabase project to automatically sync observations across multiple teachers&apos; phones. If left blank, the app runs 100% offline-first.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJh..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
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
                  <span>{isSyncingRoster ? 'Syncing...' : '👥 Sync All Students to Cloud'}</span>
                </button>
              </div>

              {/* 1-Click SQL Setup Script */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSql(!showSql)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>{showSql ? '▼ Hide Supabase SQL Setup' : '▶ Show 1-Click Supabase SQL Script'}</span>
                </button>

                {showSql && (
                  <div className="mt-2 bg-slate-900 rounded-lg p-3 text-slate-200 text-[10px] font-mono border border-slate-800">
                    <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                      <span className="text-slate-400">Copy & run in Supabase SQL Editor:</span>
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold flex items-center space-x-1 hover:bg-indigo-500"
                      >
                        {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                      </button>
                    </div>
                    <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap">{SUPABASE_SETUP_SQL}</pre>
                  </div>
                )}
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
