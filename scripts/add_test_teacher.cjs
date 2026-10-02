const { createClient } = require('@libsql/client/web');

const url = 'https://pragathi-preschool-vijaya.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4Njg2NDYsImlkIjoiMDFhMGY4MGYtMjUwMS03YTgwLWE0NzYtNzNmM2JiNzRkMjY3Iiwia2lkIjoiSXdkdmN2SUlFdlhocHlSWm91RmV2OUJZcDFmQnBBWVozb3MtM1U5anRDdyIsInJpZCI6IjhlYjRjZDRiLTJiOTAtNGU0Yy1iNGZlLWQyMTYwYmMwMGYzMSJ9.n4IHm_DuSKPwbcU3klkwCLCldXgEST9Y3OIkZ6BuDTvbaYU_42Z4WSuZ4mSe2nbqfH5MpDo7S8a0mk0A-3BaDQ';

const client = createClient({ url, authToken });

async function addTestTeacher() {
  console.log('Adding test teacher vijaya010590@gmail.com to Turso staff table...');
  await client.execute({
    sql: `INSERT OR REPLACE INTO staff (id, name, email, role, assigned_classes) VALUES (?, ?, ?, ?, ?)`,
    args: ['staff_teacher_vijaya_test', 'Vijaya (Test Teacher)', 'vijaya010590@gmail.com', 'Teacher', 'UKG Jnana'],
  });

  const res = await client.execute({
    sql: 'SELECT * FROM staff WHERE email = ?',
    args: ['vijaya010590@gmail.com'],
  });

  console.log('Verified test teacher in Turso:', res.rows[0]);
}

addTestTeacher().catch(console.error);
