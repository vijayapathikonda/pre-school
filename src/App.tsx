import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Classroom, Student, DailyObservation } from './types/observation';
import { db, initializeDatabase, saveObservation } from './db/schema';
import { Header } from './components/layout/Header';
import { Navigation, TabType } from './components/layout/Navigation';
import { StudentRosterBar } from './components/observation/StudentRosterBar';
import { ObservationForm } from './components/observation/ObservationForm';
import { DailySummaryList } from './components/observation/DailySummaryList';
import { StudentList } from './components/roster/StudentList';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsModal } from './components/settings/SettingsModal';

export const App: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabType>('observation');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('ALL');
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  const [observations, setObservations] = useState<DailyObservation[]>([]);
  const [schoolName, setSchoolName] = useState<string>('Sunshine Preschool & Academy');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initialize DB and load initial data
  const loadData = useCallback(async () => {
    await initializeDatabase();

    const storedClassrooms = await db.classrooms.toArray();
    const storedStudents = await db.students.filter((s) => s.active).toArray();
    const schoolNameSetting = await db.settings.get('schoolName');
    const activeClassSetting = await db.settings.get('activeClassroomId');

    setClassrooms(storedClassrooms);
    setStudents(storedStudents);

    if (schoolNameSetting) setSchoolName(schoolNameSetting.value);
    if (activeClassSetting && activeClassSetting.value) {
      setSelectedClassroomId(activeClassSetting.value);
    } else if (storedClassrooms.length > 0) {
      setSelectedClassroomId(storedClassrooms[0].id);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load observations whenever date changes
  const loadDateObservations = useCallback(async () => {
    if (!ready) return;
    const records = await db.observations.where('date').equals(selectedDate).toArray();
    setObservations(records);
  }, [ready, selectedDate]);

  useEffect(() => {
    loadDateObservations();
  }, [loadDateObservations]);

  // Filter students based on classroom selection
  const classroomStudents = useMemo(() => {
    if (selectedClassroomId === 'ALL') return students;
    return students.filter((s) => s.classroomId === selectedClassroomId);
  }, [students, selectedClassroomId]);

  // Ensure active student is valid when classroom changes
  useEffect(() => {
    if (classroomStudents.length > 0) {
      const exists = classroomStudents.some((s) => s.id === activeStudentId);
      if (!exists) {
        setActiveStudentId(classroomStudents[0].id);
      }
    } else {
      setActiveStudentId('');
    }
  }, [classroomStudents, activeStudentId]);

  // Map of studentId -> DailyObservation for selectedDate
  const observationsMap = useMemo(() => {
    const map = new Map<string, DailyObservation>();
    observations.forEach((obs) => map.set(obs.studentId, obs));
    return map;
  }, [observations]);

  // Calculate completed count for active classroom on selectedDate
  const completedCount = useMemo(() => {
    return classroomStudents.filter((s) => {
      const obs = observationsMap.get(s.id);
      return obs && (obs.present ? !!obs.engagement : true);
    }).length;
  }, [classroomStudents, observationsMap]);

  // Active student object and observation
  const activeStudent = useMemo(() => {
    return students.find((s) => s.id === activeStudentId) || classroomStudents[0];
  }, [students, activeStudentId, classroomStudents]);

  const activeObservation = useMemo(() => {
    if (!activeStudent) return undefined;
    return observationsMap.get(activeStudent.id);
  }, [activeStudent, observationsMap]);

  // Student navigation within current classroom
  const currentIndex = classroomStudents.findIndex((s) => s.id === activeStudent?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < classroomStudents.length - 1;

  const handleNextStudent = () => {
    if (hasNext) {
      setActiveStudentId(classroomStudents[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStudent = () => {
    if (hasPrev) {
      setActiveStudentId(classroomStudents[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveObservation = async (obs: DailyObservation) => {
    await saveObservation(obs);
    await loadDateObservations();
  };

  const handleClassroomChange = async (id: string) => {
    setSelectedClassroomId(id);
    await db.settings.put({ key: 'activeClassroomId', value: id });
  };

  const handleUpdateSchoolName = async (name: string) => {
    setSchoolName(name);
    await db.settings.put({ key: 'schoolName', value: name });
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">Loading Preschool Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        classrooms={classrooms}
        selectedClassroomId={selectedClassroomId}
        onClassroomChange={handleClassroomChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        schoolName={schoolName}
        totalStudents={students.length}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'observation' && (
          <div>
            {/* Student Carousel Bar */}
            <StudentRosterBar
              students={classroomStudents}
              observationsMap={observationsMap}
              activeStudentId={activeStudent?.id || ''}
              onSelectStudent={setActiveStudentId}
            />

            {/* Observation Form */}
            {activeStudent ? (
              <ObservationForm
                student={activeStudent}
                date={selectedDate}
                initialObservation={activeObservation}
                onSave={handleSaveObservation}
                onNextStudent={handleNextStudent}
                onPrevStudent={handlePrevStudent}
                hasNext={hasNext}
                hasPrev={hasPrev}
                schoolName={schoolName}
              />
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm">
                No students enrolled in this classroom section yet.
              </div>
            )}
          </div>
        )}

        {currentTab === 'summary' && (
          <DailySummaryList
            students={classroomStudents}
            observationsMap={observationsMap}
            selectedDate={selectedDate}
            onSelectStudent={(id) => {
              setActiveStudentId(id);
              setCurrentTab('observation');
            }}
            schoolName={schoolName}
          />
        )}

        {currentTab === 'roster' && (
          <StudentList
            students={students}
            classrooms={classrooms}
            selectedClassroomId={selectedClassroomId}
            onRefreshRoster={loadData}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            students={classroomStudents}
            classrooms={classrooms}
            schoolName={schoolName}
          />
        )}
      </main>

      {/* Bottom Mobile Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        completedCount={completedCount}
        totalCount={classroomStudents.length}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        schoolName={schoolName}
        onUpdateSchoolName={handleUpdateSchoolName}
        onDataImported={loadData}
      />
    </div>
  );
};

export default App;
