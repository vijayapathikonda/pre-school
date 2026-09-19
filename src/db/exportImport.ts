import { db } from './schema';
import { DailyObservation, Student } from '../types/observation';

export async function exportAllDataAsJSON(): Promise<string> {
  const students = await db.students.toArray();
  const observations = await db.observations.toArray();
  const settings = await db.settings.toArray();

  const backup = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    students,
    observations,
    settings
  };

  return JSON.stringify(backup, null, 2);
}

export async function importDataFromJSON(jsonString: string): Promise<{ studentsCount: number; obsCount: number }> {
  const data = JSON.parse(jsonString);
  if (!data.students || !Array.isArray(data.students)) {
    throw new Error('Invalid backup file format.');
  }

  if (data.students.length > 0) {
    await db.students.bulkPut(data.students);
  }

  if (data.observations && Array.isArray(data.observations) && data.observations.length > 0) {
    await db.observations.bulkPut(data.observations);
  }

  return {
    studentsCount: data.students.length,
    obsCount: data.observations ? data.observations.length : 0
  };
}

export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportObservationsToCSV(date?: string): Promise<string> {
  let observations: DailyObservation[];
  if (date) {
    observations = await db.observations.where('date').equals(date).toArray();
  } else {
    observations = await db.observations.toArray();
  }

  const students = await db.students.toArray();
  const studentMap = new Map<string, Student>();
  students.forEach(s => studentMap.set(s.id, s));

  const headers = [
    'Date',
    'Student Name',
    'Classroom',
    'Present',
    '1. Engagement/Attention',
    '2. Participation',
    '3. Following/Response',
    '4. Thinking/Exploring',
    '5. Social/Communication',
    '6. State/Disposition',
    '7. Interest Today',
    'Interest Detail',
    'Additional Observations',
    'Recorded At'
  ];

  const rows = observations.map(obs => {
    const student = studentMap.get(obs.studentId);
    const escapeCsv = (val?: string | null) => `"${(val || '').replace(/"/g, '""')}"`;
    const arrayJoin = (arr?: string[]) => `"${(arr || []).join('; ').replace(/"/g, '""')}"`;

    return [
      obs.date,
      escapeCsv(student ? student.name : obs.studentId),
      escapeCsv(student?.classroomName || ''),
      obs.present ? 'Yes' : 'No',
      escapeCsv(obs.engagement),
      escapeCsv(obs.participation),
      escapeCsv(obs.following),
      arrayJoin(obs.thinking),
      arrayJoin(obs.social),
      arrayJoin(obs.state),
      escapeCsv(obs.interest),
      escapeCsv(obs.interestDetail),
      escapeCsv(obs.additionalObservation),
      obs.recordedAt
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
