const { createClient } = require('@libsql/client/web');

const url = 'https://pragathi-preschool-vijaya.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA4Njg2NDYsImlkIjoiMDFhMGY4MGYtMjUwMS03YTgwLWE0NzYtNzNmM2JiNzRkMjY3Iiwia2lkIjoiSXdkdmN2SUlFdlhocHlSWm91RmV2OUJZcDFmQnBBWVozb3MtM1U5anRDdyIsInJpZCI6IjhlYjRjZDRiLTJiOTAtNGU0Yy1iNGZlLWQyMTYwYmMwMGYzMSJ9.n4IHm_DuSKPwbcU3klkwCLCldXgEST9Y3OIkZ6BuDTvbaYU_42Z4WSuZ4mSe2nbqfH5MpDo7S8a0mk0A-3BaDQ';

const client = createClient({ url, authToken });

const staffList = [
  {
    id: 'staff_admin_vijaya',
    name: 'Vijaya Pathikonda',
    email: 'vijaya.pathikonda@gmail.com',
    role: 'Admin',
    assigned_classes: 'All Classes (*)',
  },
  {
    id: 'staff_1',
    name: 'Kavya Y',
    email: 'kavyay294@gmail.com',
    role: 'Admin',
    assigned_classes: 'All Classes (*)',
  },
  {
    id: 'staff_2',
    name: 'Shilpa S',
    email: 'shilpaclk1999@gmail.com',
    role: 'Admin',
    assigned_classes: 'All Classes (*), Playhome',
  },
  {
    id: 'staff_3',
    name: 'Aruna E',
    email: 'arupruthvi1807@gmail.com',
    role: 'Teacher',
    assigned_classes: 'UKG Jnana',
  },
  {
    id: 'staff_4',
    name: 'G Swathi',
    email: 'swathigg143@gmail.com',
    role: 'Teacher',
    assigned_classes: 'UKG Jnana, UKG Samriddhi',
  },
  {
    id: 'staff_5',
    name: 'Swetha R',
    email: 'shwethar012@gmail.com',
    role: 'Teacher',
    assigned_classes: 'Nursery Jnana',
  },
  {
    id: 'staff_6',
    name: 'Swathi CN',
    email: 'swathinaga2016@gmail.com',
    role: 'Teacher',
    assigned_classes: 'LKG Jnana',
  },
  {
    id: 'staff_7',
    name: 'Bhavana L',
    email: 'lbhavana317@gmail.com',
    role: 'Teacher',
    assigned_classes: 'LKG Jnana',
  },
  {
    id: 'staff_8',
    name: 'Shilpa T',
    email: 'shilpavaru10@gmail.com',
    role: 'Teacher',
    assigned_classes: 'LKG Samriddhi',
  },
  {
    id: 'staff_9',
    name: 'Nirmala',
    email: 'santhoshclk2022@gmail.com',
    role: 'Teacher',
    assigned_classes: 'UKG Samriddhi',
  },
  {
    id: 'staff_10',
    name: 'Tejashree',
    email: 'tejashreekiran21@gmail.com',
    role: 'Teacher',
    assigned_classes: 'Nursery Satya',
  },
  {
    id: 'staff_11',
    name: 'Anusha',
    email: 'anushashamanth09@gmail.com',
    role: 'Teacher',
    assigned_classes: 'Nursery Shourya',
  },
  {
    id: 'staff_12',
    name: 'Ashwini KJ',
    email: 'ashwinicharan54@gmail.com',
    role: 'Teacher',
    assigned_classes: 'UKG Shourya',
  },
  {
    id: 'staff_13',
    name: 'Manasa T',
    email: 'manasamanu399@gmail.com',
    role: 'Teacher',
    assigned_classes: 'Playhome',
  },
  {
    id: 'staff_14',
    name: 'Shruthi T',
    email: 'shruthimanju070@gmail.com',
    role: 'Teacher',
    assigned_classes: 'UKG Satya',
  },
  {
    id: 'staff_15',
    name: 'Lakshmi Devi',
    email: 'lakshmiragavendra1990@gmail.com',
    role: 'Teacher',
    assigned_classes: 'LKG Satya',
  },
  {
    id: 'staff_16',
    name: 'Manasa M',
    email: 'manasasunil1998@gmail.com',
    role: 'Teacher',
    assigned_classes: 'LKG Shourya',
  },
];

async function run() {
  console.log('Creating staff table in Turso...');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      assigned_classes TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Seeding staff and admin members...');
  for (const s of staffList) {
    await client.execute({
      sql: `INSERT OR REPLACE INTO staff (id, name, email, role, assigned_classes) VALUES (?, ?, ?, ?, ?)`,
      args: [s.id, s.name, s.email, s.role, s.assigned_classes],
    });
  }

  const result = await client.execute('SELECT * FROM staff ORDER BY role ASC, name ASC');
  console.log(`Successfully added ${result.rows.length} staff members to Turso!`);
  console.log('Staff list preview:');
  result.rows.forEach(r => {
    console.log(`[${r.role}] ${r.name} (${r.email}) -> ${r.assigned_classes}`);
  });
}

run().catch(err => {
  console.error('Failed to create staff table:', err);
  process.exit(1);
});
