import { TutorId } from './tutors';

const ELEVENLABS_VOICES: Record<TutorId, string> = {
  einstein: 'qqiFHI7t1aYvjDqLfKyn', // User's custom German Voice
  lincoln: 'GItsBxIAQE9rutcHFPK3', // User's custom Lincoln Voice
  mozart: 'ErXwobaYiN019PkySvjV', // Antoni (Energetic)
  shakespeare: '2EiwWnXFnvU5JabPnv8n', // Clyde (Theatrical)
};

export async function generateTTS(text: string, tutorId: TutorId): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY in .env.local");
  }

  const voiceId = ELEVENLABS_VOICES[tutorId] || ELEVENLABS_VOICES.einstein;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      }
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs API Error: ${response.status} - ${errText}`);
  }

  return await response.arrayBuffer();
}
