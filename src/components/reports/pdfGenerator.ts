import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyObservation, Student } from '../../types/observation';

export function generateDailyObservationPDF(
  student: Student,
  observation: DailyObservation,
  schoolName: string = 'Pragathi Vidyalaya School',
  classroomName: string = 'Nursery Jnana'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Primary Theme Colors
  const primaryColor = [79, 70, 229]; // Indigo #4f46e5
  const slateDark = [30, 41, 59];
  const slateMuted = [100, 116, 139];

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 26, 'F');

  // School Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(schoolName, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`V1 – DAILY CHILD OBSERVATION REPORT`, 14, 19);

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 32, 182, 22, 3, 3, 'FD');

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Child: ${student.name}`, 18, 41);
  doc.text(`Date: ${observation.date}`, 105, 41);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Class: ${classroomName || student.classroomName || 'Preschool'}`, 18, 49);
  doc.text(`Attendance: ${observation.present ? 'Present' : 'Absent'}`, 105, 49);

  if (!observation.present) {
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Child was marked Absent on this date.', 14, 70);
    doc.save(`${student.name.replace(/\s+/g, '_')}_Observation_${observation.date}.pdf`);
    return;
  }

  // Questionnaire Table
  const tableRows = [
    [
      '1. ENGAGEMENT / ATTENTION',
      observation.engagement || 'Not recorded'
    ],
    [
      '2. PARTICIPATION',
      observation.participation || 'Not recorded'
    ],
    [
      '3. FOLLOWING / RESPONSE',
      observation.following || 'Not recorded'
    ],
    [
      '4. THINKING / EXPLORING',
      (observation.thinking && observation.thinking.length > 0)
        ? observation.thinking.join(', ')
        : 'Not recorded'
    ],
    [
      '5. SOCIAL / COMMUNICATION',
      (observation.social && observation.social.length > 0)
        ? observation.social.join(', ')
        : 'Not recorded'
    ],
    [
      '6. STATE / DISPOSITION TODAY',
      (observation.state && observation.state.length > 0)
        ? observation.state.join(', ')
        : 'Not recorded'
    ],
    [
      '7. INTEREST TODAY',
      observation.interest
        ? `${observation.interest}${observation.interestDetail ? `\n(In: ${observation.interestDetail})` : ''}`
        : 'Not recorded'
    ],
    [
      'ADDITIONAL OBSERVATION\n(Worth Remembering)',
      observation.additionalObservation || 'None noted'
    ]
  ];

  autoTable(doc, {
    startY: 60,
    head: [['Observation Area', 'Daily Observation Notes']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9.5,
      textColor: [30, 41, 59],
      cellPadding: 4.5
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 117 }
    }
  });

  // Footer / Signatures
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Teacher Signature: _______________________', 14, pageHeight - 16);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 145, pageHeight - 16);

  // Save the PDF
  const sanitizedName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${sanitizedName}_Observation_${observation.date}.pdf`);
}
