const { createClient } = require('@libsql/client/web');

const url = 'https://pragathi-preschool-vijaya.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4Njg2NDYsImlkIjoiMDFhMGY4MGYtMjUwMS03YTgwLWE0NzYtNzNmM2JiNzRkMjY3Iiwia2lkIjoiSXdkdmN2SUlFdlhocHlSWm91RmV2OUJZcDFmQnBBWVozb3MtM1U5anRDdyIsInJpZCI6IjhlYjRjZDRiLTJiOTAtNGU0Yy1iNGZlLWQyMTYwYmMwMGYzMSJ9.n4IHm_DuSKPwbcU3klkwCLCldXgEST9Y3OIkZ6BuDTvbaYU_42Z4WSuZ4mSe2nbqfH5MpDo7S8a0mk0A-3BaDQ';

const client = createClient({ url, authToken });

async function setup() {
  console.log('Ensuring tables in Turso...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      section TEXT NOT NULL,
      academic_year TEXT DEFAULT '2026-2027',
      teacher_name TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      classroom_id TEXT NOT NULL,
      roll_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      parent_phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(classroom_id) REFERENCES classrooms(id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS daily_observations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      present INTEGER NOT NULL DEFAULT 1,
      engagement TEXT,
      participation TEXT,
      following TEXT,
      thinking TEXT,
      social TEXT,
      state TEXT,
      interest TEXT,
      interest_detail TEXT,
      additional_observation TEXT,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date)
    )
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_obs_date ON daily_observations(date)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_obs_student ON daily_observations(student_id)`);

  console.log('Turso tables and indexes verified successfully!');
}

setup().catch(console.error);
