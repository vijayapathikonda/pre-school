import { DailyObservation, Student } from '../types/observation';
import { getTurso } from '../db/tursoClient';

export interface AIStudentInsight {
  studentId: string;
  studentName: string;
  classroomName: string;
  periodLabel: string;
  analyzedDaysCount: number;
  presentDaysCount: number;
  absentDaysCount: number;
  dateRange: string;
  overallSummary: string;
  academicAndLearning: string;
  socialAndParticipation: string;
  moodAndDisposition: string;
  highlights: string[];
  recommendations: string[];
  generatedAt: string;
}

const INSIGHT_CACHE_PREFIX = 'ai_insight_v1_';

// Optional developer defaults (can also be set via .env, GitHub Secrets, or Turso app_settings table)
// Tip: You can even pass comma-separated keys (e.g. "AIzaKey1,AIzaKey2") to multiply your free daily limit!
const DEFAULT_GEMINI_API_KEY = '';
const DEFAULT_GROQ_API_KEY = ''; // 100% Free alternative (console.groq.com - 14,400 RPD free)
const DEFAULT_OPENAI_API_KEY = ''; // Optional ChatGPT (gpt-4o-mini) key

let cachedCloudSettings: Record<string, string> | null = null;

/**
 * Silently resolves API keys from build-time env or Turso cloud app_settings.
 * Never exposed in the user interface.
 */
async function resolveSilentKeys(): Promise<{
  geminiKeys: string[];
  groqKey: string;
  openaiKey: string;
}> {
  const envGemini = ((import.meta as any).env?.VITE_GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY || '').trim();
  const envGroq = ((import.meta as any).env?.VITE_GROQ_API_KEY || DEFAULT_GROQ_API_KEY || '').trim();
  const envOpenai = ((import.meta as any).env?.VITE_OPENAI_API_KEY || DEFAULT_OPENAI_API_KEY || '').trim();

  if (!cachedCloudSettings) {
    cachedCloudSettings = {};
    const turso = getTurso();
    if (turso) {
      try {
        const res = await turso.execute({
          sql: `SELECT key, value FROM app_settings WHERE key IN ('gemini_api_key', 'groq_api_key', 'openai_api_key')`,
          args: [],
        });
        for (const row of res.rows) {
          if (row.key && row.value) {
            cachedCloudSettings[String(row.key)] = String(row.value).trim();
          }
        }
      } catch {
        // Table might not exist yet
      }
    }
  }

  const rawGemini = envGemini || cachedCloudSettings['gemini_api_key'] || '';
  const geminiKeys = rawGemini
    .split(',')
    .map((k: string) => k.trim())
    .filter(Boolean);

  return {
    geminiKeys,
    groqKey: envGroq || cachedCloudSettings['groq_api_key'] || '',
    openaiKey: envOpenai || cachedCloudSettings['openai_api_key'] || '',
  };
}

/**
 * Get cached AI insight from localStorage or Turso cloud
 */
export async function getCachedStudentInsight(
  studentId: string,
  periodKey: string
): Promise<AIStudentInsight | null> {
  const cacheKey = `${INSIGHT_CACHE_PREFIX}${studentId}_${periodKey}`;
  const localRaw = localStorage.getItem(cacheKey);
  if (localRaw) {
    try {
      return JSON.parse(localRaw) as AIStudentInsight;
    } catch {
      // ignore corrupted cache
    }
  }

  const turso = getTurso();
  if (!turso) return null;

  try {
    const res = await turso.execute({
      sql: `SELECT insight_json FROM ai_student_insights WHERE id = ? LIMIT 1`,
      args: [`${studentId}_${periodKey}`],
    });
    if (res.rows.length > 0 && res.rows[0].insight_json) {
      const parsed = JSON.parse(String(res.rows[0].insight_json)) as AIStudentInsight;
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
      return parsed;
    }
  } catch {
    // Table might not exist yet
  }

  return null;
}

/**
 * Save generated AI insight to localStorage and Turso cloud
 */
async function cacheStudentInsight(
  studentId: string,
  periodKey: string,
  insight: AIStudentInsight
): Promise<void> {
  const cacheKey = `${INSIGHT_CACHE_PREFIX}${studentId}_${periodKey}`;
  const jsonStr = JSON.stringify(insight);
  localStorage.setItem(cacheKey, jsonStr);

  const turso = getTurso();
  if (!turso) return;

  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS ai_student_insights (
        id TEXT PRIMARY KEY,
        student_id TEXT,
        period_key TEXT,
        insight_json TEXT,
        updated_at TEXT
      )
    `);
    await turso.execute({
      sql: `INSERT OR REPLACE INTO ai_student_insights (id, student_id, period_key, insight_json, updated_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [`${studentId}_${periodKey}`, studentId, periodKey, jsonStr, new Date().toISOString()],
    });
  } catch (err) {
    console.warn('Could not cache AI insight to Turso:', err);
  }
}

/**
 * Helper to count and rank frequencies of items in observations
 */
function getRankedCounts(items: (string | undefined)[]): [string, number][] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    if (!item || item === 'Not observed' || item === 'Nothing unusual noticed') continue;
    counts[item] = (counts[item] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function summarizeFrequencies(items: (string | undefined)[]): string {
  const sorted = getRankedCounts(items);
  if (sorted.length === 0) return 'Consistent baseline';
  return sorted.map(([val, count]) => `${val} (${count}x)`).join(', ');
}

/**
 * Built-in Pedagogical Narrative Synthesizer:
 * Generates rich, personalized, educator-grade paragraph summaries directly from the child's
 * structured observation logs when running without an external API key or when offline.
 */
function buildSmartPedagogicalInsight(params: {
  student: Student;
  sortedObs: DailyObservation[];
  presentObs: DailyObservation[];
  absentCount: number;
  dateRange: string;
  periodLabel: string;
}): AIStudentInsight {
  const { student, sortedObs, presentObs, absentCount, dateRange, periodLabel } = params;
  const firstName = student.name.split(' ')[0] || student.name;

  const engagements = getRankedCounts(presentObs.map((o) => o.engagement));
  const participations = getRankedCounts(presentObs.map((o) => o.participation));
  const followings = getRankedCounts(presentObs.map((o) => o.following));
  const thinkings = getRankedCounts(presentObs.flatMap((o) => o.thinking || []));
  const socials = getRankedCounts(presentObs.flatMap((o) => o.social || []));
  const moods = getRankedCounts(presentObs.flatMap((o) => o.state || []));
  const notes = presentObs
    .map((o) => o.additionalObservation?.trim())
    .filter((n): n is string => !!n);
  const interests = presentObs
    .filter(
      (o) =>
        o.interest &&
        o.interest !== 'No particular interest noticed' &&
        o.interest !== 'Not observed'
    )
    .map((o) => `${o.interest}${o.interestDetail ? ` in ${o.interestDetail}` : ''}`);

  const topEngagement = engagements[0]?.[0] || 'Mostly engaged';
  const topParticipation = participations[0]?.[0] || 'Joined voluntarily';
  const topFollowing = followings[0]?.[0] || 'Followed independently';
  const topThinking = thinkings.slice(0, 2).map(([k]) => k.toLowerCase());
  const topSocial = socials.slice(0, 2).map(([k]) => k.toLowerCase());
  const topMoods = moods.slice(0, 2).map(([k]) => k.toLowerCase());

  const attendanceRate =
    sortedObs.length > 0 ? Math.round((presentObs.length / sortedObs.length) * 100) : 100;

  let overallSummary = '';
  if (presentObs.length === 0) {
    overallSummary = `During ${periodLabel.toLowerCase()} (${dateRange}), ${student.name} was marked absent for ${absentCount} recorded day(s). Once ${firstName} returns to ${student.classroomName || 'class'}, daily observations will track classroom engagement, social participation, and learning milestones.`;
  } else {
    const attendancePhrase =
      attendanceRate >= 90
        ? `maintained wonderful attendance (${presentObs.length} of ${sortedObs.length} days present)`
        : `attended ${presentObs.length} of ${sortedObs.length} recorded days`;
    const noteSnippet =
      notes.length > 0
        ? ` Teachers also highlighted notable moments such as "${notes[notes.length - 1]}".`
        : '';
    overallSummary = `Across ${periodLabel.toLowerCase()} (${dateRange}), ${student.name} ${attendancePhrase} in ${student.classroomName || 'Preschool'} and demonstrated a positive classroom presence. ${firstName} has generally been ${topEngagement.toLowerCase()} during daily routines and ${topParticipation.toLowerCase()} in group activities.${noteSnippet}`;
  }

  let academicAndLearning = '';
  if (presentObs.length === 0) {
    academicAndLearning = `Academic and learning pattern observations will be synthesized as soon as present classroom sessions are logged for ${firstName}.`;
  } else {
    const thinkingDesc =
      topThinking.length > 0
        ? `frequently ${topThinking.join(' and ')} during learning tasks`
        : 'approached structured activities with steady focus';
    const interestDesc =
      interests.length > 0
        ? ` Additionally, ${firstName} showed ${interests[interests.length - 1].toLowerCase()}.`
        : '';
    academicAndLearning = `In terms of attention and cognitive growth, ${firstName} was most often observed as "${topEngagement}" during instructional sessions. When given classroom directions, ${firstName} typically "${topFollowing.toLowerCase()}", showing developing self-regulation. While exploring new concepts, ${firstName} ${thinkingDesc}.${interestDesc}`;
  }

  let socialAndParticipation = '';
  if (presentObs.length === 0) {
    socialAndParticipation = `Social interaction and peer communication insights will be available after ${firstName} attends upcoming classroom activities.`;
  } else {
    const socialDesc =
      topSocial.length > 0
        ? `regularly ${topSocial.join(' and ')}`
        : 'communicated comfortably within the classroom setting';
    socialAndParticipation = `During group circles and collaborative play, ${firstName} most commonly "${topParticipation.toLowerCase()}". In peer and teacher interactions, ${firstName} ${socialDesc}, reflecting healthy social-emotional confidence and a supportive bond with classmates.`;
  }

  let moodAndDisposition = '';
  if (presentObs.length === 0) {
    moodAndDisposition = `Emotional disposition and daily mood patterns will be updated once ${firstName} is present in class.`;
  } else {
    const moodDesc =
      topMoods.length > 0
        ? `predominantly ${topMoods.join(' and ')}`
        : 'settled, calm, and comfortable';
    const extraNote =
      notes.length > 0
        ? ` Teacher remarks ("${notes.slice(-2).join('; ')}") further reflect ${firstName}'s daily classroom experience.`
        : '';
    moodAndDisposition = `Throughout the observed sessions, ${firstName}'s emotional state was ${moodDesc}. This steady disposition helps ${firstName} transition smoothly between classroom routines, storytime, and outdoor play.${extraNote}`;
  }

  const highlights: string[] = [];
  if (topEngagement.includes('Fully') || topEngagement.includes('Mostly')) {
    highlights.push('Attentive Learner');
  }
  if (topParticipation.includes('Initiated') || topParticipation.includes('voluntarily')) {
    highlights.push('Active Participant');
  }
  if (topFollowing.includes('independently')) {
    highlights.push('Follows Routines Well');
  }
  if (topMoods.some((m) => m.includes('happy') || m.includes('calm'))) {
    highlights.push('Positive Disposition');
  }
  if (highlights.length === 0) {
    highlights.push('Growing Explorer', 'Steady Progress');
  }

  const recommendations: string[] = [];
  if (topEngagement.includes('Partly') || topEngagement.includes('Barely')) {
    recommendations.push(
      `Use short, hands-on visual and sensory activities to help sustain ${firstName}'s attention span.`
    );
  } else {
    recommendations.push(
      `Continue nurturing ${firstName}'s curiosity with interactive storytelling and open-ended building or art activities.`
    );
  }
  if (topParticipation.includes('prompted') || topParticipation.includes('Watched')) {
    recommendations.push(
      `Offer gentle small-group pairing with familiar peers to build confidence in initiating group play.`
    );
  } else {
    recommendations.push(
      `Encourage ${firstName} to share daily classroom stories at home to reinforce expressive communication skills.`
    );
  }
  if (topFollowing.includes('prompting') || topFollowing.includes('support')) {
    recommendations.push(
      `Break multi-step classroom instructions into clear, single-step visual cues with positive reinforcement.`
    );
  } else {
    recommendations.push(
      `Celebrate ${firstName}'s independence in following routines by giving small classroom helper responsibilities.`
    );
  }

  return {
    studentId: student.id,
    studentName: student.name,
    classroomName: student.classroomName || 'Preschool',
    periodLabel,
    analyzedDaysCount: sortedObs.length,
    presentDaysCount: presentObs.length,
    absentDaysCount: absentCount,
    dateRange,
    overallSummary,
    academicAndLearning,
    socialAndParticipation,
    moodAndDisposition,
    highlights: highlights.slice(0, 4),
    recommendations: recommendations.slice(0, 3),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to parse raw JSON returned by any LLM
 */
function parseLLMJsonToInsight(
  rawText: string,
  student: Student,
  periodLabel: string,
  sortedObsCount: number,
  presentObsCount: number,
  absentCount: number,
  dateRange: string
): AIStudentInsight {
  const cleanedJson = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleanedJson);

  return {
    studentId: student.id,
    studentName: student.name,
    classroomName: student.classroomName || 'Preschool',
    periodLabel,
    analyzedDaysCount: sortedObsCount,
    presentDaysCount: presentObsCount,
    absentDaysCount: absentCount,
    dateRange,
    overallSummary: parsed.overallSummary,
    academicAndLearning: parsed.academicAndLearning,
    socialAndParticipation: parsed.socialAndParticipation,
    moodAndDisposition: parsed.moodAndDisposition,
    highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : ['Active Learner'],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.slice(0, 4)
      : ['Continue encouraging daily storytelling and interactive play at home.'],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate AI-based paragraph summaries highlighting the child's academic progress,
 * learning patterns, social participation, and mood.
 * Automatically rotates across:
 *   1. Google Gemini (supports multiple comma-separated keys & multiple Flash models)
 *   2. Groq Cloud Free API (Llama 3.3 70B - 14,400 free requests/day)
 *   3. OpenAI ChatGPT (gpt-4o-mini)
 *   4. Built-in Pedagogical AI Narrative Synthesizer (zero-quota / offline fallback)
 */
export async function generateStudentAIInsights(params: {
  student: Student;
  observations: DailyObservation[];
  periodKey: string;
  periodLabel: string;
  schoolName: string;
}): Promise<AIStudentInsight> {
  const { student, observations, periodKey, periodLabel, schoolName } = params;

  if (!observations || observations.length === 0) {
    throw new Error(`No recorded observations found for ${student.name} in the selected period.`);
  }

  const sortedObs = [...observations].sort((a, b) => a.date.localeCompare(b.date));
  const presentObs = sortedObs.filter((o) => o.present);
  const absentCount = sortedObs.length - presentObs.length;
  const dateRange =
    sortedObs.length === 1
      ? sortedObs[0].date
      : `${sortedObs[0].date} to ${sortedObs[sortedObs.length - 1].date}`;

  const { geminiKeys, groqKey, openaiKey } = await resolveSilentKeys();

  const engagementStats = summarizeFrequencies(presentObs.map((o) => o.engagement));
  const participationStats = summarizeFrequencies(presentObs.map((o) => o.participation));
  const followingStats = summarizeFrequencies(presentObs.map((o) => o.following));
  const thinkingStats = summarizeFrequencies(presentObs.flatMap((o) => o.thinking || []));
  const socialStats = summarizeFrequencies(presentObs.flatMap((o) => o.social || []));
  const moodStats = summarizeFrequencies(presentObs.flatMap((o) => o.state || []));
  const interestStats = summarizeFrequencies(
    presentObs.map((o) =>
      o.interest ? `${o.interest}${o.interestDetail ? ` (${o.interestDetail})` : ''}` : undefined
    )
  );

  const dailyLogLines = sortedObs.map((o) => {
    if (!o.present) {
      return `- [${o.date}]: Marked Absent`;
    }
    const parts: string[] = [];
    if (o.engagement) parts.push(`Engagement: ${o.engagement}`);
    if (o.participation) parts.push(`Participation: ${o.participation}`);
    if (o.following) parts.push(`Following Instructions: ${o.following}`);
    if (o.thinking?.length) parts.push(`Thinking/Exploring: ${o.thinking.join(', ')}`);
    if (o.social?.length) parts.push(`Social/Communication: ${o.social.join(', ')}`);
    if (o.state?.length) parts.push(`Mood/Disposition: ${o.state.join(', ')}`);
    if (o.interest) {
      parts.push(`Interest: ${o.interest}${o.interestDetail ? ` (${o.interestDetail})` : ''}`);
    }
    if (o.additionalObservation?.trim()) {
      parts.push(`Teacher Note: "${o.additionalObservation.trim()}"`);
    }
    return `- [${o.date}]: Present | ${parts.join(' | ')}`;
  });

  const prompt = `You are an experienced early childhood educator and child development specialist at "${schoolName}".
Analyze the following daily classroom observation records for a preschool child and write warm, insightful, parent- and teacher-friendly narrative paragraph summaries.

CHILD PROFILE:
- Name: ${student.name}
- Class: ${student.classroomName || 'Preschool'}
- Analysis Period: ${periodLabel} (${dateRange})
- Total Days Recorded: ${sortedObs.length} (${presentObs.length} Days Present, ${absentCount} Days Absent)

AGGREGATED PATTERN METRICS:
- Engagement / Attention: ${engagementStats}
- Classroom Participation: ${participationStats}
- Following Instructions / Response: ${followingStats}
- Thinking & Exploring Patterns: ${thinkingStats}
- Social & Peer Communication: ${socialStats}
- Mood & Emotional Disposition: ${moodStats}
- Special Interests: ${interestStats}

CHRONOLOGICAL DAILY OBSERVATION LOG:
${dailyLogLines.join('\n')}

TASK:
Return a valid JSON object (no markdown formatting, no code fences, ONLY raw JSON) with the exact following keys:
{
  "overallSummary": "A warm, cohesive 3-4 sentence executive paragraph summarizing ${student.name}'s overall classroom journey, attendance consistency, and general growth during this period.",
  "academicAndLearning": "A detailed 3-4 sentence paragraph analyzing ${student.name}'s academic progress, attention span, engagement levels, ability to follow instructions, curiosity, and problem-solving/thinking patterns based on the logs.",
  "socialAndParticipation": "A detailed 3-4 sentence paragraph highlighting how ${student.name} participates in classroom activities, communicates with teachers, and interacts or shares with peers.",
  "moodAndDisposition": "A thoughtful 2-3 sentence paragraph describing ${student.name}'s emotional disposition, daily mood trends, comfort level in class, and any specific interests or teacher notes observed.",
  "highlights": ["3 to 4 short 2-4 word strength badges, e.g., 'Attentive Listener', 'Curious Explorer', 'Cheerful & Calm'"],
  "recommendations": ["2 to 3 actionable, encouraging, gentle suggestions for parents and teachers to nurture ${student.name}'s continued growth."]
}`;

  // 1. Try Google Gemini (supports multiple keys & model tiers)
  const geminiModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const gKey of geminiKeys) {
    for (const modelName of geminiModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(
            gKey
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!response.ok) continue;

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!rawText) continue;

        const insight = parseLLMJsonToInsight(
          rawText,
          student,
          periodLabel,
          sortedObs.length,
          presentObs.length,
          absentCount,
          dateRange
        );
        await cacheStudentInsight(student.id, periodKey, insight);
        return insight;
      } catch {
        // Continue to next model/key
      }
    }
  }

  // 2. Try Groq Cloud Free Tier (OpenAI-compatible endpoint, 100% Free 14,400 RPD)
  if (groqKey) {
    for (const groqModel of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: groqModel,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.4,
            response_format: { type: 'json_object' },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const rawText = data?.choices?.[0]?.message?.content || '';
          if (rawText) {
            const insight = parseLLMJsonToInsight(
              rawText,
              student,
              periodLabel,
              sortedObs.length,
              presentObs.length,
              absentCount,
              dateRange
            );
            await cacheStudentInsight(student.id, periodKey, insight);
            return insight;
          }
        }
      } catch {
        // Continue to next provider
      }
    }
  }

  // 3. Try OpenAI ChatGPT (gpt-4o-mini) if configured
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.choices?.[0]?.message?.content || '';
        if (rawText) {
          const insight = parseLLMJsonToInsight(
            rawText,
            student,
            periodLabel,
            sortedObs.length,
            presentObs.length,
            absentCount,
            dateRange
          );
          await cacheStudentInsight(student.id, periodKey, insight);
          return insight;
        }
      }
    } catch {
      // Fallback below
    }
  }

  // 4. Built-in Pedagogical AI Narrative Synthesizer (100% reliable zero-cost fallback)
  const fallbackInsight = buildSmartPedagogicalInsight({
    student,
    sortedObs,
    presentObs,
    absentCount,
    dateRange,
    periodLabel,
  });
  await cacheStudentInsight(student.id, periodKey, fallbackInsight);
  return fallbackInsight;
}
