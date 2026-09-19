import { Student, Classroom } from '../types/observation';

export const SAMPLE_CLASSROOMS: Classroom[] = [
  { id: 'c1', name: 'Sunflowers (Pre-K 1)', ageGroup: '3 – 4 Years', teacherName: 'Ms. Sarah Jenkins' },
  { id: 'c2', name: 'Bluebells (Pre-K 2)', ageGroup: '4 – 5 Years', teacherName: 'Mrs. Priya Sharma' },
  { id: 'c3', name: 'Little Acorns (Toddlers)', ageGroup: '2 – 3 Years', teacherName: 'Ms. Emily Davis' },
  { id: 'c4', name: 'Kindergarten Gold', ageGroup: '5 – 6 Years', teacherName: 'Mr. David Miller' },
  { id: 'c5', name: 'Kindergarten Silver', ageGroup: '5 – 6 Years', teacherName: 'Mrs. Anjali Nair' },
];

const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-teal-600',
];

export const INITIAL_STUDENTS: Student[] = [
  // Sunflowers (Pre-K 1)
  { id: 's1', name: 'Aarav Patel', classroomId: 'c1', classroomName: 'Sunflowers (Pre-K 1)', avatarColor: 'bg-indigo-600', notes: 'Enjoys building blocks and story circles', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's2', name: 'Sophia Chen', classroomId: 'c1', classroomName: 'Sunflowers (Pre-K 1)', avatarColor: 'bg-emerald-600', notes: 'Expressive speaker, loves watercolor art', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's3', name: 'Liam Johnson', classroomId: 'c1', classroomName: 'Sunflowers (Pre-K 1)', avatarColor: 'bg-amber-600', notes: 'Curious explorer, active during outdoor play', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's4', name: 'Ananya Sharma', classroomId: 'c1', classroomName: 'Sunflowers (Pre-K 1)', avatarColor: 'bg-rose-600', notes: 'Helpful and cooperative with peers', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's5', name: 'Ethan Williams', classroomId: 'c1', classroomName: 'Sunflowers (Pre-K 1)', avatarColor: 'bg-blue-600', notes: 'Gentle and observant; loves animal books', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's6', name: 'Zara Khan', classroomId: 'c1', classroomName: 'Sunflowers (Pre-K 1)', avatarColor: 'bg-violet-600', notes: 'Enjoys nursery rhymes and dance rhythms', active: true, createdAt: '2026-09-01T08:00:00Z' },

  // Bluebells (Pre-K 2)
  { id: 's7', name: 'Lucas Miller', classroomId: 'c2', classroomName: 'Bluebells (Pre-K 2)', avatarColor: 'bg-teal-600', notes: 'Loves puzzle boards and counting sticks', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's8', name: 'Mia Rodriguez', classroomId: 'c2', classroomName: 'Bluebells (Pre-K 2)', avatarColor: 'bg-rose-600', notes: 'Enthusiastic leader in group play', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's9', name: 'Noah Gupta', classroomId: 'c2', classroomName: 'Bluebells (Pre-K 2)', avatarColor: 'bg-cyan-600', notes: 'Quiet and focused during sensory activities', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's10', name: 'Emma Wilson', classroomId: 'c2', classroomName: 'Bluebells (Pre-K 2)', avatarColor: 'bg-amber-600', notes: 'High language skills, asks thoughtful questions', active: true, createdAt: '2026-09-01T08:00:00Z' },

  // Little Acorns (Toddlers)
  { id: 's11', name: 'Oliver Taylor', classroomId: 'c3', classroomName: 'Little Acorns (Toddlers)', avatarColor: 'bg-indigo-600', notes: 'Enjoys stacking rings and musical shakers', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 's12', name: 'Avani Reddy', classroomId: 'c3', classroomName: 'Little Acorns (Toddlers)', avatarColor: 'bg-emerald-600', notes: 'Smiles often; enjoys roll-the-ball game', active: true, createdAt: '2026-09-01T08:00:00Z' },
];

// Helper to generate up to 250 realistic student profiles across classrooms
export function generateFullSchoolStudents(count: number = 250): Student[] {
  const firstNames = [
    'Aarav', 'Sophia', 'Liam', 'Ananya', 'Ethan', 'Zara', 'Lucas', 'Mia', 'Noah', 'Emma',
    'Rohan', 'Olivia', 'Vihaan', 'Ava', 'Mason', 'Ishita', 'Logan', 'Isabella', 'Reyansh', 'Charlotte',
    'Leo', 'Amelia', 'Aditya', 'Harper', 'James', 'Kavya', 'Benjamin', 'Evelyn', 'Kabir', 'Abigail',
    'Alexander', 'Emily', 'Vivaan', 'Elizabeth', 'Daniel', 'Diya', 'Henry', 'Mila', 'Sai', 'Ella'
  ];
  const lastNames = [
    'Patel', 'Chen', 'Johnson', 'Sharma', 'Williams', 'Khan', 'Miller', 'Rodriguez', 'Gupta', 'Wilson',
    'Taylor', 'Reddy', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia',
    'Iyer', 'Martinez', 'Robinson', 'Clark', 'Verma', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen'
  ];

  const students: Student[] = [];
  for (let i = 0; i < count; i++) {
    const classroom = SAMPLE_CLASSROOMS[i % SAMPLE_CLASSROOMS.length];
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];

    students.push({
      id: `std_${i + 1}`,
      name: `${firstName} ${lastName}${i >= firstNames.length ? ` ${Math.floor(i / firstNames.length) + 1}` : ''}`,
      classroomId: classroom.id,
      classroomName: classroom.name,
      avatarColor: color,
      notes: `Enrolled in ${classroom.name}`,
      active: true,
      createdAt: '2026-09-01T08:00:00Z',
    });
  }
  return students;
}
