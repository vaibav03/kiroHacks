import { NextResponse } from 'next/server';

const sessions = new Map<string, any>();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = sessions.get(params.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  sessions.set(params.id, { ...data, sessionId: params.id, createdAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
