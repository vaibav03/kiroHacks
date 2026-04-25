import { GoogleGenerativeAI } from '@google/generative-ai';
import { TutorId, TUTORS } from './tutors';

export interface EnrichmentItem {
  url: string;
  title: string;
}

export interface EnrichmentResult {
  videos: EnrichmentItem[];
  articles: EnrichmentItem[];
}

export function buildPrompt(responseText: string, tutorId: TutorId): string {
  const tutor = TUTORS[tutorId];
  return `You are a helpful educational assistant. Given the following tutor response about
${tutor.domainTitle} by ${tutor.name}, suggest up to 3 real YouTube videos and up to 3 real
blog posts or articles that a student could use to learn more about the specific
topic discussed.

Tutor response:
"""
${responseText}
"""

Return ONLY a raw JSON object (no markdown, no code fences) with this exact structure:
{
  "videos": [{ "url": "https://www.youtube.com/watch?v=...", "title": "..." }],
  "articles": [{ "url": "https://...", "title": "..." }]
}

Rules:
- Only suggest real, existing URLs. Do not fabricate links.
- All content must be educational and age-appropriate for students.
- YouTube URLs must use the https://www.youtube.com/watch?v= format.
- Article URLs must use HTTPS.
- If you cannot find enough real resources, return fewer items. Do not pad with placeholders.`;
}

export async function fetchEnrichment(
  responseText: string,
  tutorId: TutorId
): Promise<EnrichmentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { videos: [], articles: [] };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = buildPrompt(responseText, tutorId);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return parseEnrichmentResponse(text);
}

export function parseEnrichmentResponse(text: string): EnrichmentResult {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
    };
  } catch {
    return { videos: [], articles: [] };
  }
}
