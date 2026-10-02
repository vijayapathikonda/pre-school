import { createClient, Client } from '@libsql/client/web';
import { DailyObservation, Student, Classroom } from '../types/observation';
import { TeacherProfile } from '../auth/teacherWhitelist';

let tursoInstance: Client | null = null;

export const DEFAULT_TURSO_URL = 'https://pragathi-preschool-vijaya.aws-ap-south-1.turso.io';
export const DEFAULT_TURSO_AUTH_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4Njg2NDYsImlkIjoiMDFhMGY4MGYtMjUwMS03YTgwLWE0NzYtNzNmM2JiNzRkMjY3Iiwia2lkIjoiSXdkdmN2SUlFdlhocHlSWm91RmV2OUJZcDFmQnBBWVozb3MtM1U5anRDdyIsInJpZCI6IjhlYjRjZDRiLTJiOTAtNGU0Yy1iNGZlLWQyMTYwYmMwMGYzMSJ9.n4IHm_DuSKPwbcU3klkwCLCldXgEST9Y3OIkZ6BuDTvbaYU_42Z4WSuZ4mSe2nbqfH5MpDo7S8a0mk0A-3BaDQ';

export function getTursoCredentials(): { url: string; token: string } {
  const envUrl = (import.meta as any).env?.VITE_TURSO_DATABASE_URL || DEFAULT_TURSO_URL;
  const envToken = (import.meta as any).env?.VITE_TURSO_AUTH_TOKEN || DEFAULT_TURSO_AUTH_TOKEN;
  const storedUrl = localStorage.getItem('turso_url') || envUrl;
  const storedToken = localStorage.getItem('turso_token') || envToken;
  
  // Ensure http/https scheme for web client
  let cleanUrl = storedUrl.trim();
  if (cleanUrl.startsWith('libsql://')) {
    cleanUrl = cleanUrl.replace('libsql://', 'https://');
  }

  return { url: cleanUrl, token: storedToken.trim() };
}

export function saveTursoCredentials(url: string, token: string) {
  localStorage.setItem('turso_url', url.trim());
  localStorage.setItem('turso_token', token.trim());
  tursoInstance = null; // reset cached client
}

export function getTurso(): Client | null {
  if (tursoInstance) return tursoInstance;

  const { url, token } = getTursoCredentials();
  if (url && token) {
    try {
      tursoInstance = createClient({
        url,
        authToken: token,
      });
      return tursoInstance;
    } catch (e) {
      console.error('Failed to initialize Turso client', e);
      return null;
    }
  }
  return null;
}

export async function testTursoConnection(
  url?: string,
  token?: string
): Promise<{ success: boolean; message: string; obsCount?: number }> {
  try {
    let client: Client;
    if (url && token) {
      let cleanUrl = url.trim();
      if (cleanUrl.startsWith('libsql://')) cleanUrl = cleanUrl.replace('libsql://', 'https://');
      client = createClient({ url: cleanUrl, authToken: token.trim() });
    } else {
      const active = getTurso();
      if (!active) {
        return { success: false, message: 'Please enter both Turso Database URL and Auth Token.' };
      }
      client = active;
    }

    const testRes = await client.execute('SELECT COUNT(*) as count FROM daily_observations');
    const count = Number(testRes.rows[0]?.count ?? 0);

    return {
      success: true,
      message: `Connected successfully to Turso! Found ${count} observation records in the cloud database.`,
      obsCount: count,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Turso connection failed: ${err.message || 'Cannot reach Turso database'}`,
    };
  }
}

// -------------------------------------------------------------
// Mapping Helpers
// -------------------------------------------------------------

function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (Array.isArray(val)) return val as unknown as T;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function mapRowToObservation(row: any): DailyObservation {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    date: String(row.date),
    present: Boolean(row.present === 1 || row.present === true || row.present === '1'),
    engagement: row.engagement || undefined,
    participation: row.participation || undefined,
    following: row.following || undefined,
    thinking: safeJsonParse(row.thinking, []),
    social: safeJsonParse(row.social, []),
    state: safeJsonParse(row.state, []),
    interest: row.interest || undefined,
    interestDetail: row.interest_detail || undefined,
    additionalObservation: row.additional_observation || undefined,
    recordedAt: row.recorded_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    synced: true,
  };
}

export function mapRowToStudent(row: any): Student {
  return {
    id: String(row.id),
    name: String(row.name),
    classroomId: String(row.classroom_id || ''),
    classroomName: String(row.classroom_name || ''),
    photoUrl: row.photo_url || undefined,
    avatarColor: row.avatar_color || undefined,
    notes: row.notes || undefined,
    active: Boolean(row.active ?? true),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function mapRowToClassroom(row: any): Classroom {
  return {
    id: String(row.id),
    name: String(row.name),
    ageGroup: String(row.grade || row.age_group || 'Preschool'),
    teacherName: row.teacher_name || undefined,
  };
}

// -------------------------------------------------------------
// Cloud Data Pull & Synchronization Functions
// -------------------------------------------------------------

export async function syncObservationToCloud(
  obs: DailyObservation,
  student?: Student
): Promise<boolean> {
  const turso = getTurso();
  if (!turso) return false;

  try {
    // 1. Ensure student exists in cloud DB
    if (student) {
      await turso.execute({
        sql: `INSERT OR IGNORE INTO students (id, classroom_id, roll_number, name) VALUES (?, ?, ?, ?)`,
        args: [student.id, student.classroomId || '', 0, student.name],
      });
    }

    // 2. Upsert daily observation
    const obsId = obs.id || `obs_${obs.studentId}_${obs.date}`;
    await turso.execute({
      sql: `
        INSERT INTO daily_observations (
          id, student_id, date, present, engagement, participation,
          following, thinking, social, state, interest, interest_detail,
          additional_observation, recorded_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id, date) DO UPDATE SET
          present=excluded.present,
          engagement=excluded.engagement,
          participation=excluded.participation,
          following=excluded.following,
          thinking=excluded.thinking,
          social=excluded.social,
          state=excluded.state,
          interest=excluded.interest,
          interest_detail=excluded.interest_detail,
          additional_observation=excluded.additional_observation,
          updated_at=excluded.updated_at
      `,
      args: [
        obsId,
        obs.studentId,
        obs.date,
        obs.present ? 1 : 0,
        obs.engagement || null,
        obs.participation || null,
        obs.following || null,
        JSON.stringify(obs.thinking || []),
        JSON.stringify(obs.social || []),
        JSON.stringify(obs.state || []),
        obs.interest || null,
        obs.interestDetail || null,
        obs.additionalObservation || null,
        obs.recordedAt || new Date().toISOString(),
        obs.updatedAt || new Date().toISOString(),
      ],
    });

    return true;
  } catch (err) {
    console.error('Turso sync error:', err);
    return false;
  }
}

export async function fetchCloudObservations(date: string): Promise<DailyObservation[]> {
  const turso = getTurso();
  if (!turso) return [];

  try {
    const res = await turso.execute({
      sql: 'SELECT * FROM daily_observations WHERE date = ?',
      args: [date],
    });

    return res.rows.map(mapRowToObservation);
  } catch (err) {
    console.warn('Network error fetching cloud observations from Turso:', err);
    return [];
  }
}

export async function fetchStudentCloudHistory(studentId: string): Promise<DailyObservation[]> {
  const turso = getTurso();
  if (!turso) return [];

  try {
    const res = await turso.execute({
      sql: 'SELECT * FROM daily_observations WHERE student_id = ? ORDER BY date DESC',
      args: [studentId],
    });

    return res.rows.map(mapRowToObservation);
  } catch (err) {
    console.warn('Network error fetching student cloud history from Turso:', err);
    return [];
  }
}

export async function fetchCloudRoster(): Promise<{ classrooms: Classroom[]; students: Student[] } | null> {
  const turso = getTurso();
  if (!turso) return null;

  try {
    const [cRes, sRes] = await Promise.all([
      turso.execute('SELECT * FROM classrooms ORDER BY name'),
      turso.execute('SELECT * FROM students ORDER BY roll_number, name'),
    ]);

    const classrooms = cRes.rows.map(mapRowToClassroom);
    const students = sRes.rows.map(mapRowToStudent);

    if (classrooms.length > 0 || students.length > 0) {
      return { classrooms, students };
    }
    return null;
  } catch (err) {
    console.warn('Network error fetching cloud roster from Turso:', err);
    return null;
  }
}

export async function syncRosterToCloud(
  classrooms: Classroom[],
  students: Student[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const turso = getTurso();
  if (!turso) return { success: false, count: 0, error: 'Turso client not connected.' };

  try {
    const statements: any[] = [];

    for (const c of classrooms) {
      statements.push({
        sql: `INSERT OR REPLACE INTO classrooms (id, name, grade, section, teacher_name) VALUES (?, ?, ?, ?, ?)`,
        args: [c.id, c.name, c.ageGroup, c.name, c.teacherName || null],
      });
    }

    for (const s of students) {
      statements.push({
        sql: `INSERT OR REPLACE INTO students (id, classroom_id, roll_number, name) VALUES (?, ?, ?, ?)`,
        args: [s.id, s.classroomId, 0, s.name],
      });
    }

    await turso.batch(statements, 'write');
    return { success: true, count: students.length };
  } catch (err: any) {
    console.error('Bulk roster sync error:', err);
    return { success: false, count: 0, error: err.message || 'Failed to sync roster to Turso.' };
  }
}

// Polling subscription for Turso cloud observations
export function subscribeToCloudObservations(
  date: string,
  onUpdate: (obs: DailyObservation) => void
): () => void {
  let isMounted = true;
  let lastCheckedTime = new Date().toISOString();

  const pollInterval = setInterval(async () => {
    if (!isMounted) return;
    const turso = getTurso();
    if (!turso) return;

    try {
      const res = await turso.execute({
        sql: 'SELECT * FROM daily_observations WHERE date = ? AND updated_at > ?',
        args: [date, lastCheckedTime],
      });

      if (res.rows.length > 0) {
        lastCheckedTime = new Date().toISOString();
        res.rows.forEach((row) => {
          onUpdate(mapRowToObservation(row));
        });
      }
    } catch {
      // Ignore background polling errors silently
    }
  }, 10000); // Poll every 10 seconds

  return () => {
    isMounted = false;
    clearInterval(pollInterval);
  };
}

// -------------------------------------------------------------
// Dynamic Staff & Teacher Management Functions (Zero Code Change Onboarding)
// -------------------------------------------------------------

export interface StaffRecord {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher';
  assigned_classes: string;
  created_at?: string;
}

export async function fetchAllStaff(): Promise<StaffRecord[]> {
  const turso = getTurso();
  if (!turso) return [];

  try {
    const res = await turso.execute('SELECT * FROM staff ORDER BY role ASC, name ASC');
    return res.rows.map((r: any) => ({
      id: String(r.id),
      name: String(r.name),
      email: String(r.email),
      role: (String(r.role).toLowerCase() === 'admin' ? 'Admin' : 'Teacher') as 'Admin' | 'Teacher',
      assigned_classes: String(r.assigned_classes || ''),
      created_at: r.created_at ? String(r.created_at) : undefined,
    }));
  } catch (err) {
    console.error('Failed to fetch staff from Turso:', err);
    return [];
  }
}

export async function saveStaffToCloud(staff: {
  id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Teacher';
  assigned_classes: string;
}): Promise<{ success: boolean; error?: string }> {
  const turso = getTurso();
  if (!turso) return { success: false, error: 'Database client not connected.' };

  try {
    const staffId = staff.id || `staff_${Date.now()}`;
    await turso.execute({
      sql: `INSERT OR REPLACE INTO staff (id, name, email, role, assigned_classes) VALUES (?, ?, ?, ?, ?)`,
      args: [staffId, staff.name.trim(), staff.email.trim().toLowerCase(), staff.role, staff.assigned_classes.trim()],
    });
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save staff:', err);
    return { success: false, error: err.message || 'Failed to save staff record.' };
  }
}

export async function deleteStaffFromCloud(id: string): Promise<{ success: boolean; error?: string }> {
  const turso = getTurso();
  if (!turso) return { success: false, error: 'Database client not connected.' };

  try {
    await turso.execute({
      sql: `DELETE FROM staff WHERE id = ?`,
      args: [id],
    });
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete staff:', err);
    return { success: false, error: err.message || 'Failed to delete staff member.' };
  }
}

export async function fetchTeacherProfileFromTurso(
  email: string | null | undefined
): Promise<TeacherProfile | null> {
  if (!email) return null;
  const turso = getTurso();
  if (!turso) return null;

  try {
    const res = await turso.execute({
      sql: 'SELECT * FROM staff WHERE LOWER(email) = LOWER(?) LIMIT 1',
      args: [email.trim().toLowerCase()],
    });

    if (res.rows.length === 0) return null;
    const row: any = res.rows[0];
    const role: 'Admin' | 'Teacher' =
      String(row.role).toLowerCase() === 'admin' ? 'Admin' : 'Teacher';
    const assignedRaw = String(row.assigned_classes || '').trim();

    // Parse assigned classes
    let assignedClasses: string[] = [];
    if (role === 'Admin' || assignedRaw.includes('*') || assignedRaw.toLowerCase().includes('all classes')) {
      assignedClasses = ['*'];
    } else {
      // Split by comma
      const parts = assignedRaw.split(',').map((p) => p.trim());
      // Convert to clean classroom IDs (e.g. "UKG Jnana" -> "ukg_jnana")
      assignedClasses = parts.map((p) => {
        return p.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      }).filter(Boolean);

      if (assignedClasses.length === 0) {
        assignedClasses = ['*'];
      }
    }

    return {
      name: String(row.name),
      email: String(row.email).toLowerCase(),
      role,
      assignedClasses,
      defaultClassId: assignedClasses[0] !== '*' ? assignedClasses[0] : undefined,
    };
  } catch (err) {
    console.error('Error fetching teacher profile from Turso:', err);
    return null;
  }
}

