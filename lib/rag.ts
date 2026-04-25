import { bedrockClient } from './bedrock';
import { queryChroma } from './chroma';
import { SYSTEM_PROMPTS } from './personas';
import { TutorId } from './tutors';
import { InvokeModelCommand, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

export interface RagResponse {
  message: string;
  citations: Array<{
    id: number;
    source: string;
    year: string;
    url: string;
  }>;
}

export async function generateRagResponse(message: string, tutorId: TutorId): Promise<RagResponse> {
  // 1. Embed the query (Titan Embed uses InvokeModel)
  const embedCmd = new InvokeModelCommand({
    modelId: process.env.BEDROCK_EMBEDDING_MODEL || 'amazon.titan-embed-text-v2:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({ inputText: message }),
  });
  const embedRes = await bedrockClient.send(embedCmd);
  const embedding = JSON.parse(new TextDecoder().decode(embedRes.body)).embedding;

  // 2. Query Chroma
  const { chunks } = await queryChroma(tutorId, embedding, 5);

  // 3. Format context & citations
  let contextStr = '';
  const citations: RagResponse['citations'] = [];
  
  chunks.forEach((chunk, index) => {
    const citationId = index + 1;
    contextStr += `[Citation ${citationId}]: ${chunk.text}\n\n`;
    citations.push({
      id: citationId,
      source: chunk.metadata.source,
      year: chunk.metadata.year,
      url: chunk.metadata.url,
    });
  });

  // 4. Prompt for DeepSeek (Converse API)
  const systemPrompt = SYSTEM_PROMPTS[tutorId];
  const userMessage = `Context:\n${contextStr}\n\nUser Question: ${message}\n\nWhen answering, use the provided context. Cite your sources using [Citation N].`;

  const converseConfig = {
    modelId: process.env.BEDROCK_PRIMARY_MODEL || 'deepseek.v3.2',
    messages: [
      {
        role: "user" as const,
        content: [{ text: userMessage }]
      }
    ],
    system: [{ text: systemPrompt }],
    inferenceConfig: { maxTokens: 1000 }
  };

  // 5. Invoke DeepSeek (with fallback)
  let result;
  
  try {
    const chatCmd = new ConverseCommand(converseConfig);
    result = await bedrockClient.send(chatCmd);
  } catch (error) {
    console.warn("Primary model failed, trying fallback...", error);
    converseConfig.modelId = process.env.BEDROCK_FALLBACK_MODEL || 'deepseek.v3-v1:0';
    const fallbackCmd = new ConverseCommand(converseConfig);
    result = await bedrockClient.send(fallbackCmd);
  }

  return {
    message: result.output?.message?.content?.[0]?.text || "",
    citations,
  };
}
