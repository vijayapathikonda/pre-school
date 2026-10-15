import { DailyObservation, Student } from '../types/observation';
import { AIStudentInsight } from './geminiInsights';

export function formatObservationForWhatsApp(
  student: Student,
  obs: DailyObservation,
  schoolName: string = 'Sunshine Preschool'
): string {
  const dateFormatted = new Date(obs.date).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  if (!obs.present) {
    return `🏫 *${schoolName}*
📅 *Daily Observation Report*
👤 *Child:* ${student.name}
🗓️ *Date:* ${dateFormatted}
📍 *Attendance:* ❌ Absent today`;
  }

  let text = `🏫 *${schoolName}*
📋 *DAILY CHILD OBSERVATION*
━━━━━━━━━━━━━━━━━━━━
👤 *Child:* ${student.name}
🏫 *Class:* ${student.classroomName || 'Preschool'}
🗓️ *Date:* ${dateFormatted}
📍 *Attendance:* ✅ Present

1️⃣ *Engagement / Attention:*
${obs.engagement ? `▸ ${obs.engagement}` : '▸ Not observed'}

2️⃣ *Participation:*
${obs.participation ? `▸ ${obs.participation}` : '▸ Not observed'}

3️⃣ *Following / Response:*
${obs.following ? `▸ ${obs.following}` : '▸ Not observed'}

4️⃣ *Thinking / Exploring:*
${obs.thinking && obs.thinking.length > 0 ? obs.thinking.map(t => `▸ ${t}`).join('\n') : '▸ Not observed'}

5️⃣ *Social / Communication:*
${obs.social && obs.social.length > 0 ? obs.social.map(s => `▸ ${s}`).join('\n') : '▸ Not observed'}

6️⃣ *State / Disposition:*
${obs.state && obs.state.length > 0 ? obs.state.map(st => `▸ ${st}`).join('\n') : '▸ Nothing unusual noticed'}

7️⃣ *Interest Today:*
${obs.interest ? `▸ ${obs.interest}` : '▸ No particular interest noticed'}
${obs.interestDetail ? `▸ In: _${obs.interestDetail}_` : ''}
`;

  if (obs.additionalObservation && obs.additionalObservation.trim()) {
    text += `\n💬 *Additional Notes:*
_${obs.additionalObservation.trim()}_
`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━
✨ Have a wonderful evening!`;

  return text;
}

export function shareViaWhatsApp(student: Student, obs: DailyObservation, schoolName?: string) {
  const message = formatObservationForWhatsApp(student, obs, schoolName);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

export function formatAIInsightsForWhatsApp(
  insight: AIStudentInsight,
  schoolName: string = 'Pragathi Vidyalaya School'
): string {
  const strengths =
    insight.highlights && insight.highlights.length > 0
      ? `\n🌟 *Key Highlights:* ${insight.highlights.join(' • ')}\n`
      : '';

  const recs =
    insight.recommendations && insight.recommendations.length > 0
      ? `\n💡 *Gentle Next Steps:*\n${insight.recommendations.map((r) => `• ${r}`).join('\n')}\n`
      : '';

  return `🏫 *${schoolName}*
✨ *CHILD PROGRESS & LEARNING INSIGHTS*
━━━━━━━━━━━━━━━━━━━━
👤 *Child:* ${insight.studentName}
🏫 *Class:* ${insight.classroomName}
🗓️ *Period:* ${insight.periodLabel} (${insight.dateRange})
📊 *Attendance:* ${insight.presentDaysCount}/${insight.analyzedDaysCount} Days Present
${strengths}
📝 *Overall Summary:*
${insight.overallSummary}

📚 *Academic & Learning Patterns:*
${insight.academicAndLearning}

🤝 *Social & Classroom Participation:*
${insight.socialAndParticipation}

😊 *Mood & Emotional Disposition:*
${insight.moodAndDisposition}
${recs}━━━━━━━━━━━━━━━━━━━━
💛 Warm regards, ${schoolName}`;
}

export function shareAIInsightsViaWhatsApp(insight: AIStudentInsight, schoolName?: string) {
  const message = formatAIInsightsForWhatsApp(insight, schoolName);
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}
