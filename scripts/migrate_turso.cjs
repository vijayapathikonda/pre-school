const { createClient } = require('@libsql/client/web');
const fs = require('fs');
const path = require('path');

const url = 'https://pragathi-preschool-vijaya.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4Njg2NDYsImlkIjoiMDFhMGY4MGYtMjUwMS03YTgwLWE0NzYtNzNmM2JiNzRkMjY3Iiwia2lkIjoiSXdkdmN2SUlFdlhocHlSWm91RmV2OUJZcDFmQnBBWVozb3MtM1U5anRDdyIsInJpZCI6IjhlYjRjZDRiLTJiOTAtNGU0Yy1iNGZlLWQyMTYwYmMwMGYzMSJ9.n4IHm_DuSKPwbcU3klkwCLCldXgEST9Y3OIkZ6BuDTvbaYU_42Z4WSuZ4mSe2nbqfH5MpDo7S8a0mk0A-3BaDQ';

const client = createClient({ url, authToken });

async function init() {
  console.log('Testing Turso connection...');
  const res = await client.execute('SELECT 1 as connected');
  console.log('Connection test result:', res.rows);

  console.log('Creating tables in Turso...');
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
    CREATE TABLE IF NOT EXISTS observations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      classroom_id TEXT NOT NULL,
      date TEXT NOT NULL,
      physical_mood TEXT,
      meal_status TEXT,
      nap_duration_minutes INTEGER,
      activities TEXT,
      learning_progress TEXT,
      teacher_notes TEXT,
      attendance_status TEXT DEFAULT 'present',
      sync_status TEXT DEFAULT 'synced',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date)
    )
  `);

  console.log('Seeding classrooms and students...');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/db/schoolRosterData.json'), 'utf8'));

  // Insert classrooms
  for (const c of data.classrooms) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO classrooms (id, name, grade, section, academic_year, teacher_name) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.name, c.grade, c.section, c.academic_year, c.teacher_name]
    });
  }
  console.log(`Seeded ${data.classrooms.length} classrooms.`);

  // Insert students in batches
  const batchSize = 50;
  for (let i = 0; i < data.students.length; i += batchSize) {
    const chunk = data.students.slice(i, i + batchSize);
    const statements = chunk.map(s => ({
      sql: `INSERT OR REPLACE INTO students (id, classroom_id, roll_number, name, parent_phone) VALUES (?, ?, ?, ?, ?)`,
      args: [s.id, s.classroom_id, s.roll_number, s.name, s.parent_phone || '']
    }));
    await client.batch(statements, 'write');
  }
  console.log(`Seeded ${data.students.length} students.`);

  // Verify counts
  const cCount = await client.execute('SELECT COUNT(*) as count FROM classrooms');
  const sCount = await client.execute('SELECT COUNT(*) as count FROM students');
  console.log('Verification:');
  console.log('- Classrooms in Turso:', cCount.rows[0].count);
  console.log('- Students in Turso:', sCount.rows[0].count);
}

init().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
