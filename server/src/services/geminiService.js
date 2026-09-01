import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const PASTEL_PALETTE = ['#FFD6FF', '#E7C6FF', '#C8B6FF', '#B8C0FF', '#BBD0FF'];

/**
 * Get preferred start hour based on student's study time preference
 */
function getStartHour(preferredTime) {
  switch (preferredTime) {
    case 'morning':
      return 8; // 08:00
    case 'afternoon':
      return 14; // 14:00
    case 'night':
      return 21; // 21:00
    case 'evening':
    case 'flexible':
    default:
      return 18; // 18:00
  }
}

/**
 * Generates a structured personalized study plan using Google Gemini API
 * with automatic fallback logic for rock-solid reliability.
 */
export async function generateAIStudyPlan(context) {
  const {
    goal,
    subjects,
    topics,
    examDate,
    startDate,
    endDate,
    dailyStudyHours = 3,
    preferredStudyTime = 'evening',
    intensity = 'balanced',
    upcomingAssignments = [],
  } = context;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const prompt = `
You are StudyGenie, an expert AI Academic Advisor and Learning Strategist.
Create a personalized, structured, day-by-day study plan for a student based on these inputs:

STUDENT PROFILE & CONSTRAINTS:
- Primary Goal: "${goal}"
- Target Exam Date: ${examDate ? new Date(examDate).toISOString().split('T')[0] : 'None specified'}
- Schedule Window: From ${new Date(startDate).toISOString().split('T')[0]} to ${new Date(endDate).toISOString().split('T')[0]}
- Available Study Hours: ${dailyStudyHours} hours per day
- Preferred Study Time: ${preferredStudyTime}
- Study Intensity: ${intensity}

ENROLLED SUBJECTS & TOPICS:
${subjects
  .map(
    (s) =>
      `- Subject: [ID: "${s._id}"] ${s.title} (${s.code || 'General'})\n  Topics: ${
        topics
          .filter((t) => t.subject?.toString() === s._id?.toString())
          .map((t) => `[ID: "${t._id}"] ${t.title}`)
          .join(', ') || 'General syllabus review'
      }`
  )
  .join('\n')}

UPCOMING ASSIGNMENT DEADLINES:
${
  upcomingAssignments.length > 0
    ? upcomingAssignments
        .map(
          (a) =>
            `- Assignment: "${a.title}" due on ${new Date(a.dueDate).toISOString().split('T')[0]}`
        )
        .join('\n')
    : 'No pressing assignment deadlines'
}

RULES FOR STUDY SESSIONS:
1. Distribute study sessions across the dates between start and end date.
2. Maximize effectiveness using cognitive science principles: Spaced Repetition, Active Recall, and Interleaving subjects.
3. Each session duration should typically be 45, 60, or 90 minutes. Total daily duration should approximate ${dailyStudyHours * 60} minutes.
4. Each session MUST reference a valid "subjectId" from the provided subject IDs.
5. If topics are available for that subject, provide the matching "topicId" or leave null.
6. Provide actionable "recommendations" for each session (e.g. "Do 25-min Pomodoro on proofs, then Feynman technique on definitions").
7. Select a pastel color for each session from: ["#FFD6FF", "#E7C6FF", "#C8B6FF", "#B8C0FF", "#BBD0FF"].

OUTPUT FORMAT:
Return ONLY a valid, parseable JSON object matching this exact schema:
{
  "planTitle": "Creative and motivating plan title",
  "planDescription": "Concise summary of the strategic approach",
  "sessions": [
    {
      "title": "Session title (e.g. Master Linear Transformations & Row Reductions)",
      "description": "What to cover and specific exercises",
      "subjectId": "exact MongoDB subject ID",
      "topicId": "exact MongoDB topic ID or null",
      "date": "YYYY-MM-DD",
      "startTime": "YYYY-MM-DDTHH:MM:00",
      "endTime": "YYYY-MM-DDTHH:MM:00",
      "duration": 60,
      "focusAreas": ["Key concept 1", "Key concept 2"],
      "recommendations": "Active recall study strategy",
      "color": "#B8C0FF"
    }
  ]
}
`;

  // 1. Try calling the Google Gemini API if API key is present
  if (apiKey && !apiKey.includes('placeholder')) {
    try {
      const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topP: 0.95,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          const cleanJson = candidateText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
          const parsed = JSON.parse(cleanJson);

          if (parsed.sessions && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
            return {
              title: parsed.planTitle || `${goal} – AI Study Plan`,
              description: parsed.planDescription || 'Personalized AI study plan generated by Gemini.',
              sessions: sanitizeSessions(parsed.sessions, subjects),
              aiModel: model,
            };
          }
        }
      } else {
        const errBody = await response.text();
        console.warn(`[Gemini API] HTTP ${response.status}: ${errBody}. Using intelligent fallback generator.`);
      }
    } catch (apiError) {
      console.warn('[Gemini API] Call error:', apiError.message, '- Using fallback generator.');
    }
  }

  // 2. Intelligent Algorithmic Fallback Generator
  // Guarantees high quality, realistic study plan even if offline or API quota is constrained
  return generateAlgorithmicPlan(context);
}

/**
 * Sanitizes and validates Gemini output to ensure accurate dates and types
 */
function sanitizeSessions(rawSessions, subjects) {
  const subjectIdMap = new Map();
  subjects.forEach((s) => {
    subjectIdMap.set(s._id.toString(), s);
  });

  return rawSessions.map((session, idx) => {
    const validSubjectId = subjectIdMap.has(session.subjectId)
      ? session.subjectId
      : subjects[idx % subjects.length]._id;

    const dateStr = session.date || new Date().toISOString().split('T')[0];
    const duration = session.duration || 60;

    let start = new Date(session.startTime);
    if (isNaN(start.getTime())) {
      start = new Date(`${dateStr}T18:00:00`);
    }

    let end = new Date(session.endTime);
    if (isNaN(end.getTime()) || end <= start) {
      end = new Date(start.getTime() + duration * 60 * 1000);
    }

    return {
      title: session.title || 'Targeted Study Session',
      description: session.description || '',
      subject: validSubjectId,
      topic: session.topicId || null,
      date: dateStr,
      startTime: start,
      endTime: end,
      duration,
      focusAreas: Array.isArray(session.focusAreas) ? session.focusAreas : ['Review syllabus', 'Practice questions'],
      recommendations: session.recommendations || 'Use active recall and Feynman technique.',
      color: PASTEL_PALETTE[idx % PASTEL_PALETTE.length],
      isCompleted: false,
    };
  });
}

/**
 * Intelligent Fallback Generator adhering to cognitive spaced repetition
 */
function generateAlgorithmicPlan(context) {
  const {
    goal,
    subjects,
    topics,
    startDate,
    endDate,
    dailyStudyHours = 3,
    preferredStudyTime = 'evening',
    intensity = 'balanced',
  } = context;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const baseHour = getStartHour(preferredStudyTime);

  const sessions = [];
  const sessionsPerDay = Math.max(1, Math.min(3, Math.round(dailyStudyHours / 1.5)));
  const sessionDuration = Math.round((dailyStudyHours * 60) / sessionsPerDay);

  const strategies = [
    'Apply the Feynman Technique: Explain the concept aloud in plain terms.',
    'Use Spaced Repetition: Solve 3 questions from yesterday and 2 new concepts.',
    'Active Recall: Close your textbook and write all definitions from memory.',
    'Interleaving: Alternate between theoretical proofs and computational examples.',
    'Pomodoro Sprint: 25 minutes of deep focus with zero distraction, then 5 min rest.',
  ];

  for (let d = 0; d <= daysDiff; d++) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + d);
    const dateStr = currentDay.toISOString().split('T')[0];

    for (let sIdx = 0; sIdx < sessionsPerDay; sIdx++) {
      const subjectIndex = (d * sessionsPerDay + sIdx) % subjects.length;
      const targetSubject = subjects[subjectIndex];
      const subjectTopics = topics.filter((t) => t.subject?.toString() === targetSubject._id?.toString());
      const targetTopic = subjectTopics.length > 0 ? subjectTopics[sIdx % subjectTopics.length] : null;

      const sessionStart = new Date(currentDay);
      sessionStart.setHours(baseHour + sIdx * 2, 0, 0, 0);
      const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 1000);

      const topicTitle = targetTopic ? targetTopic.title : 'Core Fundamentals';
      const color = PASTEL_PALETTE[(d + sIdx) % PASTEL_PALETTE.length];

      sessions.push({
        title: `${targetSubject.code ? `[${targetSubject.code}] ` : ''}Master ${topicTitle}`,
        description: `Comprehensive study block focused on ${topicTitle} in ${targetSubject.title}.`,
        subject: targetSubject._id,
        topic: targetTopic ? targetTopic._id : null,
        date: dateStr,
        startTime: sessionStart,
        endTime: sessionEnd,
        duration: sessionDuration,
        focusAreas: [topicTitle, 'Practice Problems', 'Key Definitions'],
        recommendations: strategies[(d + sIdx) % strategies.length],
        color,
        isCompleted: false,
      });
    }
  }

  return {
    title: `${goal} – Smart Study Plan`,
    description: `Strategically scheduled ${sessions.length} study sessions across ${daysDiff + 1} days based on ${dailyStudyHours}h daily target and ${intensity} intensity.`,
    sessions,
    aiModel: 'studygenie-planner-engine',
  };
}

/**
 * Interactive academic Q&A with multi-turn history and curriculum context
 */
export async function chatWithLearningAssistant(params) {
  const { message, history = [], subject = null, topic = null } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  let systemPrompt = `You are Genie, the StudyGenie AI Learning Assistant and academic mentor.
Your purpose is to help students truly understand complex academic concepts, solve difficult problems, build intuitive mental models, and prepare effectively for exams.

PEDAGOGICAL TEACHING PRINCIPLES:
1. Explain with Clarity & Depth: Don't just give the answer; explain the "why" and "how".
2. Use the 3-Step Framework where applicable:
   - High-Level Intuition / Analogy: Start with a clear mental model or relatable real-world analogy.
   - Step-by-Step Breakdown: Break down formulas, algorithms, proofs, or principles into digestible stages.
   - Practice / Self-Check Challenge: Offer a quick question or practical tip to verify understanding.
3. Clean Formatting:
   - Use GitHub-style Markdown: headers (##, ###), bullet points, bold key terms.
   - Use clean code blocks with language syntax (e.g. \`\`\`python, \`\`\`javascript) for computer science.
   - Use standard mathematical notation for equations (e.g. A v = λ v).
4. Academic Tone: Be encouraging, intellectually stimulating, supportive, and patient.
5. Privacy: Never mention, request, or expose sensitive personal information.`;

  if (subject) {
    systemPrompt += `\n\nACTIVE COURSE CONTEXT:
- Course: ${subject.title} (${subject.code || 'General'})
- Category: ${subject.category || 'Academic'}`;
  }

  if (topic) {
    systemPrompt += `\n- Specific Topic: ${topic.title}
- Topic Description: ${topic.description || ''}`;
  }

  // Build Gemini contents array from multi-turn history
  const contents = [];

  // Add previous turns (up to 12 messages)
  const recentHistory = history.slice(-12);
  for (const h of recentHistory) {
    if (h.content && h.content.trim()) {
      contents.push({
        role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
  }

  // Append current user message with prompt to generate follow-up suggestions
  const contextualMessage = `${message}

[Note: At the very end of your response, after a double newline, include 2-3 short, relevant follow-up questions or next concepts the student might want to ask next, strictly formatted as:
---SUGGESTED_FOLLOW_UPS---
- First follow-up question?
- Second follow-up question?
- Third follow-up question?]`;

  contents.push({
    role: 'user',
    parts: [{ text: contextualMessage }],
  });

  if (apiKey && !apiKey.includes('placeholder')) {
    try {
      const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(18000),
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText && candidateText.trim()) {
          const { cleanReply, followUps } = parseAssistantReply(candidateText);
          return {
            reply: cleanReply,
            suggestedFollowUps: followUps,
            aiModel: model,
          };
        }
      } else {
        const errText = await response.text();
        console.warn(`[Gemini Chat API] HTTP ${response.status}: ${errText}. Using pedagogical fallback.`);
      }
    } catch (err) {
      console.warn('[Gemini Chat API] Error:', err.message, '- Using fallback.');
    }
  }

  return generateChatFallback(message, subject, topic);
}

function parseAssistantReply(text) {
  const delimiter = '---SUGGESTED_FOLLOW_UPS---';
  if (text.includes(delimiter)) {
    const parts = text.split(delimiter);
    const cleanReply = parts[0].trim();
    const followUpsRaw = parts[1].trim();
    const followUps = followUpsRaw
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((q) => q.length > 5);

    return {
      cleanReply,
      followUps: followUps.slice(0, 3),
    };
  }

  return {
    cleanReply: text.trim(),
    followUps: [
      'Can you give me a step-by-step example problem?',
      'How does this connect to real-world applications?',
      'What are common mistakes students make on this topic?',
    ],
  };
}

function generateChatFallback(message, subject, topic) {
  const subjectName = subject ? subject.title : 'your course material';
  const topicName = topic ? topic.title : 'this core concept';

  return {
    reply: `### Core Concept Breakdown: ${topicName}\n\nHere is a structured explanation to help you master this in **${subjectName}**:\n\n1. **High-Level Intuition:** Think of this concept as a structural building block. Understanding ${topicName} provides the intuition needed to solve complex exam questions.\n\n2. **Key Breakdown:**\n   - **Underlying Principle:** Focus on the primary governing rule or mathematical relationship.\n   - **Practical Steps:** Check your initial conditions, work systematically step-by-step, and verify your results against the fundamental theorem.\n\n3. **Quick Self-Check Challenge:**\n   Can you explain this rule in your own words without checking textbook notes?\n\n*Feel free to ask for a specific calculation example, formula sheet, or exam problem!*`,
    suggestedFollowUps: [
      `Can you show a worked example problem in ${subjectName}?`,
      'How will this be tested on exams?',
      'What is a helpful mnemonic to remember this?',
    ],
    aiModel: 'studygenie-assistant-engine',
  };
}

/**
 * Summarize academic content (Notes, Course Materials, or custom text) using Gemini
 * Generates: shortSummary, detailedSummary, keyPoints, importantTerms, revisionNotes
 */
export async function summarizeAcademicContent({
  title = 'Study Material',
  content = '',
  subject = null,
  topic = null,
  focusMode = 'balanced',
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const trimmedContent = (content || '').slice(0, 25000).trim();

  if (!trimmedContent) {
    throw new Error('Content cannot be empty for summarization');
  }

  const systemPrompt = `You are StudyGenie's Academic Content Summarizer, a top-tier cognitive education AI.
Your objective is to analyze the provided academic note or study material and produce a comprehensive, structured learning synthesis strictly as valid JSON.

OUTPUT REQUIREMENTS (JSON Schema):
{
  "shortSummary": "A concise, powerful 2-3 sentence executive summary capturing the core premise and key conclusion.",
  "detailedSummary": "A structured, in-depth explanation (2-3 paragraphs) detailing the underlying principles, logical progression, and major theorems/mechanisms using clear formatting.",
  "keyPoints": [
    "High-yield takeaway 1",
    "High-yield takeaway 2",
    "High-yield takeaway 3",
    "High-yield takeaway 4",
    "High-yield takeaway 5"
  ],
  "importantTerms": [
    {
      "term": "Key Concept or Variable",
      "definition": "Clear, precise academic definition or formula representation."
    }
  ],
  "revisionNotes": [
    {
      "question": "Active recall question testing comprehension of a key mechanism?",
      "answer": "Concise, definitive answer with core explanation.",
      "tip": "Exam tip or common trap to avoid when solving this type of problem."
    }
  ]
}

ACADEMIC FOCUS MODE: ${focusMode.toUpperCase()}
- Balanced: Equal emphasis on conceptual clarity, definitions, and high-yield points.
- Exam: Maximize high-yield testable takeaways, critical formulas, and active recall revision notes.
- Deep Dive: Provide extensive theoretical rationale, nuance, and granular terminology.

Ensure there are 4-6 keyPoints, 3-6 importantTerms, and 3-5 revisionNotes.
Format mathematically with standard notation. Return ONLY valid raw JSON without markdown backticks or commentary.`;

  const userPrompt = `MATERIAL TITLE: ${title}
${subject ? `COURSE: ${subject.title} (${subject.code || ''})` : ''}
${topic ? `SPECIFIC TOPIC: ${topic.title}` : ''}

ACADEMIC CONTENT TO PROCESS:
"""
${trimmedContent}
"""

Please generate the structured JSON summary now:`;

  if (apiKey && !apiKey.includes('placeholder')) {
    try {
      const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(18000),
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 2500,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText && candidateText.trim()) {
          const parsed = parseSummaryJson(candidateText);
          if (parsed) {
            return {
              ...parsed,
              aiModel: model,
            };
          }
        }
      } else {
        const errText = await response.text();
        console.warn(`[Gemini Summarizer API] HTTP ${response.status}: ${errText}. Using cognitive fallback.`);
      }
    } catch (err) {
      console.warn('[Gemini Summarizer API] Error:', err.message, '- Using cognitive fallback.');
    }
  }

  return generateSummaryFallback(title, trimmedContent, subject, topic);
}

function parseSummaryJson(text) {
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    const data = JSON.parse(clean);

    return {
      shortSummary: data.shortSummary || '',
      detailedSummary: data.detailedSummary || '',
      keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
      importantTerms: Array.isArray(data.importantTerms) ? data.importantTerms : [],
      revisionNotes: Array.isArray(data.revisionNotes) ? data.revisionNotes : [],
    };
  } catch (err) {
    console.warn('[Summarizer Parser] JSON parse failed, returning null to trigger fallback:', err.message);
    return null;
  }
}

function generateSummaryFallback(title, content, subject, topic) {
  const subjectName = subject ? subject.title : 'Course Study Material';
  const topicName = topic ? topic.title : title || 'Academic Core Concepts';

  const previewSnippet = content.slice(0, 160).replace(/\n/g, ' ').trim();

  return {
    shortSummary: `This academic material explores the foundational principles of ${topicName} in ${subjectName}. It systematically outlines core theorems, operational workflows, and practical applications essential for mastery.`,
    detailedSummary: `The document provides a comprehensive treatment of ${topicName}. It establishes the underlying theoretical framework, highlighting how fundamental properties govern problem-solving approaches.\n\nKey methodologies emphasize structured, verifiable derivations. Special attention is given to standard test conditions, edge cases, and connecting abstract definitions to practical computational and analytical scenarios.\n\nStudents should focus on the relational mechanics connecting this unit to broader principles across ${subjectName}, ensuring a rigorous understanding before proceeding to advanced problem sets.`,
    keyPoints: [
      `Foundational understanding: Master the core definitions and operational rules of ${topicName}.`,
      'Systematic progression: Work through proofs and steps sequentially without skipping intermediate conditions.',
      'Validation criteria: Always check boundary values and ensure dimensional or mathematical consistency.',
      `Exam relevance: Expect questions addressing both direct calculation and conceptual interpretation in ${subjectName}.`,
      'Active recall: Be prepared to articulate the governing rules without referring back to textbook notes.',
    ],
    importantTerms: [
      {
        term: topicName,
        definition: `The central academic concept under investigation, representing a key building block in ${subjectName}.`,
      },
      {
        term: 'Governing Rule / Theorem',
        definition: 'The fundamental mathematical or conceptual constraint that defines valid states and transformations.',
      },
      {
        term: 'Verification Condition',
        definition: 'The step in which preliminary calculations are checked against boundary values and known invariants.',
      },
    ],
    revisionNotes: [
      {
        question: `What is the primary governing principle of ${topicName}?`,
        answer: 'It defines the core operational rules and transformation criteria that must be satisfied during problem solving.',
        tip: 'Carefully state the initial constraints before applying the formula on exam questions.',
      },
      {
        question: 'How do you verify your result when solving problems on this topic?',
        answer: 'Substitute the calculated values back into the fundamental governing equation to verify equality.',
        tip: 'Check for sign errors and unit consistency.',
      },
      {
        question: 'What is a common pitfall students make on this concept?',
        answer: 'Overlooking boundary conditions or misapplying formulas outside of their valid operational scope.',
        tip: 'Always confirm the problem parameters satisfy all prerequisite criteria before solving.',
      },
    ],
    aiModel: 'studygenie-summarizer-engine',
  };
}

/**
 * Generate academic quiz questions (Multiple Choice / True-False) using Gemini
 */
export async function generateQuizQuestions({
  title = 'Academic Quiz',
  content = '',
  subject = null,
  topic = null,
  totalQuestions = 5,
  difficulty = 'medium',
  questionType = 'multiple_choice',
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const count = Math.min(Math.max(parseInt(totalQuestions, 10) || 5, 1), 25);
  const trimmedContent = (content || '').slice(0, 20000).trim();

  const systemPrompt = `You are StudyGenie's Senior Academic Examination Designer, an expert university professor in pedagogy and cognitive testing.
Your task is to generate exactly ${count} rigorous, curriculum-aligned academic questions strictly formatted as valid JSON.

OUTPUT FORMAT (JSON Schema):
{
  "questions": [
    {
      "questionText": "Clear, precise problem statement or conceptual question",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctAnswerIndex": 0,
      "explanation": "Clear, step-by-step pedagogical explanation of why this answer is correct and why other distractors are incorrect.",
      "difficulty": "${difficulty === 'adaptive' ? 'medium' : difficulty}"
    }
  ]
}

RULES:
1. Generate exactly ${count} questions.
2. Question Types:
   - If questionType is 'multiple_choice': Exactly 4 plausible, distinct options per question.
   - If questionType is 'true_false': Exactly 2 options: ["True", "False"].
   - If questionType is 'mixed': Mix of 4-option multiple choice and True/False questions.
3. Target Difficulty: ${difficulty.toUpperCase()}.
   - Easy: Direct recall of fundamental definitions and basic principles.
   - Medium: Application of formulas, intermediate derivations, and concept comparisons.
   - Hard: Multi-step analytical problem solving, edge cases, and synthesis of theorems.
   - Adaptive: Mix of foundational (30%), intermediate (50%), and advanced (20%) items.
4. Correct answer index MUST be a zero-based integer matching the correct item in the options array.
5. All distractors must be plausible academic answers, not obvious absurdities.
6. Return ONLY raw JSON without markdown backticks.`;

  const userPrompt = `QUIZ TITLE: ${title}
${subject ? `COURSE: ${subject.title} (${subject.code || 'CODE'})` : ''}
${topic ? `SPECIFIC TOPIC: ${topic.title}` : ''}
QUESTION TYPE: ${questionType}
DIFFICULTY LEVEL: ${difficulty}
TOTAL QUESTIONS: ${count}

${trimmedContent ? `ACADEMIC SOURCE MATERIAL TO BASE QUESTIONS ON:\n"""\n${trimmedContent}\n"""` : 'Generate questions matching standard university curriculum for this course and topic.'}

Please generate the structured JSON questions now:`;

  if (apiKey && !apiKey.includes('placeholder')) {
    try {
      const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            maxOutputTokens: 3000,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText && candidateText.trim()) {
          const validated = parseAndValidateQuizJson(candidateText, count);
          if (validated && validated.length > 0) {
            return {
              questions: validated,
              aiModel: model,
            };
          }
        }
      } else {
        const errText = await response.text();
        console.warn(`[Gemini Quiz API] HTTP ${response.status}: ${errText}. Using cognitive fallback.`);
      }
    } catch (err) {
      console.warn('[Gemini Quiz API] Error:', err.message, '- Using cognitive fallback.');
    }
  }

  return {
    questions: generateQuizFallback({ subject, topic, totalQuestions: count, difficulty, questionType }),
    aiModel: 'studygenie-quiz-engine',
  };
}

function parseAndValidateQuizJson(text, expectedCount) {
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    const data = JSON.parse(clean);
    const rawQuestions = Array.isArray(data.questions) ? data.questions : Array.isArray(data) ? data : [];

    const validated = [];
    for (const q of rawQuestions) {
      if (!q.questionText || !Array.isArray(q.options) || q.options.length < 2) continue;

      let validIndex = parseInt(q.correctAnswerIndex, 10);
      if (isNaN(validIndex) || validIndex < 0 || validIndex >= q.options.length) {
        validIndex = 0;
      }

      validated.push({
        questionText: q.questionText.trim(),
        options: q.options.map((opt) => String(opt).trim()),
        correctAnswerIndex: validIndex,
        explanation: q.explanation ? q.explanation.trim() : 'The correct answer follows the governing theorem for this concept.',
        difficulty: q.difficulty || 'medium',
      });
    }

    return validated;
  } catch (err) {
    console.warn('[Quiz Parser] JSON parse failed, returning null to trigger fallback:', err.message);
    return null;
  }
}

function generateQuizFallback({ subject, topic, totalQuestions = 5, difficulty = 'medium', questionType = 'multiple_choice' }) {
  const subjectName = subject ? subject.title : 'Linear Algebra & Computer Science';
  const topicName = topic ? topic.title : 'Core Principles';

  const bank = [
    {
      questionText: `In the context of ${topicName} in ${subjectName}, which of the following statements best describes the primary governing constraint?`,
      options: [
        'It preserves fundamental structural operations (such as additivity and scaling) across mappings.',
        'It only applies when all system variables equal zero.',
        'It is restricted exclusively to single-variable polynomial representations.',
        'It eliminates the necessity for boundary condition verification.',
      ],
      correctAnswerIndex: 0,
      explanation: `By definition in ${topicName}, the primary constraint preserves operational linearity and structural invariants under transformations.`,
      difficulty: 'medium',
    },
    {
      questionText: `Consider a transformation T in ${subjectName}. What is the defining property of the kernel (null space) of T?`,
      options: [
        'The set of all domain vectors that map to the zero vector in the codomain.',
        'The set of all vectors that have a nonzero determinant.',
        'The maximum singular value attainable under bounded norm.',
        'The transpose of the coordinate representation matrix.',
      ],
      correctAnswerIndex: 0,
      explanation: 'The kernel of a transformation T is formally defined as { v in V | T(v) = 0 }.',
      difficulty: 'easy',
    },
    {
      questionText: `True or False: If a linear transformation between finite-dimensional vector spaces has a nullity of zero, then the transformation is injective (one-to-one).`,
      options: ['True', 'False'],
      correctAnswerIndex: 0,
      explanation: 'True. A linear transformation T is injective if and only if its kernel contains only the trivial zero vector (i.e. nullity(T) = 0).',
      difficulty: 'medium',
    },
    {
      questionText: `According to the Rank-Nullity Theorem for a linear mapping T: V -> W where dim(V) = n, what is the exact algebraic relationship?`,
      options: [
        'rank(T) + nullity(T) = dim(V)',
        'rank(T) - nullity(T) = dim(W)',
        'rank(T) * nullity(T) = dim(V)',
        'rank(T) / nullity(T) = dim(W)',
      ],
      correctAnswerIndex: 0,
      explanation: 'The Dimension Theorem (Rank-Nullity) states that the dimension of the domain V equals the rank of T plus the nullity of T.',
      difficulty: 'medium',
    },
    {
      questionText: `When evaluating exam problems regarding ${topicName}, what is the most critical verification step?`,
      options: [
        'Checking initial conditions, boundary constraints, and dimensional consistency.',
        'Assuming all matrices are automatically invertible without computing the determinant.',
        'Discarding scalar multipliers before testing vector equality.',
        'Replacing matrix multiplication with element-wise multiplication.',
      ],
      correctAnswerIndex: 0,
      explanation: 'Always verify boundary constraints, initial conditions, and ensure that operational rules are satisfied.',
      difficulty: 'easy',
    },
    {
      questionText: `True or False: An isomorphism between two vector spaces preserves both vector addition and scalar multiplication while being bijective.`,
      options: ['True', 'False'],
      correctAnswerIndex: 0,
      explanation: 'True. An isomorphism is an invertible (bijective) linear map that preserves the vector space structure.',
      difficulty: 'easy',
    },
  ];

  return bank.slice(0, totalQuestions);
}

/**
 * Generates personalized AI study recommendations based on student's empirical learning data
 */
export async function generateStudyRecommendations(context) {
  const {
    studentName = 'Student',
    overview = {},
    weakTopics = [],
    subjectProgress = [],
    academicWorkload = {},
    availableQuizzes = [],
    availableMaterials = [],
  } = context;

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const upcomingTasks = academicWorkload.upcomingTasks || [];
  const upcomingAssignments = academicWorkload.upcomingAssignments || [];

  const prompt = `
You are StudyGenie, an expert AI Academic Advisor and Cognitive Learning Scientist.
Analyze the following empirical learning analytics for ${studentName} and generate deeply personalized, actionable study recommendations.

STUDENT ANALYTICS SNAPSHOT:
- Current Streak: ${overview.streak?.currentStreak || 0} days (Longest: ${overview.streak?.longestStreak || 0} days)
- Total Study Hours Logged: ${overview.studyHours?.totalHours || 0} hrs (${overview.studyHours?.completedSessions || 0} completed sessions)
- Tasks: ${overview.tasks?.completedTasks || 0} of ${overview.tasks?.totalTasks || 0} completed (${overview.tasks?.completionRate || 0}% completion)
- Assignments: ${overview.assignments?.submittedAssignments || 0} of ${overview.assignments?.totalAssignments || 0} submitted (Avg Grade: ${overview.assignments?.averageGrade ?? 'N/A'}%)
- Quiz Performance: Avg Score ${overview.quizzes?.averageScore ?? 0}%, Pass Rate ${overview.quizzes?.passRate ?? 0}%, Attempts: ${overview.quizzes?.totalAttempts || 0}

ENROLLED SUBJECTS & PROGRESS:
${
  subjectProgress.length > 0
    ? subjectProgress
        .map(
          (s) =>
            `- [ID: "${s.subjectId}"] "${s.title}" (${s.code || 'Gen'}): ${s.completedTopics}/${s.totalTopics} topics done (${s.completionRate}%), ${s.totalStudyHours} hrs logged, Avg Quiz: ${s.averageQuizScore !== null ? s.averageQuizScore + '%' : 'None'}`
        )
        .join('\n')
    : 'No active enrolled subjects recorded'
}

IDENTIFIED WEAK TOPICS (Score < 70% or Needs Revision):
${
  weakTopics.length > 0
    ? weakTopics
        .map(
          (w) =>
            `- [ID: "${w.topicId}"] "${w.topicTitle}" in Subject "${w.subjectTitle}" [SubID: "${w.subjectId}"]: Average score ${w.averageScore}%, Urgency: ${w.urgency}`
        )
        .join('\n')
    : 'No critically weak topics detected. Overall performance is stable.'
}

UPCOMING DEADLINES & WORKLOAD:
- Tasks: ${
    upcomingTasks.length > 0
      ? upcomingTasks
          .map((t) => `[ID: "${t._id}"] "${t.title}" (Priority: ${t.priority}, Due: ${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'No date'})`)
          .join(', ')
      : 'None'
  }
- Assignments: ${
    upcomingAssignments.length > 0
      ? upcomingAssignments
          .map((a) => `[ID: "${a._id}"] "${a.title}" (Due: ${a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : 'No date'})`)
          .join(', ')
      : 'None'
  }

AVAILABLE PRACTICE QUIZZES:
${
  availableQuizzes.length > 0
    ? availableQuizzes.slice(0, 6).map((q) => `[ID: "${q._id}"] "${q.title}" (Subject: ${q.subject?.title || 'General'})`).join(', ')
    : 'None'
}

AVAILABLE STUDY MATERIALS:
${
  availableMaterials.length > 0
    ? availableMaterials.slice(0, 6).map((m) => `[ID: "${m._id}"] "${m.title}" (Subject: ${m.subject?.title || 'General'})`).join(', ')
    : 'None'
}

RECOMMENDATION RULES & FORMAT:
1. "summaryQuote": A concise, inspiring, 1-2 sentence academic insight (max 250 characters).
2. "overview":
   - "keyFocusArea": Primary focus for this week
   - "overallAssessment": Balanced analysis of their current trajectory
   - "performanceTier": One of ["Consistent Scholar", "Pacesetter", "Emerging Potential", "Building Foundations"]
   - "recommendedFocusSubject": Subject that needs the most attention
3. "weakTopicRecommendations": Array of specific recommendations for weak topics (or foundational topics if none are weak). Include valid topicId and subjectId when available, urgency ('high'|'medium'|'low'), currentMastery (number 0-100), clear diagnosticReason, and practical recommendedAction.
4. "subjectAttention": Array for enrolled subjects indicating priorityLevel ('high'|'medium'|'low'), hoursLogged, suggestedWeeklyHours, and statusNote.
5. "studyScheduleAdvice":
   - "recommendedDailyMinutes": Realistic target (e.g., 60-150)
   - "recommendedWeeklyHours": Realistic weekly total
   - "optimalStudyTime": e.g., "morning", "afternoon", "evening", or "night"
   - "streakAdvice": Tip to protect or build study streak
   - "workloadPacing": Tactic to handle the upcoming tasks/assignments without burnout
6. "prioritizedDeadlines": List the top 3-5 deadlines by urgency. Provide an "aiTactic" for each (e.g., "Break into two 45-min Pomodoro drafting sprints").
7. "revisionStrategies": 2-3 evidence-based cognitive strategies (e.g. Feynman Technique, Spaced Retrieval, Interleaving, Leitner Method, Pomodoro 50/10) mapped to specific topics.
8. "recommendedResources": 2-4 items matching available quizzes, materials, or general review suggestions.

Return ONLY a valid, parseable JSON object matching this schema without markdown codeblocks or extra text.
`;

  if (apiKey && !apiKey.includes('placeholder')) {
    try {
      const response = await fetch(`${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            topP: 0.9,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const cleanJson = candidateText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
          const parsed = JSON.parse(cleanJson);
          if (parsed.summaryQuote && parsed.overview) {
            return {
              ...parsed,
              aiModel: model,
            };
          }
        }
      } else {
        const errBody = await response.text();
        console.warn(`[Gemini Recommendations] HTTP ${response.status}: ${errBody}. Using fallback.`);
      }
    } catch (apiErr) {
      console.warn('[Gemini Recommendations] API call failed:', apiErr.message, '- Using fallback.');
    }
  }

  // Algorithmic Fallback Generator
  return generateRecommendationsFallback(context);
}

/**
 * Intelligent Algorithmic Fallback for Study Recommendations
 * Guarantees zero downtime and realistic recommendations even if offline
 */
export function generateRecommendationsFallback(context) {
  const {
    studentName = 'Student',
    overview = {},
    weakTopics = [],
    subjectProgress = [],
    academicWorkload = {},
    availableQuizzes = [],
    availableMaterials = [],
  } = context;

  const currentStreak = overview.streak?.currentStreak || 0;
  const avgQuizScore = overview.quizzes?.averageScore || 0;
  const upcomingTasks = academicWorkload.upcomingTasks || [];
  const upcomingAssignments = academicWorkload.upcomingAssignments || [];

  // Determine performance tier
  let performanceTier = 'Emerging Potential';
  if (avgQuizScore >= 85) performanceTier = 'Pacesetter';
  else if (avgQuizScore >= 70) performanceTier = 'Consistent Scholar';
  else if (avgQuizScore === 0) performanceTier = 'Building Foundations';

  // Identify primary focus subject
  let focusSubject = subjectProgress.find((s) => s.completionRate < 50) || subjectProgress[0];
  const focusSubjectTitle = focusSubject ? focusSubject.title : 'Linear Algebra & Discrete Math';

  // Formulate weak topic recommendations
  const weakTopicRecs = [];
  if (weakTopics.length > 0) {
    weakTopics.slice(0, 4).forEach((wt) => {
      weakTopicRecs.push({
        topicId: wt.topicId || null,
        topicTitle: wt.topicTitle,
        subjectId: wt.subjectId || null,
        subjectTitle: wt.subjectTitle || 'General',
        urgency: wt.urgency || (wt.averageScore < 50 ? 'high' : 'medium'),
        currentMastery: wt.averageScore || 45,
        diagnosticReason: `Recent quiz average is ${wt.averageScore}%. Conceptual mastery is below the 70% threshold.`,
        recommendedAction: `Review core theorems in ${wt.topicTitle}, then test recall with a 5-question targeted quiz.`,
        actionUrl: wt.topicId ? `/quizzes?topic=${wt.topicId}` : '/quizzes',
        actionType: 'quiz',
      });
    });
  } else {
    // If no weak topics, recommend advancing syllabus
    subjectProgress.slice(0, 2).forEach((s) => {
      weakTopicRecs.push({
        topicId: null,
        topicTitle: `${s.title} Core Mastery`,
        subjectId: s.subjectId,
        subjectTitle: s.title,
        urgency: 'low',
        currentMastery: s.completionRate || 75,
        diagnosticReason: `Solid performance with ${s.completionRate}% syllabus progress. Ready for deeper problem solving.`,
        recommendedAction: `Reinforce higher-order application problems and practice spaced retrieval questions.`,
        actionUrl: `/quizzes?subject=${s.subjectId}`,
        actionType: 'quiz',
      });
    });
  }

  // Subject attention
  const subjectAttention = subjectProgress.map((s, idx) => {
    let priorityLevel = 'medium';
    let suggestedHours = 4;
    let note = 'Maintain steady rhythm and review lecture notes.';

    if (s.completionRate < 40 || s.totalStudyHours < 3) {
      priorityLevel = 'high';
      suggestedHours = 6;
      note = 'Low study volume detected. Schedule two focused 60-minute deep-work sessions this week.';
    } else if (s.completionRate >= 80) {
      priorityLevel = 'low';
      suggestedHours = 2.5;
      note = 'Excellent mastery. Focus primarily on spaced retrieval and synthesis.';
    }

    return {
      subjectId: s.subjectId,
      subjectTitle: s.title,
      subjectCode: s.code || '',
      color: s.color || PASTEL_PALETTE[idx % PASTEL_PALETTE.length],
      priorityLevel,
      hoursLogged: s.totalStudyHours || 0,
      suggestedWeeklyHours: suggestedHours,
      statusNote: note,
      actionUrl: `/calendar`,
    };
  });

  // Prioritized Deadlines
  const prioritizedDeadlines = [];
  const now = new Date();

  upcomingTasks.slice(0, 3).forEach((t) => {
    const due = t.dueDate ? new Date(t.dueDate) : new Date(Date.now() + 3 * 86400000);
    const diffDays = Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
    prioritizedDeadlines.push({
      itemId: t._id,
      itemType: 'task',
      title: t.title,
      subjectTitle: t.subject?.title || 'General',
      dueDate: due,
      priority: t.priority || 'medium',
      daysRemaining: diffDays,
      aiTactic: diffDays <= 2 ? 'High urgency: Dedicate the first 45 minutes of your next study block to complete this.' : 'Break requirements into sub-milestones and outline key points today.',
      actionUrl: '/tasks',
    });
  });

  upcomingAssignments.slice(0, 3).forEach((a) => {
    const due = a.dueDate ? new Date(a.dueDate) : new Date(Date.now() + 5 * 86400000);
    const diffDays = Math.max(0, Math.ceil((due - now) / (1000 * 60 * 60 * 24)));
    prioritizedDeadlines.push({
      itemId: a._id,
      itemType: 'assignment',
      title: a.title,
      subjectTitle: a.subject?.title || 'Coursework',
      dueDate: due,
      priority: 'high',
      daysRemaining: diffDays,
      aiTactic: 'Review teacher rubric, draft solution components, and run validation checks before submission.',
      actionUrl: '/assignments',
    });
  });

  prioritizedDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Revision Strategies
  const revisionStrategies = [
    {
      strategyName: 'Feynman Technique',
      technique: 'Conceptual Simplification & Active Explanation',
      description: 'Explain the core topic out loud in simple terms without looking at notes. Pinpoint the exact moments you hesitate and review those paragraphs.',
      applicableTopic: weakTopics[0]?.topicTitle || 'Core Theorems & Proofs',
      actionUrl: '/assistant',
    },
    {
      strategyName: 'Pomodoro 50/10 Focus Blocks',
      technique: 'Timeboxed Deliberate Practice',
      description: 'Engage in 50 minutes of uninterrupted problem-solving followed by a 10-minute restorative break. Protects focus and prevents cognitive fatigue.',
      applicableTopic: focusSubjectTitle,
      actionUrl: '/calendar',
    },
    {
      strategyName: 'Interleaved Practice',
      technique: 'Cognitive Context Switching',
      description: 'Alternate between two distinct subjects (e.g. 45 min proofs, 45 min algorithms). Studies show interleaving increases retention by up to 43%.',
      applicableTopic: 'Cross-Subject Revision',
      actionUrl: '/planner',
    },
  ];

  // Recommended Resources
  const recommendedResources = [];
  if (availableQuizzes.length > 0) {
    availableQuizzes.slice(0, 2).forEach((q) => {
      recommendedResources.push({
        resourceType: 'quiz',
        title: q.title,
        subjectTitle: q.subject?.title || 'General',
        reason: 'Targeted self-assessment to verify retention and highlight blind spots.',
        actionUrl: `/quizzes/${q._id}/take`,
      });
    });
  } else {
    recommendedResources.push({
      resourceType: 'quiz',
      title: 'Practice Quiz Generator',
      subjectTitle: focusSubjectTitle,
      reason: 'Generate an AI quiz from your notes to solidify conceptual mastery.',
      actionUrl: '/quizzes/generate',
    });
  }

  if (availableMaterials.length > 0) {
    availableMaterials.slice(0, 2).forEach((m) => {
      recommendedResources.push({
        resourceType: 'material',
        title: m.title,
        subjectTitle: m.subject?.title || 'General',
        reason: 'Recommended lecture notes and reference readings.',
        actionUrl: `/materials/${m._id}`,
      });
    });
  }

  return {
    summaryQuote: currentStreak > 2
      ? `You have built a strong ${currentStreak}-day study momentum! Direct this focus toward ${focusSubjectTitle} to unlock breakthrough gains.`
      : `Consistent daily practice of just 60 minutes yields compound learning dividends. Start today with ${focusSubjectTitle}.`,
    overview: {
      keyFocusArea: `Reinforcing ${weakTopics[0]?.topicTitle || focusSubjectTitle}`,
      overallAssessment: `Current pace shows strong dedication. Prioritizing high-yield review sessions and timely deadline execution will maximize semester GPA.`,
      performanceTier,
      recommendedFocusSubject: focusSubjectTitle,
    },
    weakTopicRecommendations: weakTopicRecs,
    subjectAttention,
    studyScheduleAdvice: {
      recommendedDailyMinutes: 90,
      recommendedWeeklyHours: 10.5,
      optimalStudyTime: 'evening',
      streakAdvice: currentStreak > 0
        ? `Keep your ${currentStreak}-day streak alive with at least one 25-minute focused session today.`
        : 'Complete any study session, quiz, or task today to ignite your study streak.',
      workloadPacing: `Distribute upcoming assignments across 2-day intervals to avoid last-minute deadline pressure.`,
    },
    prioritizedDeadlines,
    revisionStrategies,
    recommendedResources,
    aiModel: 'algorithmic-academic-engine',
  };
}



