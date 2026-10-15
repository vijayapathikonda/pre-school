import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyObservation, Student } from '../../types/observation';
import { AIStudentInsight } from '../../utils/geminiInsights';
import schoolLogoImg from '../../assets/school_logo.png';

function loadHtmlImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        return resolve(null);
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

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

export async function generateAIInsightsPDF(
  insight: AIStudentInsight,
  schoolName: string = 'Pragathi Vidyalaya School'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const navyDark = [15, 23, 42]; // Slate-900 / Deep Navy
  const amberGold = [180, 83, 9]; // Warm Institutional Gold
  const slateDark = [30, 41, 59]; // Slate-800
  const slateMuted = [100, 116, 139]; // Slate-500

  // 1. Double Outer Certificate / Letterhead Page Border
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.3);
  doc.rect(8, 8, 194, 281);
  doc.setDrawColor(241, 245, 249); // Slate-100
  doc.setLineWidth(0.15);
  doc.rect(9.5, 9.5, 191, 278);

  // 2. School Crest / Emblem
  let logoLoaded = false;
  try {
    const logoImg = await loadHtmlImage(schoolLogoImg);
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', 14, 12, 19, 18);
      logoLoaded = true;
    }
  } catch (err) {
    console.warn('Could not load logo image for PDF:', err);
  }

  // Fallback vector crest if PNG fails or runs offline
  if (!logoLoaded) {
    doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
    doc.circle(23.5, 21, 9, 'F');
    doc.setDrawColor(amberGold[0], amberGold[1], amberGold[2]);
    doc.setLineWidth(0.5);
    doc.circle(23.5, 21, 8, 'D');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('PV', 23.5, 23.5, { align: 'center' });
  }

  // 3. School Letterhead Header Typography (Clean ASCII formatting)
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  const formattedSchoolName = schoolName.toLowerCase().includes('cbse')
    ? schoolName.toUpperCase()
    : `${schoolName.toUpperCase()} (CBSE)`;
  doc.text(formattedSchoolName, 36, 17.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.text('Main Campus / School (CBSE)', 36, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(71, 85, 105);
  doc.text('Address: SY.NO.203/4, Nagaramgere Road, Near Bhutappa Temple, Challakere, Karnataka - 577522', 36, 26.2);
  doc.text('Phone: +91 8660573737, +91 79966 22466', 36, 30.2);

  // 4. Dual Institutional Pinstripes
  doc.setDrawColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setLineWidth(0.6);
  doc.line(14, 33.5, 196, 33.5);

  doc.setDrawColor(217, 119, 6); // Gold pinstripe
  doc.setLineWidth(0.3);
  doc.line(14, 34.8, 196, 34.8);

  // 5. Official Report Title Ribbon
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, 38, 182, 7.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text('OFFICIAL STUDENT DEVELOPMENTAL PROGRESS REPORT', 105, 43, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Confidential Pedagogical Narrative & Individual Learning Evaluation Portfolio', 105, 48.5, { align: 'center' });

  // 6. Student Profile & Evaluation Memo Box (Balanced 2-Column Grid)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 51.5, 182, 22.5, 2, 2, 'FD');

  // Left Column: Student Identity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('STUDENT NAME:', 18, 57.5);
  doc.setFontSize(10);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(insight.studentName.toUpperCase(), 43, 57.5);

  doc.setFontSize(7.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('CLASS / SECTION:', 18, 64);
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(insight.classroomName, 43, 64);

  doc.setFontSize(7.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('ACADEMIC YEAR:', 18, 70);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('2026 – 2027', 43, 70);

  // Right Column: Assessment Details (Properly bounded, no overflow)
  doc.setFontSize(7.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('EVALUATION PERIOD:', 102, 57.5);
  doc.setFontSize(8.5);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(insight.periodLabel, 137, 57.5);

  doc.setFontSize(7.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('RECORDED DATES:', 102, 64);
  doc.setFontSize(8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(insight.dateRange, 137, 64);

  doc.setFontSize(7.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('ATTENDANCE TRACK:', 102, 70);
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105); // Emerald
  const attendancePct =
    insight.analyzedDaysCount > 0
      ? Math.round((insight.presentDaysCount / insight.analyzedDaysCount) * 100)
      : 100;
  doc.text(
    `${insight.presentDaysCount} Present / ${insight.analyzedDaysCount} Recorded Days (${attendancePct}%)`,
    137,
    70
  );

  // 7. Key Strengths & Milestones Banner (Collision Fixed with proper offset and maxWidth)
  let tableStartY = 76.5;

  if (insight.highlights && insight.highlights.length > 0) {
    doc.setFillColor(254, 243, 199); // Light Amber
    doc.setDrawColor(245, 158, 11); // Amber-500
    doc.setLineWidth(0.25);
    doc.roundedRect(14, 76.5, 182, 8, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(amberGold[0], amberGold[1], amberGold[2]);
    doc.text('KEY STRENGTHS:', 18, 81.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    const highlightsText = insight.highlights.join('   •   ');
    doc.text(highlightsText, 45, 81.8, { maxWidth: 146 });

    tableStartY = 87;
  }

  // 8. Developmental Narrative Table
  const tableRows = [
    ['I. EXECUTIVE DEVELOPMENTAL\nTRAJECTORY', insight.overallSummary],
    ['II. ACADEMIC & COGNITIVE\nLEARNING PATTERNS', insight.academicAndLearning],
    ['III. SOCIAL INTERACTION &\nPEER PARTICIPATION', insight.socialAndParticipation],
    ['IV. CLASSROOM DISPOSITION &\nEMOTIONAL WELLBEING', insight.moodAndDisposition],
    [
      'V. DEVELOPMENTAL ACTION\nPLAN & NEXT STEPS',
      (insight.recommendations || []).map((r, i) => `${i + 1}.  ${r}`).join('\n\n') ||
        'Continue positive encouragement, structured routines, and daily exploratory play.',
    ],
  ];

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14, bottom: 28 },
    head: [['Developmental Domain', 'Individualized Pedagogical Observations & Narrative Insights']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 8.2,
      textColor: [30, 41, 59],
      cellPadding: 3.8,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 23, 42] },
      1: { cellWidth: 136, fillColor: [255, 255, 255] },
    },
    didDrawPage: () => {
      // Draw outer decorative borders on all pages
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(8, 8, 194, 281);
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.rect(9.5, 9.5, 191, 278);
    },
  });

  // 9. Institutional Signatures & School Seal Footer
  const pageHeight = doc.internal.pageSize.height;
  const signatureY = pageHeight - 21;

  // Teacher signature line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(18, signatureY, 68, signatureY);
  doc.setFont('helvetica', 'bold');
  doc.text("Class Teacher's Signature", 43, signatureY + 4.5, { align: 'center' });

  // Official Stamp / Seal Box
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1, 1], 0);
  doc.roundedRect(88, signatureY - 7, 34, 14, 1.5, 1.5, 'D');
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('OFFICIAL SCHOOL', 105, signatureY - 2, { align: 'center' });
  doc.text('STAMP / SEAL', 105, signatureY + 2.5, { align: 'center' });

  // Principal signature line
  doc.setDrawColor(148, 163, 184);
  doc.line(142, signatureY, 192, signatureY);
  doc.text('Principal / Head of Institution', 167, signatureY + 4.5, { align: 'center' });

  // Bottom Institution & Developer Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Pragathi Vidyalaya School (CBSE)  •  Challakere, Karnataka  •  Confidential Student Growth Record',
    105,
    pageHeight - 7,
    { align: 'center' }
  );

  doc.setFontSize(6.2);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Application developed by Bhuvi Technologies  •  Contact +91-7353432669 for App Development',
    105,
    pageHeight - 3.8,
    { align: 'center' }
  );

  const sanitizedName = insight.studentName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${sanitizedName}_Progress_Evaluation.pdf`);
}

export function generateUserManualPDF(schoolName: string = 'Pragathi Vidyalaya School') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [79, 70, 229]; // Indigo #4f46e5
  const slateDark = [30, 41, 59];

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(schoolName, 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('OFFICIAL USER & OPERATIONS MANUAL (TEACHER & ADMIN GUIDE)', 14, 20);

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Quick Reference Guide: All Application Functionalities & Workflows', 14, 37);

  const manualSections = [
    [
      '1. NAVIGATION &\n4 MAIN TABS',
      '• Observe Tab: Record daily attendance (Present/Absent) & 7 observation questions.\n' +
        '• Daily Summary Tab: Check Completed, Pending, & Absent counts; share WhatsApp slips or download PDFs.\n' +
        '• Students Tab: Enroll new children (+ Add Child), bulk import Excel/CSV, and filter by classroom.\n' +
        '• Parent Slips Tab: Generate AI-Based Progress Summaries and view a child\'s full historical timeline.\n' +
        '• Sync Now Button (Top Bar): Syncs observations across all school phones/tablets.'
    ],
    [
      '2. DAILY OBSERVATION\nWORKFLOW\n(Observe Tab)',
      '1. Select your Classroom and Date in the top header bar.\n' +
        '2. Check the Horizontal Student Roster Bar: Green Check = Completed, Red X = Absent, Gray Dot = Pending.\n' +
        '3. If a child is Absent: Tap "Absent" and click "Save & Next Child" (questions are skipped automatically).\n' +
        '4. If a child is Present: Select options across the 7 observation areas or tap Quick Note chips.\n' +
        '5. Tap "Save & Next" to save to the cloud and automatically open the next child in the class list.'
    ],
    [
      '3. AFTER ENTERING\nSTUDENT DATA\n(Daily Summary Tab)',
      'After entering observations, open the "Daily Summary" tab:\n' +
        '• Check Pending Children: Tap the amber "Pending" card to see any unfinished children, then tap "Observe ->" to finish them.\n' +
        '• Share via WhatsApp: Tap the green Share icon on any completed child\'s row to send their formatted daily update to parents.\n' +
        '• Download Daily PDF Slip: Tap the Download icon to print or save an official A4 Daily Observation Slip.\n' +
        '• Edit Observation: Tap "Edit ->" on any completed row to update that child\'s record.\n' +
        '• Export Class Sheet: Tap "Export CSV" to download the full day\'s class spreadsheet.'
    ],
    [
      '4. STUDENT ONBOARDING\n& ROSTER\n(Students Tab)',
      '• Single Student Enrollment: Open "Students" tab -> Tap "+ Add Child" -> Enter Full Name, select Classroom Section, and tap "Enroll Student". The child immediately appears in that class and syncs to the cloud.\n' +
        '• Classroom Filter Pills: Tap any class pill (e.g., LKG Jnana, LKG Satya) to filter students and verify class headcounts.\n' +
        '• Bulk Excel/CSV Upload: Tap "Import Excel / CSV" to upload multiple students at once.'
    ],
    [
      '5. AI PROGRESS\nINSIGHTS & REPORTS\n(Parent Slips Tab)',
      '1. Open the "Parent Slips" tab, filter by Classroom, and select a Child.\n' +
        '2. Choose the Period: "Last 7 Recorded Days", "Last 30 Recorded Days", or "All Recorded Days".\n' +
        '3. Tap "Generate AI Progress Summary".\n' +
        '4. The system analyzes daily teacher uploads and generates 4 narrative paragraphs: Overall Summary, Academic & Learning Patterns, Social & Participation, and Mood & Emotional State, plus Key Strengths & Recommendations.\n' +
        '5. Tap "WhatsApp" to share with parents, or "Letterhead PDF" to download the official institutional letterhead report (with school crest, campus address, phone numbers, student memo card, and signature lines).'
    ],
    [
      '6. DAILY TEACHER\nSUBSTITUTIONS\n(Top-Right Menu ▾)',
      'When a regular class teacher is on leave (Admin Only):\n' +
        '1. Tap your name / Menu (▾) in the top-right corner and select "Daily Substitutes".\n' +
        '2. Select the Date, the Class Needing Coverage (Absent Teacher), and the Substitute Teacher.\n' +
        '3. Tap "Assign Substitute".\n' +
        '4. The substitute teacher immediately sees that classroom in their top Class dropdown for that date (marked "Covering Today"). Access automatically expires after that date.'
    ],
    [
      '7. STAFF, HOLIDAYS\n& USER GUIDE\n(Top-Right Menu ▾)',
      'Tap your name / Menu (▾) in the top-right corner to access:\n' +
        '• Holidays & Closures: Declare Single Day or Multi-Day Date Range Holidays (e.g., Dussehra Vacation from Oct 10 to Oct 18). During holiday ranges, teachers see a vacation notice and daily observations are optional.\n' +
        '• User Guide (PDF): Download this printable operations manual anytime on mobile or desktop.\n' +
        '• School & Cloud Settings -> Staff Directory: Add new teachers/admins using their Google email and assign their classroom sections.'
    ],
  ];

  autoTable(doc, {
    startY: 42,
    head: [['Module / Feature', 'Step-by-Step Operational Instructions']],
    body: manualSections,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 8.8,
      textColor: [30, 41, 59],
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 136 },
    },
  });

  const sanitizedSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${sanitizedSchool}_User_Operations_Manual.pdf`);
}
