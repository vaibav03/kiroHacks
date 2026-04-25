import { NextResponse } from 'next/server';
import { generateRagResponse } from '@/lib/rag';
import { waitForSidecar } from '@/lib/chroma';
import { TutorId } from '@/lib/tutors';

export async function POST(req: Request) {
  try {
    const { message, tutorId, sessionId } = await req.json();
    
    // Cold start check
    const isSidecarUp = await waitForSidecar();
    if (!isSidecarUp) {
      return NextResponse.json({ error: "Vector store unavailable" }, { status: 503 });
    }
    
    const response = await generateRagResponse(message, tutorId as TutorId);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
