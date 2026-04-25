const CHROMA_URL = process.env.CHROMA_SIDECAR_URL || 'http://localhost:8000';

export async function waitForSidecar(maxAttempts = 5, intervalMs = 1000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${CHROMA_URL}/health`, { next: { revalidate: 0 } });
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return false;
}

export interface ChromaChunk {
  text: string;
  metadata: {
    tutorId: string;
    source: string;
    year: string;
    url: string;
  };
  id: string;
  distance: number;
}

export async function queryChroma(tutorId: string, queryEmbedding: number[], topK = 5): Promise<{ chunks: ChromaChunk[] }> {
  const res = await fetch(`${CHROMA_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tutorId, queryEmbedding, topK }),
    cache: 'no-store'
  });
  
  if (!res.ok) {
    throw new Error(`Chroma sidecar error: ${res.statusText}`);
  }
  
  return res.json();
}
