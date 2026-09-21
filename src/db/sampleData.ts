import { Student, Classroom } from '../types/observation';

export const REAL_CLASSROOMS: Classroom[] = [
  { id: 'c_jnana', name: 'Nursery Jnana', ageGroup: '3 – 4 Years', teacherName: 'Class Teacher' },
  { id: 'c_satya', name: 'Nursery Satya', ageGroup: '3 – 4 Years', teacherName: 'Class Teacher' },
  { id: 'c_shaurya', name: 'Nursery Shaurya', ageGroup: '3 – 4 Years', teacherName: 'Class Teacher' },
];

export const REAL_STUDENTS: Student[] = [
  // Nursery Jnana (6 students)
  { id: 'std_jnana_1', name: 'Charvik', classroomId: 'c_jnana', classroomName: 'Nursery Jnana', avatarColor: 'bg-indigo-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_jnana_2', name: 'Ghaziya Anam I', classroomId: 'c_jnana', classroomName: 'Nursery Jnana', avatarColor: 'bg-emerald-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_jnana_3', name: 'Lishika', classroomId: 'c_jnana', classroomName: 'Nursery Jnana', avatarColor: 'bg-rose-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_jnana_4', name: 'Preritha', classroomId: 'c_jnana', classroomName: 'Nursery Jnana', avatarColor: 'bg-amber-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_jnana_5', name: 'Sushrut', classroomId: 'c_jnana', classroomName: 'Nursery Jnana', avatarColor: 'bg-blue-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_jnana_6', name: 'Thanvitha', classroomId: 'c_jnana', classroomName: 'Nursery Jnana', avatarColor: 'bg-violet-600', active: true, createdAt: '2026-09-01T08:00:00Z' },

  // Nursery Satya (6 students)
  { id: 'std_satya_1', name: 'Gharshith gurram', classroomId: 'c_satya', classroomName: 'Nursery Satya', avatarColor: 'bg-teal-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_satya_2', name: 'Sahasra siri', classroomId: 'c_satya', classroomName: 'Nursery Satya', avatarColor: 'bg-purple-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_satya_3', name: 'Prudvi raj', classroomId: 'c_satya', classroomName: 'Nursery Satya', avatarColor: 'bg-cyan-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_satya_4', name: 'Aishaani', classroomId: 'c_satya', classroomName: 'Nursery Satya', avatarColor: 'bg-pink-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_satya_5', name: 'Gavin N Krusshna', classroomId: 'c_satya', classroomName: 'Nursery Satya', avatarColor: 'bg-orange-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_satya_6', name: 'Avyaan', classroomId: 'c_satya', classroomName: 'Nursery Satya', avatarColor: 'bg-indigo-600', active: true, createdAt: '2026-09-01T08:00:00Z' },

  // Nursery Shaurya (6 students)
  { id: 'std_shaurya_1', name: 'Haripriya', classroomId: 'c_shaurya', classroomName: 'Nursery Shaurya', avatarColor: 'bg-rose-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_shaurya_2', name: 'Utsav P Roy', classroomId: 'c_shaurya', classroomName: 'Nursery Shaurya', avatarColor: 'bg-blue-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_shaurya_3', name: 'Krishiv', classroomId: 'c_shaurya', classroomName: 'Nursery Shaurya', avatarColor: 'bg-emerald-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_shaurya_4', name: 'M Shravan', classroomId: 'c_shaurya', classroomName: 'Nursery Shaurya', avatarColor: 'bg-amber-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_shaurya_5', name: 'Kridha', classroomId: 'c_shaurya', classroomName: 'Nursery Shaurya', avatarColor: 'bg-violet-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
  { id: 'std_shaurya_6', name: 'Yukti', classroomId: 'c_shaurya', classroomName: 'Nursery Shaurya', avatarColor: 'bg-teal-600', active: true, createdAt: '2026-09-01T08:00:00Z' },
];

export const SAMPLE_CLASSROOMS = REAL_CLASSROOMS;
export const INITIAL_STUDENTS = REAL_STUDENTS;
