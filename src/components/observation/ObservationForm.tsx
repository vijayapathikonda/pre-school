import React, { useState, useEffect } from 'react';
import {
  Student,
  DailyObservation,
  ENGAGEMENT_OPTIONS,
  PARTICIPATION_OPTIONS,
  FOLLOWING_OPTIONS,
  THINKING_OPTIONS,
  SOCIAL_OPTIONS,
  STATE_OPTIONS,
  INTEREST_OPTIONS,
  EngagementOption,
  ParticipationOption,
  FollowingOption,
  ThinkingOption,
  SocialOption,
  StateOption,
  InterestOption
} from '../../types/observation';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Share2,
  FileDown,
  AlertCircle,
  Save,
  MessageSquare
} from 'lucide-react';
import { generateDailyObservationPDF } from '../reports/pdfGenerator';
import { shareViaWhatsApp } from '../../utils/whatsappShare';

interface ObservationFormProps {
  student: Student;
  date: string;
  initialObservation?: DailyObservation;
  onSave: (observation: DailyObservation) => Promise<void>;
  onNextStudent: () => void;
  onPrevStudent: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  schoolName: string;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({
  student,
  date,
  initialObservation,
  onSave,
  onNextStudent,
  onPrevStudent,
  hasNext,
  hasPrev,
  schoolName,
}) => {
  const [present, setPresent] = useState<boolean>(initialObservation?.present ?? true);
  const [engagement, setEngagement] = useState<EngagementOption | undefined>(initialObservation?.engagement);
  const [participation, setParticipation] = useState<ParticipationOption | undefined>(initialObservation?.participation);
  const [following, setFollowing] = useState<FollowingOption | undefined>(initialObservation?.following);
  const [thinking, setThinking] = useState<ThinkingOption[]>(initialObservation?.thinking || []);
  const [social, setSocial] = useState<SocialOption[]>(initialObservation?.social || []);
  const [state, setState] = useState<StateOption[]>(initialObservation?.state || []);
  const [interest, setInterest] = useState<InterestOption | undefined>(initialObservation?.interest);
  const [interestDetail, setInterestDetail] = useState<string>(initialObservation?.interestDetail || '');
  const [additionalObservation, setAdditionalObservation] = useState<string>(initialObservation?.additionalObservation || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync state when student or date changes
  useEffect(() => {
    setPresent(initialObservation?.present ?? true);
    setEngagement(initialObservation?.engagement);
    setParticipation(initialObservation?.participation);
    setFollowing(initialObservation?.following);
    setThinking(initialObservation?.thinking || []);
    setSocial(initialObservation?.social || []);
    setState(initialObservation?.state || []);
    setInterest(initialObservation?.interest);
    setInterestDetail(initialObservation?.interestDetail || '');
    setAdditionalObservation(initialObservation?.additionalObservation || '');
    setSavedNotice(false);
  }, [student.id, date, initialObservation]);

  const toggleMultiSelect = <T extends string>(
    item: T,
    currentList: T[],
    setList: (val: T[]) => void,
    notObservedValue: T
  ) => {
    if (item === notObservedValue) {
      if (currentList.includes(notObservedValue)) {
        setList([]);
      } else {
        setList([notObservedValue]);
      }
      return;
    }

    const withoutNotObserved = currentList.filter((x) => x !== notObservedValue);
    if (withoutNotObserved.includes(item)) {
      setList(withoutNotObserved.filter((x) => x !== item));
    } else {
      setList([...withoutNotObserved, item]);
    }
  };

  const handleSaveOnly = async () => {
    setIsSaving(true);
    const observation: DailyObservation = {
      id: initialObservation?.id,
      studentId: student.id,
      date,
      present,
      engagement: present ? engagement : undefined,
      participation: present ? participation : undefined,
      following: present ? following : undefined,
      thinking: present ? thinking : [],
      social: present ? social : [],
      state: present ? state : [],
      interest: present ? interest : undefined,
      interestDetail: present ? interestDetail : undefined,
      additionalObservation: present ? additionalObservation : undefined,
      recordedAt: initialObservation?.recordedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSave(observation);
    setIsSaving(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleSaveAndNext = async () => {
    await handleSaveOnly();
    if (hasNext) {
      onNextStudent();
    }
  };

  const currentObservationData: DailyObservation = {
    id: initialObservation?.id,
    studentId: student.id,
    date,
    present,
    engagement,
    participation,
    following,
    thinking,
    social,
    state,
    interest,
    interestDetail,
    additionalObservation,
    recordedAt: initialObservation?.recordedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const quickNoteChips = [
    'Enjoyed outdoor sensory play',
    'Shared toys kindly with peers',
    'Ate all lunch & snacks',
    'Focused well during storytime',
    'Needed gentle comforting at drop-off'
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28">
      {/* Student Identity Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm ${
                student.avatarColor || 'bg-slate-700'
              }`}
            >
              {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">{student.name}</h2>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {student.classroomName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Observation Date: <span className="font-semibold text-slate-700">{date}</span>
              </p>
            </div>
          </div>

          {/* Previous / Next Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={onPrevStudent}
              disabled={!hasPrev}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous Child"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextStudent}
              disabled={!hasNext}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Child"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Present / Absent Segmented Toggle */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Attendance:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPresent(true)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                present
                  ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✓ Present
            </button>
            <button
              type="button"
              onClick={() => setPresent(false)}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                !present
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✕ Absent
            </button>
          </div>
        </div>
      </div>

      {/* When marked Absent */}
      {!present ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Marked Absent Today</h3>
          <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto">
            {student.name} was marked absent for {date}. Observation categories are skipped.
          </p>
          <div className="mt-4 flex justify-center space-x-3">
            <button
              onClick={handleSaveAndNext}
              className="px-5 py-2 rounded-lg bg-slate-900 text-white font-semibold text-xs shadow-sm hover:bg-slate-800 flex items-center space-x-2"
            >
              <span>Save & Next Child</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* The 7 Core V1 Questions */
        <div className="space-y-4">
          
          {/* Question 1: ENGAGEMENT / ATTENTION */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                1. ENGAGEMENT / ATTENTION
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Single choice</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ENGAGEMENT_OPTIONS.map((opt) => {
                const isSelected = engagement === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setEngagement(isSelected ? undefined : opt)}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all border text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 2: PARTICIPATION */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                2. PARTICIPATION
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Single choice</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PARTICIPATION_OPTIONS.map((opt) => {
                const isSelected = participation === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setParticipation(isSelected ? undefined : opt)}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all border text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 3: FOLLOWING / RESPONSE */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                3. FOLLOWING / RESPONSE
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Single choice</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FOLLOWING_OPTIONS.map((opt) => {
                const isSelected = following === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFollowing(isSelected ? undefined : opt)}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all border text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 4: THINKING / EXPLORING */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                4. THINKING / EXPLORING
              </h3>
              <span className="text-[10px] text-indigo-600 font-medium">Select all that apply</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {THINKING_OPTIONS.map((opt) => {
                const isSelected = thinking.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMultiSelect(opt, thinking, setThinking, 'Not observed')}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all border text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 5: SOCIAL / COMMUNICATION */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                5. SOCIAL / COMMUNICATION
              </h3>
              <span className="text-[10px] text-indigo-600 font-medium">Select all that apply</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_OPTIONS.map((opt) => {
                const isSelected = social.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMultiSelect(opt, social, setSocial, 'Not observed')}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all border text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 6: STATE / DISPOSITION TODAY */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                6. STATE / DISPOSITION TODAY
              </h3>
              <span className="text-[10px] text-indigo-600 font-medium">Select mood / state</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATE_OPTIONS.map((opt) => {
                const isSelected = state.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleMultiSelect(opt, state, setState, 'Nothing unusual noticed')}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all border text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question 7: INTEREST TODAY */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide">
                7. INTEREST TODAY
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Single choice</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((opt) => {
                const isSelected = interest === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setInterest(isSelected ? undefined : opt)}
                    className={`text-xs px-3.5 py-2 rounded-lg font-medium transition-all border text-left flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic text field: "If greater / less interest – in what?" */}
            {(interest === 'Noticeably greater interest' || interest === 'Noticeably less interest') && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  If greater / less interest – in what?
                </label>
                <input
                  type="text"
                  value={interestDetail}
                  onChange={(e) => setInterestDetail(e.target.value)}
                  placeholder="e.g. dinosaur puzzle, painting easel, outdoor tricycle..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            )}
          </section>

          {/* ADDITIONAL OBSERVATION – OPTIONAL */}
          <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-wide flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>ADDITIONAL OBSERVATION – OPTIONAL</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Anything else worth remembering about this child today?
            </p>

            {/* Quick Helper Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {quickNoteChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setAdditionalObservation((prev) =>
                      prev ? `${prev}. ${chip}` : chip
                    );
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  + {chip}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={additionalObservation}
              onChange={(e) => setAdditionalObservation(e.target.value)}
              placeholder="Write any milestones, quotes, or notes here (supports phone voice dictation)..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed"
            />
          </section>
        </div>
      )}

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur border-t border-slate-200 p-3 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          
          {/* WhatsApp & PDF Actions */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => shareViaWhatsApp(student, currentObservationData, schoolName)}
              className="px-2.5 sm:px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
              title="Share to Parent WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => generateDailyObservationPDF(student, currentObservationData, schoolName, student.classroomName)}
              className="px-2.5 sm:px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
              title="Download PDF Observation Slip"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF Slip</span>
            </button>
          </div>

          {/* Primary Save & Next Child Button */}
          <div className="flex items-center space-x-2">
            {savedNotice && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={isSaving}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-300"
            >
              <Save className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndNext}
              disabled={isSaving}
              className="px-4 sm:px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <span>{hasNext ? 'Save & Next' : 'Save Record'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
