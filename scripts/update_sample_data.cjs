const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/db/schoolRosterData.json'), 'utf8'));

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

const classroomsTs = data.classrooms.map(c => {
  return `  { id: ${JSON.stringify(c.id)}, name: ${JSON.stringify(c.name)}, ageGroup: ${JSON.stringify(c.grade)}, teacherName: ${JSON.stringify(c.teacher_name)} },`;
}).join('\n');

const studentsTs = data.students.map((s, idx) => {
  const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const cName = data.classrooms.find(c => c.id === s.classroom_id)?.name || s.classroom_id;
  return `  { id: ${JSON.stringify(s.id)}, name: ${JSON.stringify(s.name)}, classroomId: ${JSON.stringify(s.classroom_id)}, classroomName: ${JSON.stringify(cName)}, avatarColor: ${JSON.stringify(color)}, active: true, createdAt: '2026-09-01T08:00:00Z' },`;
}).join('\n');

const content = `import { Student, Classroom } from '../types/observation';

export const REAL_CLASSROOMS: Classroom[] = [
${classroomsTs}
];

export const REAL_STUDENTS: Student[] = [
${studentsTs}
];

export const SAMPLE_CLASSROOMS = REAL_CLASSROOMS;
export const INITIAL_STUDENTS = REAL_STUDENTS;
`;

fs.writeFileSync(path.join(__dirname, '../src/db/sampleData.ts'), content, 'utf8');
console.log('Successfully updated src/db/sampleData.ts with all 12 classrooms and 266 students.');
