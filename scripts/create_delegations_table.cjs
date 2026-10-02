const { createClient } = require('@libsql/client/web');

const url = 'https://pragathi-preschool-vijaya.aws-ap-south-1.turso.io';
const authToken =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4Njg2NDYsImlkIjoiMDFhMGY4MGYtMjUwMS03YTgwLWE0NzYtNzNmM2JiNzRkMjY3Iiwia2lkIjoiSXdkdmN2SUlFdlhocHlSWm91RmV2OUJZcDFmQnBBWVozb3MtM1U5anRDdyIsInJpZCI6IjhlYjRjZDRiLTJiOTAtNGU0Yy1iNGZlLWQyMTYwYmMwMGYzMSJ9.n4IHm_DuSKPwbcU3klkwCLCldXgEST9Y3OIkZ6BuDTvbaYU_42Z4WSuZ4mSe2nbqfH5MpDo7S8a0mk0A-3BaDQ';

const client = createClient({ url, authToken });

async function run() {
  console.log('Creating teacher_delegations table in Turso...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS teacher_delegations (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      classroom_id TEXT NOT NULL,
      classroom_name TEXT NOT NULL,
      absent_teacher_name TEXT NOT NULL,
      absent_teacher_email TEXT,
      substitute_teacher_id TEXT NOT NULL,
      substitute_teacher_name TEXT NOT NULL,
      substitute_teacher_email TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_delegations_date_sub ON teacher_delegations(date, substitute_teacher_email)
  `);

  console.log('teacher_delegations table and index created successfully!');
}

run().catch((err) => {
  console.error('Error creating table:', err);
  process.exit(1);
});
