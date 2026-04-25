import { NextResponse } from 'next/server';
import { generateTTS } from '@/lib/tts';
import { TutorId } from '@/lib/tutors';

export async function POST(req: Request) {
  try {
    const { text, tutorId } = await req.json();
    
    if (!text || !tutorId) {
      return NextResponse.json({ error: "Missing text or tutorId" }, { status: 400 });
    }

    const audioBuffer = await generateTTS(text, tutorId as TutorId);
    
    return new NextResponse(audioBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
