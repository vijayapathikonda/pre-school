import Dexie, { Table } from 'dexie';
import { Student, DailyObservation, Classroom } from '../types/observation';
import { SAMPLE_CLASSROOMS, INITIAL_STUDENTS, generateFullSchoolStudents } from './sampleData';
import { syncObservationToCloud } from './supabaseClient';

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
    this.version(2).stores({
      classrooms: 'id, name, ageGroup',
      students: 'id, name, classroomId, classroomName, active, createdAt',
      observations: '++id, studentId, date, [studentId+date], present, recordedAt',
      settings: 'key'
    });
  }
}

export const db = new PreschoolDatabase();

// Seed initial classrooms and students if database is empty
export async function initializeDatabase(): Promise<void> {
  const classroomCount = await db.classrooms.count();
  if (classroomCount === 0) {
    await db.classrooms.bulkAdd(SAMPLE_CLASSROOMS);
  }

  const studentCount = await db.students.count();
  if (studentCount === 0) {
    await db.students.bulkAdd(INITIAL_STUDENTS);
  }

  const schoolNameSetting = await db.settings.get('schoolName');
  if (!schoolNameSetting) {
    await db.settings.put({ key: 'schoolName', value: 'Sunshine Preschool & Academy' });
    await db.settings.put({ key: 'teacherName', value: 'Lead Teacher' });
    await db.settings.put({ key: 'activeClassroomId', value: SAMPLE_CLASSROOMS[0].id });
  }
}

// Generate 250 students for testing school-scale workflow
export async function loadFullSchoolRoster(): Promise<number> {
  const fullRoster = generateFullSchoolStudents(250);
  await db.students.clear();
  await db.students.bulkAdd(fullRoster);
  return fullRoster.length;
}

// Reset to standard sample roster
export async function resetToSampleRoster(): Promise<void> {
  await db.students.clear();
  await db.students.bulkAdd(INITIAL_STUDENTS);
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

  let id = existing?.id || observation.id || `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
