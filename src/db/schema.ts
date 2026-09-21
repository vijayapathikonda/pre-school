import Dexie, { Table } from 'dexie';
import { Student, DailyObservation, Classroom } from '../types/observation';
import { REAL_CLASSROOMS, REAL_STUDENTS } from './sampleData';
import { syncObservationToCloud, syncRosterToCloud } from './supabaseClient';

export interface AppSetting {
  key: string;
  value: any;
}

export class PreschoolDatabase extends Dexie {
  classrooms!: Table<Classroom, string>;
  students!: Table<Student, string>;
  observations!: Table<DailyObservation, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('PreschoolObsDB');
    this.version(3).stores({
      classrooms: 'id, name, ageGroup',
      students: 'id, name, classroomId, classroomName, active, createdAt',
      observations: '++id, studentId, date, [studentId+date], present, recordedAt',
      settings: 'key'
    });
  }
}

export const db = new PreschoolDatabase();

export const SCHOOL_NAME = 'Pragathi Vidyalaya School';

// Seed initial classrooms and students for Pragathi Vidyalaya School
export async function initializeDatabase(): Promise<void> {
  const schoolMigrated = await db.settings.get('pragathi_migrated_v1');

  // If not yet migrated to Pragathi Vidyalaya School, clean legacy mock data and seed real data
  if (!schoolMigrated) {
    await db.students.clear();
    await db.classrooms.clear();
    await db.classrooms.bulkAdd(REAL_CLASSROOMS);
    await db.students.bulkAdd(REAL_STUDENTS);

    await db.settings.put({ key: 'schoolName', value: SCHOOL_NAME });
    await db.settings.put({ key: 'activeClassroomId', value: REAL_CLASSROOMS[0].id });
    await db.settings.put({ key: 'adminPin', value: '1234' });
    await db.settings.put({ key: 'pragathi_migrated_v1', value: true });

    // Attempt initial sync to Supabase in background
    syncRosterToCloud(REAL_CLASSROOMS, REAL_STUDENTS).catch((err) =>
      console.warn('Initial cloud sync pending:', err)
    );
    return;
  }

  const classroomCount = await db.classrooms.count();
  if (classroomCount === 0) {
    await db.classrooms.bulkAdd(REAL_CLASSROOMS);
  }

  const studentCount = await db.students.count();
  if (studentCount === 0) {
    await db.students.bulkAdd(REAL_STUDENTS);
  }

  const schoolNameSetting = await db.settings.get('schoolName');
  if (!schoolNameSetting) {
    await db.settings.put({ key: 'schoolName', value: SCHOOL_NAME });
  }
}

// Reset to Pragathi Vidyalaya School roster
export async function resetToPragathiRoster(): Promise<void> {
  await db.students.clear();
  await db.classrooms.clear();
  await db.classrooms.bulkAdd(REAL_CLASSROOMS);
  await db.students.bulkAdd(REAL_STUDENTS);
  await db.settings.put({ key: 'schoolName', value: SCHOOL_NAME });
  await syncRosterToCloud(REAL_CLASSROOMS, REAL_STUDENTS);
}

// Import students from Excel/CSV parsed rows
export async function importStudentsFromRows(
  rows: Array<{ name: string; className: string; notes?: string }>
): Promise<{ added: number; classroomsAdded: number }> {
  const currentClassrooms = await db.classrooms.toArray();
  const classMap = new Map<string, Classroom>();
  currentClassrooms.forEach((c) => {
    classMap.set(c.name.toLowerCase().trim(), c);
  });

  let classroomsAddedCount = 0;
  const newStudents: Student[] = [];

  const AVATAR_COLORS = [
    'bg-indigo-600',
    'bg-emerald-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-blue-600',
    'bg-violet-600',
    'bg-teal-600',
    'bg-purple-600',
    'bg-cyan-600',
    'bg-orange-600'
  ];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const trimmedName = row.name.trim();
    if (!trimmedName) continue;

    const rawClassName = (row.className || 'General').trim();
    const classKey = rawClassName.toLowerCase();

    let classroom = classMap.get(classKey);
    if (!classroom) {
      // Create classroom dynamically if it does not exist
      const newClass: Classroom = {
        id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: rawClassName,
        ageGroup: 'Preschool'
      };
      await db.classrooms.add(newClass);
      classMap.set(classKey, newClass);
      classroom = newClass;
      classroomsAddedCount++;
    }

    newStudents.push({
      id: `std_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
      name: trimmedName,
      classroomId: classroom.id,
      classroomName: classroom.name,
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      notes: row.notes?.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString()
    });
  }

  if (newStudents.length > 0) {
    await db.students.bulkAdd(newStudents);
    const allClassrooms = await db.classrooms.toArray();
    const allStudents = await db.students.toArray();
    syncRosterToCloud(allClassrooms, allStudents).catch((err) =>
      console.warn('Background sync after import:', err)
    );
  }

  return { added: newStudents.length, classroomsAdded: classroomsAddedCount };
}

// Get observation for student on date
export async function getObservationForStudentDate(studentId: string, date: string): Promise<DailyObservation | undefined> {
  return await db.observations.where({ studentId, date }).first();
}

// Save observation locally, then attempt cloud sync
export async function saveObservation(observation: DailyObservation): Promise<{ id: string; synced: boolean }> {
  const now = new Date().toISOString();
  const existing = await db.observations.where({ 
    studentId: observation.studentId, 
    date: observation.date 
  }).first();

  const id = existing?.id || observation.id || `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const obsToSave: DailyObservation = {
    ...observation,
    id,
    recordedAt: existing?.recordedAt || observation.recordedAt || now,
    updatedAt: now,
    synced: false
  };

  await db.observations.put(obsToSave);

  // Attempt background sync with Supabase
  const student = await db.students.get(observation.studentId);
  const synced = await syncObservationToCloud(obsToSave, student);
  if (synced) {
    await db.observations.update(id, { synced: true });
  }

  return { id, synced };
}
