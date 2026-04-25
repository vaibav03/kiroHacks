import { NextResponse } from 'next/server';
import { fetchEnrichment } from '@/lib/gemini';
import { TutorId } from '@/lib/tutors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { responseText, tutorId } = body;

    if (!responseText || !tutorId) {
      return NextResponse.json(
        { error: 'Missing required fields: responseText, tutorId' },
        { status: 400 }
      );
    }

    const result = await fetchEnrichment(responseText, tutorId as TutorId);

    const filteredVideos = result.videos
      .filter(
        (v) =>
          v.url.startsWith('https://www.youtube.com/watch?v=') ||
          v.url.startsWith('https://youtu.be/')
      )
      .slice(0, 3);

    const filteredArticles = result.articles
      .filter((a) => a.url.startsWith('https://'))
      .slice(0, 3);

    return NextResponse.json({
      videos: filteredVideos,
      articles: filteredArticles,
    });
  } catch (error) {
    console.error('Enrichment Error:', error);
    return NextResponse.json(
      { error: 'Enrichment failed' },
      { status: 500 }
    );
  }
}
