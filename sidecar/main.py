import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chromadb
from typing import List, Dict, Any

app = FastAPI(title="HistorAI Chroma Sidecar")

# Initialize Chroma client
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "chroma")
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="tutors")

class QueryRequest(BaseModel):
    tutorId: str
    queryEmbedding: List[float]
    topK: int = 5

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/query")
def query_collection(request: QueryRequest):
    try:
        results = collection.query(
            query_embeddings=[request.queryEmbedding],
            n_results=request.topK,
            where={"tutorId": request.tutorId}
        )
        
        chunks = []
        if results and results["documents"] and len(results["documents"][0]) > 0:
            for i in range(len(results["documents"][0])):
                chunk = {
                    "text": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "id": results["ids"][0][i],
                    "distance": results["distances"][0][i] if "distances" in results and results["distances"] else None
                }
                chunks.append(chunk)
                
        return {"chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
