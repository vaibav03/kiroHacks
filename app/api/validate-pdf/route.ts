import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';
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
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const domainStr = formData.get('domain') as string;

    if (!file || !domainStr) {
      return NextResponse.json({ error: "Missing file or domain" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdfData = await extractText(new Uint8Array(arrayBuffer));
    const pdfText = pdfData.text.join('\n').substring(0, 5000);

    const domainTitle = Object.values(TUTORS).find(t => t.domain === domainStr)?.domainTitle || domainStr;

    const prompt = `You are a domain classifier. I will provide you with the text of an uploaded PDF chapter.
Your job is to determine if the text is relevant to the domain: "${domainTitle}".
Respond ONLY with a JSON object in the exact format:
{ "matches": true/false, "confidence": float between 0.0 and 1.0, "reason": "brief explanation" }

PDF Text:
${pdfText}`;

    const cmd = new ConverseCommand({
      modelId: process.env.BEDROCK_PRIMARY_MODEL || 'deepseek.v3.2',
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 500, temperature: 0.1 }
    });

    const result = await bedrockClient.send(cmd);
    const responseText = result.output?.message?.content?.[0]?.text || "{}";

    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const classification = JSON.parse(jsonStr);

    return NextResponse.json(classification);
  } catch (error: any) {
    console.error("PDF Validation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
