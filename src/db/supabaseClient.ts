import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DailyObservation, Student, Classroom } from '../types/observation';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ctounkidbhnfrcrjnmmu.supabase.co';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const storedUrl = localStorage.getItem('supabase_url') || envUrl;
  const storedKey = localStorage.getItem('supabase_anon_key') || envKey;
  return { url: storedUrl, key: storedKey };
}

export function saveSupabaseCredentials(url: string, key: string) {
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_anon_key', key.trim());
  supabaseInstance = null; // reset client
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, key } = getSupabaseCredentials();
  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to initialize Supabase client', e);
      return null;
    }
  }
  return null;
}

export const SUPABASE_SETUP_SQL = `-- Run this in your Supabase Project -> SQL Editor
-- 1. Create Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age_group TEXT,
  teacher_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  classroom_id TEXT REFERENCES classrooms(id) ON DELETE SET NULL,
  classroom_name TEXT,
  photo_url TEXT,
  avatar_color TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Daily Observations Table
CREATE TABLE IF NOT EXISTS daily_observations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT TRUE,
  engagement TEXT,
  participation TEXT,
  following TEXT,
  thinking TEXT[],
  social TEXT[],
  state TEXT[],
  interest TEXT,
  interest_detail TEXT,
  additional_observation TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Indexes for lightning fast queries across 250+ students
CREATE INDEX IF NOT EXISTS idx_obs_date ON daily_observations(date);
CREATE INDEX IF NOT EXISTS idx_obs_student ON daily_observations(student_id);
CREATE INDEX IF NOT EXISTS idx_students_classroom ON students(classroom_id);

-- Enable public read/write for free preschool tier (or configure custom auth)
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to classrooms" ON classrooms FOR ALL USING (true);
CREATE POLICY "Allow public access to students" ON students FOR ALL USING (true);
CREATE POLICY "Allow public access to observations" ON daily_observations FOR ALL USING (true);
`;

// Sync observation to Supabase if client is active
export async function syncObservationToCloud(
  obs: DailyObservation,
  student?: Student
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // 1. Ensure student exists in cloud DB to satisfy foreign key constraint
    if (student) {
      await supabase.from('students').upsert({
        id: student.id,
        name: student.name,
        classroom_id: student.classroomId || null,
        classroom_name: student.classroomName || null,
        avatar_color: student.avatarColor || null,
        notes: student.notes || null,
        active: student.active ?? true,
      }, { onConflict: 'id' });
    }

    // 2. Upsert daily observation
    const { error } = await supabase.from('daily_observations').upsert({
      id: obs.id,
      student_id: obs.studentId,
      date: obs.date,
      present: obs.present,
      engagement: obs.engagement,
      participation: obs.participation,
      following: obs.following,
      thinking: obs.thinking || [],
      social: obs.social || [],
      state: obs.state || [],
      interest: obs.interest,
      interest_detail: obs.interestDetail,
      additional_observation: obs.additionalObservation,
      recorded_at: obs.recordedAt,
      updated_at: obs.updatedAt
    }, { onConflict: 'student_id, date' });

    if (error) {
      console.error('Supabase sync error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error during Supabase sync:', err);
    return false;
  }
}

// Sync entire roster (classrooms and students) to Supabase
export async function syncRosterToCloud(
  classrooms: Classroom[],
  students: Student[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, count: 0, error: 'Supabase client not connected.' };

  try {
    // 1. Upsert classrooms
    if (classrooms.length > 0) {
      const classRows = classrooms.map((c) => ({
        id: c.id,
        name: c.name,
        age_group: c.ageGroup,
        teacher_name: c.teacherName
      }));
      const { error: cErr } = await supabase.from('classrooms').upsert(classRows, { onConflict: 'id' });
      if (cErr) console.warn('Classroom sync warning:', cErr);
    }

    // 2. Upsert students
    if (students.length > 0) {
      const studentRows = students.map((s) => ({
        id: s.id,
        name: s.name,
        classroom_id: s.classroomId || null,
        classroom_name: s.classroomName || null,
        avatar_color: s.avatarColor || null,
        notes: s.notes || null,
        active: s.active ?? true,
      }));
      const { error: sErr } = await supabase.from('students').upsert(studentRows, { onConflict: 'id' });
      if (sErr) throw sErr;
    }

    return { success: true, count: students.length };
  } catch (err: any) {
    console.error('Bulk roster sync error:', err);
    return { success: false, count: 0, error: err.message || 'Failed to sync roster.' };
  }
}

// Test live connection to Supabase and report table status
export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; obsCount?: number }> {
  let client: SupabaseClient | null = null;
  if (url && key) {
    try {
      client = createClient(url, key);
    } catch (e: any) {
      return { success: false, message: `Invalid Supabase URL or Key: ${e.message}` };
    }
  } else {
    client = getSupabase();
  }

  if (!client) {
    return { success: false, message: 'Please enter both Supabase Project URL and Anon Public Key.' };
  }

  try {
    const { error, count } = await client
      .from('daily_observations')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return { success: false, message: `Cloud error: ${error.message}. (Did you run the SQL script in SQL Editor?)` };
    }

    return { 
      success: true, 
      message: `Connected successfully to Supabase! Found ${count ?? 0} observation records in the cloud database.`,
      obsCount: count ?? 0
    };
  } catch (err: any) {
    return { success: false, message: `Network connection failed: ${err.message || 'Cannot reach Supabase'}` };
  }
}
