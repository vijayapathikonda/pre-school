import React, { useState, useEffect, useMemo } from 'react';
import { Student, DailyObservation, Classroom } from '../../types/observation';
import { db } from '../../db/schema';
import {
  FileText,
  Download,
  Share2,
  Calendar,
  Sparkles,
  RefreshCw,
  BookOpen,
  Users,
  Smile,
  Lightbulb,
  Check,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { generateDailyObservationPDF, generateAIInsightsPDF } from './pdfGenerator';
import {
  shareViaWhatsApp,
  shareAIInsightsViaWhatsApp,
  formatAIInsightsForWhatsApp,
} from '../../utils/whatsappShare';
import { exportObservationsToCSV, downloadFile } from '../../db/exportImport';
import { fetchStudentCloudHistory } from '../../db/tursoClient';
import {
  AIStudentInsight,
  getCachedStudentInsight,
  generateStudentAIInsights,
} from '../../utils/geminiInsights';

interface ReportsViewProps {
  students: Student[];
  classrooms?: Classroom[];
  schoolName: string;
  onNotify?: (
    title: string,
    message: string,
    type?: 'success' | 'info' | 'warning' | 'error'
  ) => void;
}

type PeriodOption = '7d' | '30d' | 'all';

const PERIOD_LABELS: Record<PeriodOption, string> = {
  '7d': 'Last 7 Recorded Days',
  '30d': 'Last 30 Recorded Days',
  all: 'All Recorded Days',
};

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  classrooms = [],
  schoolName,
  onNotify,
}) => {
  const [selectedClassroomFilter, setSelectedClassroomFilter] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [studentHistory, setStudentHistory] = useState<DailyObservation[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Insights State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('all');
  const [aiInsight, setAiInsight] = useState<AIStudentInsight | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Filter students by selected classroom pill
  const filteredStudents = useMemo(() => {
    if (selectedClassroomFilter === 'ALL') return students;
    return students.filter((s) => s.classroomId === selectedClassroomFilter);
  }, [students, selectedClassroomFilter]);

  // Keep selectedStudentId valid when classroom filter changes
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const exists = filteredStudents.some((s) => s.id === selectedStudentId);
      if (!exists) {
        setSelectedStudentId(filteredStudents[0].id);
      }
    } else {
      setSelectedStudentId('');
    }
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Load student observation history from IndexedDB + Turso Cloud
  useEffect(() => {
    if (!selectedStudentId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setAiError(null);

      // 1. Instantly display local IndexedDB records
      const localRecords = await db.observations
        .where('studentId')
        .equals(selectedStudentId)
        .reverse()
        .sortBy('date');
      setStudentHistory(localRecords);

      // 2. Pull student history from Turso cloud so records from other devices appear
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

  // Load cached AI insight when student or period changes
  useEffect(() => {
    if (!selectedStudentId) {
      setAiInsight(null);
      return;
    }
    setAiError(null);
    getCachedStudentInsight(selectedStudentId, selectedPeriod).then((cached) => {
      setAiInsight(cached);
    });
  }, [selectedStudentId, selectedPeriod]);

  // Subset of observations based on selectedPeriod
  const observationsForPeriod = useMemo(() => {
    if (selectedPeriod === '7d') return studentHistory.slice(0, 7);
    if (selectedPeriod === '30d') return studentHistory.slice(0, 30);
    return studentHistory;
  }, [studentHistory, selectedPeriod]);

  const handleGenerateAIInsights = async () => {
    if (!selectedStudent) return;
    if (observationsForPeriod.length === 0) {
      onNotify?.(
        'No Observations Yet',
        `Record at least one daily observation for ${selectedStudent.name} first.`,
        'warning'
      );
      return;
    }

    setAiGenerating(true);
    setAiError(null);

    try {
      const result = await generateStudentAIInsights({
        student: selectedStudent,
        observations: observationsForPeriod,
        periodKey: selectedPeriod,
        periodLabel: PERIOD_LABELS[selectedPeriod],
        schoolName,
      });
      setAiInsight(result);
      onNotify?.(
        'AI Insights Ready!',
        `Generated developmental summary for ${selectedStudent.name}.`,
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || 'Could not generate AI insights.';
      setAiError(msg);
      onNotify?.('AI Insight Error', msg, 'error');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopyInsight = () => {
    if (!aiInsight) return;
    const text = formatAIInsightsForWhatsApp(aiInsight, schoolName);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    onNotify?.('Copied!', 'AI progress summary copied to clipboard.', 'success');
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleExportAllCSV = async () => {
    try {
      onNotify?.('Exporting History', 'Generating full observation archive CSV...', 'info');
      const csv = await exportObservationsToCSV();
      downloadFile(
        csv,
        `Preschool_Full_Observation_Archive_${new Date().toISOString().split('T')[0]}.csv`,
        'text/csv;charset=utf-8;'
      );
      onNotify?.(
        'Export Complete!',
        'Downloaded complete historical observation archive CSV.',
        'success'
      );
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
            <span>Parent Slips, AI Insights & Historical Records</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate AI-powered progress summaries, print official PDF slips, or share updates via WhatsApp.
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

      {/* Classroom Filter Pills + Student Selector Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 mb-4 shadow-sm space-y-3">
        {classrooms.length > 1 && (
          <div>
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Filter by Classroom:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedClassroomFilter('ALL')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all border ${
                  selectedClassroomFilter === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({students.length})
              </button>
              {classrooms.map((c) => {
                const count = students.filter((s) => s.classroomId === c.id).length;
                const active = selectedClassroomFilter === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClassroomFilter(c.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition-all border ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Select Child to View AI Insights & Observation Slips:
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full sm:max-w-md text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.classroomName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI-BASED INSIGHTS CARD (White-label Built-in Mode) */}
      {selectedStudent && (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl border border-indigo-800/60 p-4 sm:p-5 mb-5 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-indigo-800/60">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                    AI-Based Developmental & Learning Insights
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    Smart Progress Analyzer
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  Analyzes daily teacher uploads for <strong>{selectedStudent.name}</strong> to generate natural paragraph summaries on academic progress, learning patterns, and mood.
                </p>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodOption)}
                className="text-xs font-bold bg-slate-800/90 text-white border border-indigo-500/40 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="7d">Last 7 Recorded Days</option>
                <option value="30d">Last 30 Recorded Days</option>
                <option value="all">All Recorded Days ({studentHistory.length})</option>
              </select>
            </div>
          </div>

          {/* Error Notice */}
          {aiError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Action Bar / Generate Trigger */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-indigo-200">
              {observationsForPeriod.length === 0 ? (
                <span>No observations recorded yet for {selectedStudent.name}.</span>
              ) : (
                <span>
                  Ready to analyze <strong>{observationsForPeriod.length} recorded day(s)</strong> (
                  {observationsForPeriod.filter((o) => o.present).length} Present,{' '}
                  {observationsForPeriod.filter((o) => !o.present).length} Absent).
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateAIInsights}
                disabled={aiGenerating || observationsForPeriod.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-extrabold text-xs shadow-sm flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Generating Insights...</span>
                  </>
                ) : aiInsight ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate Summary</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Progress Summary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated AI Insights Display */}
          {aiInsight && (
            <div className="mt-4 pt-4 border-t border-indigo-800/60 space-y-4">
              {/* Top Highlights & Export Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {aiInsight.highlights?.map((badge, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30"
                    >
                      ★ {badge}
                    </span>
                  ))}
                </div>

                {/* Share / Download AI Report Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onNotify?.(
                        'WhatsApp',
                        `Sharing AI summary for ${selectedStudent.name}...`,
                        'info'
                      );
                      shareAIInsightsViaWhatsApp(aiInsight, schoolName);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      onNotify?.(
                        'PDF Report',
                        `Generating official letterhead progress report for ${selectedStudent.name}...`,
                        'info'
                      );
                      await generateAIInsightsPDF(aiInsight, schoolName);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Letterhead PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyInsight}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition-colors"
                    title="Copy Summary Text"
                  >
                    {copiedText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{copiedText ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Overall Narrative Box */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-white/15">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
                  Overall Progress Summary ({aiInsight.dateRange})
                </h4>
                <p className="text-xs sm:text-sm text-white leading-relaxed">
                  {aiInsight.overallSummary}
                </p>
              </div>

              {/* 3 Domain Paragraph Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Academic & Learning */}
                <div className="bg-slate-900/75 rounded-xl p-3.5 border border-indigo-500/30">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                    <h5 className="text-xs font-bold text-indigo-200">
                      Academic & Learning Patterns
                    </h5>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {aiInsight.academicAndLearning}
                  </p>
                </div>

                {/* Social & Participation */}
                <div className="bg-slate-900/75 rounded-xl p-3.5 border border-indigo-500/30">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h5 className="text-xs font-bold text-emerald-200">
                      Social & Participation
                    </h5>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {aiInsight.socialAndParticipation}
                  </p>
                </div>

                {/* Mood & Disposition */}
                <div className="bg-slate-900/75 rounded-xl p-3.5 border border-indigo-500/30">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Smile className="w-4 h-4 text-amber-400 shrink-0" />
                    <h5 className="text-xs font-bold text-amber-200">
                      Mood & Emotional State
                    </h5>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {aiInsight.moodAndDisposition}
                  </p>
                </div>
              </div>

              {/* Recommendations */}
              {aiInsight.recommendations && aiInsight.recommendations.length > 0 && (
                <div className="bg-indigo-950/60 rounded-xl p-3.5 border border-indigo-700/50">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-300 shrink-0" />
                    <h5 className="text-xs font-bold text-amber-200">
                      Gentle Focus Areas & Recommendations
                    </h5>
                  </div>
                  <ul className="space-y-1 text-xs text-indigo-100 list-disc list-inside">
                    {aiInsight.recommendations.map((rec, i) => (
                      <li key={i} className="leading-relaxed">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-indigo-300/70 pt-1">
                <span>Based on {aiInsight.analyzedDaysCount} recorded observation(s)</span>
                <span>Updated: {new Date(aiInsight.generatedAt).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

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
                {selectedStudent.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <h3 className="text-xs font-bold text-slate-800">
                Daily Observation History for {selectedStudent.name}
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
                <div key={obs.id || obs.date} className="p-4 hover:bg-slate-50/80 transition-colors">
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
                          onNotify?.(
                            'WhatsApp',
                            `Opening WhatsApp slip for ${selectedStudent.name}...`,
                            'info'
                          );
                          shareViaWhatsApp(selectedStudent, obs, schoolName);
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 text-xs font-bold flex items-center space-x-1 border border-emerald-200 transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => {
                          onNotify?.(
                            'PDF Slip',
                            `Downloading observation slip for ${selectedStudent.name} (${obs.date})...`,
                            'info'
                          );
                          generateDailyObservationPDF(
                            selectedStudent,
                            obs,
                            schoolName,
                            selectedStudent.classroomName
                          );
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
                        <span className="font-semibold text-slate-500 text-[11px]">
                          1. Engagement:
                        </span>{' '}
                        <span className="font-medium text-slate-800">
                          {obs.engagement || 'Not recorded'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px]">
                          2. Participation:
                        </span>{' '}
                        <span className="font-medium text-slate-800">
                          {obs.participation || 'Not recorded'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px]">
                          3. Following:
                        </span>{' '}
                        <span className="font-medium text-slate-800">
                          {obs.following || 'Not recorded'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500 text-[11px]">
                          6. Mood/State:
                        </span>{' '}
                        <span className="font-medium text-slate-800">
                          {(obs.state || []).join(', ') || 'Normal'}
                        </span>
                      </div>
                      {obs.thinking && obs.thinking.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-500 text-[11px]">
                            4. Thinking:
                          </span>{' '}
                          <span className="font-medium text-slate-800">
                            {obs.thinking.join(', ')}
                          </span>
                        </div>
                      )}
                      {obs.social && obs.social.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-500 text-[11px]">
                            5. Social:
                          </span>{' '}
                          <span className="font-medium text-slate-800">
                            {obs.social.join(', ')}
                          </span>
                        </div>
                      )}
                      {obs.interest && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-slate-500 text-[11px]">
                            7. Interest:
                          </span>{' '}
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
