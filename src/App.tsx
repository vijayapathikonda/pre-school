import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Classroom, Student, DailyObservation } from './types/observation';
import { db, initializeDatabase, saveObservation, syncUnsyncedObservations } from './db/schema';
import { 
  fetchCloudObservations, 
  fetchCloudRoster, 
  subscribeToCloudObservations 
} from './db/tursoClient';
import { Header } from './components/layout/Header';
import { Navigation, TabType } from './components/layout/Navigation';
import { StudentRosterBar } from './components/observation/StudentRosterBar';
import { ObservationForm } from './components/observation/ObservationForm';
import { DailySummaryList } from './components/observation/DailySummaryList';
import { StudentList } from './components/roster/StudentList';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsModal } from './components/settings/SettingsModal';
import { LoginPage, AuthUser } from './components/auth/LoginPage';
import { Toast, ToastMessage } from './components/common/Toast';

export const App: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('pragathi_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<TabType>('observation');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('c_jnana');
  const [activeStudentId, setActiveStudentId] = useState<string>('');
  const [observations, setObservations] = useState<DailyObservation[]>([]);
  const [schoolName, setSchoolName] = useState<string>('Pragathi Vidyalaya School');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
      setToast({
        id: Date.now().toString(),
        title,
        message,
        type,
      });
    },
    []
  );

  // Initialize DB and load data
  const loadData = useCallback(async () => {
    await initializeDatabase();

    const storedClassrooms = await db.classrooms.toArray();
    const storedStudents = await db.students.filter((s) => s.active).toArray();
    const schoolNameSetting = await db.settings.get('schoolName');

    setClassrooms(storedClassrooms);
    setStudents(storedStudents);

    if (schoolNameSetting) setSchoolName(schoolNameSetting.value);

    // If active class is invalid, default to first class (Nursery Jnana)
    if (storedClassrooms.length > 0) {
      setSelectedClassroomId((prev) => {
        if (prev === 'ALL') return prev;
        const exists = storedClassrooms.some((c) => c.id === prev);
        return exists ? prev : storedClassrooms[0].id;
      });
    }

    setReady(true);

    // In background, pull master roster from cloud if connected
    fetchCloudRoster()
      .then(async (cloudRoster) => {
        if (cloudRoster && cloudRoster.students.length > 0) {
          await db.classrooms.clear();
          await db.classrooms.bulkPut(cloudRoster.classrooms);

          const cloudStudentIds = new Set(cloudRoster.students.map((s) => s.id));
          const localStudents = await db.students.toArray();
          for (const ls of localStudents) {
            if (!cloudStudentIds.has(ls.id)) {
              await db.students.delete(ls.id);
            }
          }
          await db.students.bulkPut(cloudRoster.students);

          setClassrooms(cloudRoster.classrooms);
          setStudents(cloudRoster.students);
        }
      })
      .catch((err) => console.warn('Background roster sync notice:', err));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load observations whenever date changes
  const loadDateObservations = useCallback(async () => {
    if (!ready) return;

    // 1. Immediately read local records for 0ms latency UI display
    const localRecords = await db.observations.where('date').equals(selectedDate).toArray();
    setObservations(localRecords);

    // 2. Fetch remote records from Supabase cloud
    try {
      const cloudRecords = await fetchCloudObservations(selectedDate);
      if (cloudRecords && cloudRecords.length > 0) {
        for (const cloudObs of cloudRecords) {
          await db.observations.put(cloudObs);
        }
        const updatedRecords = await db.observations.where('date').equals(selectedDate).toArray();
        setObservations(updatedRecords);
      }

      // 3. Push any offline records created on this device
      syncUnsyncedObservations().catch((err) => console.warn('Offline sync notice:', err));
    } catch (err) {
      console.warn('Could not pull cloud observations:', err);
    }
  }, [ready, selectedDate]);

  useEffect(() => {
    loadDateObservations();
  }, [loadDateObservations]);

  // Subscribe to real-time changes on daily_observations for active date
  useEffect(() => {
    if (!ready) return;

    const unsubscribe = subscribeToCloudObservations(selectedDate, (cloudObs) => {
      // Save directly to Dexie
      db.observations.put(cloudObs).catch((e) => console.warn('Dexie save error:', e));

      // Update active observations state
      setObservations((prev) => {
        const index = prev.findIndex(
          (o) => o.studentId === cloudObs.studentId && o.date === cloudObs.date
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = cloudObs;
          return updated;
        }
        return [...prev, cloudObs];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [ready, selectedDate]);

  // Enforce classroom scoping on user login or switch
  useEffect(() => {
    if (currentUser?.role === 'teacher' && currentUser.assignedClasses && !currentUser.assignedClasses.includes('*')) {
      const allowedClass = currentUser.defaultClassId || currentUser.assignedClasses[0];
      if (selectedClassroomId !== allowedClass && !currentUser.assignedClasses.includes(selectedClassroomId)) {
        setSelectedClassroomId(allowedClass);
      }
    }
  }, [currentUser, selectedClassroomId]);

  // Filter students based on classroom selection and user authorization scope
  const classroomStudents = useMemo(() => {
    // Admins can view 'ALL'
    if (selectedClassroomId === 'ALL' && currentUser?.role === 'admin') return students;

    // Teachers are strictly restricted to their assigned classroom
    if (currentUser?.role === 'teacher' && currentUser.assignedClasses && !currentUser.assignedClasses.includes('*')) {
      const allowedId = currentUser.assignedClasses.includes(selectedClassroomId)
        ? selectedClassroomId
        : currentUser.defaultClassId || currentUser.assignedClasses[0];
      return students.filter((s) => s.classroomId === allowedId);
    }

    return students.filter((s) => s.classroomId === selectedClassroomId);
  }, [students, selectedClassroomId, currentUser]);

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

  const handleManualSync = async () => {
    setIsSyncing(true);
    showToast('Syncing Cloud...', 'Connecting to Supabase Cloud Database...', 'info');
    try {
      // 1. Push any offline records created on this phone
      await syncUnsyncedObservations();

      // 2. Fetch latest master roster from cloud
      const cloudRoster = await fetchCloudRoster();
      if (cloudRoster && cloudRoster.students.length > 0) {
        await db.classrooms.clear();
        await db.classrooms.bulkPut(cloudRoster.classrooms);

        const cloudStudentIds = new Set(cloudRoster.students.map((s) => s.id));
        const localStudents = await db.students.toArray();
        for (const ls of localStudents) {
          if (!cloudStudentIds.has(ls.id)) {
            await db.students.delete(ls.id);
          }
        }
        await db.students.bulkPut(cloudRoster.students);

        setClassrooms(cloudRoster.classrooms);
        setStudents(cloudRoster.students);
      }

      // 3. Fetch observations for currently selected date
      const cloudRecords = await fetchCloudObservations(selectedDate);
      if (cloudRecords && cloudRecords.length > 0) {
        for (const obs of cloudRecords) {
          await db.observations.put(obs);
        }
      }
      const updatedRecords = await db.observations.where('date').equals(selectedDate).toArray();
      setObservations(updatedRecords);

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
      showToast(
        'Cloud Synced!',
        `Refreshed ${cloudRecords.length} observation records from Supabase Cloud.`,
        'success'
      );
    } catch (err: any) {
      console.warn('Manual sync warning:', err);
      showToast('Sync Notice', err?.message || 'Could not complete cloud sync.', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClassroomChange = async (id: string) => {
    setSelectedClassroomId(id);
    await db.settings.put({ key: 'activeClassroomId', value: id });
  };

  const handleUpdateSchoolName = async (name: string) => {
    setSchoolName(name);
    await db.settings.put({ key: 'schoolName', value: name });
    showToast('School Name Updated', `Updated to "${name}"`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('pragathi_auth_user');
    setCurrentUser(null);
    showToast('Logged Out', 'You have been safely logged out.', 'info');
  };

  // If user is not logged in, show mandatory LoginPage first!
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          // If teacher logs in with assigned classes, auto-select their classroom
          if (user.defaultClassId) {
            setSelectedClassroomId(user.defaultClassId);
          } else if (user.assignedClasses && user.assignedClasses.length > 0 && !user.assignedClasses.includes('*')) {
            setSelectedClassroomId(user.assignedClasses[0]);
          } else if (user.role === 'teacher' && selectedClassroomId === 'ALL') {
            setSelectedClassroomId(classrooms[0]?.id || 'nursery_jnana');
          }
        }}
        schoolName={schoolName}
      />
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">Loading Pragathi Vidyalaya Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Header with School Logo, Dynamic Title & Logout */}
      <Header
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        classrooms={classrooms}
        selectedClassroomId={selectedClassroomId}
        onClassroomChange={handleClassroomChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        schoolName={schoolName}
        totalStudents={students.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        lastSyncTime={lastSyncTime}
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
                onNotify={showToast}
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
            onDateChange={setSelectedDate}
            onSelectStudent={(id) => {
              setActiveStudentId(id);
              setCurrentTab('observation');
            }}
            schoolName={schoolName}
            onNotify={showToast}
          />
        )}

        {currentTab === 'roster' && (
          <StudentList
            students={currentUser.role === 'admin' ? students : classroomStudents}
            classrooms={
              currentUser.role === 'admin'
                ? classrooms
                : classrooms.filter((c) => currentUser.assignedClasses?.includes(c.id))
            }
            selectedClassroomId={selectedClassroomId}
            onRefreshRoster={loadData}
            isAdmin={currentUser.role === 'admin'}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            students={classroomStudents}
            classrooms={classrooms}
            schoolName={schoolName}
            onNotify={showToast}
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

      {/* Global Toast Notification Prompt */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default App;
