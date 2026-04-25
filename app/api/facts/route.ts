import { NextResponse } from 'next/server';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { TUTORS } from '@/lib/tutors';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: Request) {
  try {
    const { tutorId } = await req.json();
    
    if (!tutorId || !TUTORS[tutorId]) {
      return NextResponse.json({ error: "Invalid tutorId" }, { status: 400 });
    }

    const tutor = TUTORS[tutorId];
    const prompt = `You are generating fun, kid-friendly educational content.
Generate 5 interesting, surprising, or funny facts/timeline events about ${tutor.name}.
Keep each fact under 15 words so it's punchy and easy to read.

Return the response EXACTLY as a raw JSON array of strings, like this:
["Fact 1", "Fact 2", "Fact 3", "Fact 4", "Fact 5"]`;

    const cmd = new ConverseCommand({
      modelId: process.env.BEDROCK_PRIMARY_MODEL || 'deepseek.v3.2',
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 500, temperature: 0.7 }
    });

    const result = await bedrockClient.send(cmd);
    let text = result.output?.message?.content?.[0]?.text || "[]";
    
    // Clean up JSON formatting
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const facts = JSON.parse(text);

    return NextResponse.json({ facts });
  } catch (error: any) {
    console.error("Facts API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
