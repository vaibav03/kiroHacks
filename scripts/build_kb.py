import os
import json
import boto3
import chromadb
import tiktoken

def chunk_text(text, chunk_size=500, overlap=50):
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    chunks = []
    
    start = 0
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(enc.decode(chunk_tokens))
        if end == len(tokens):
            break
        start += chunk_size - overlap
        
    return chunks

def build_kb():
    # Initialize AWS Bedrock client
    try:
        bedrock = boto3.client('bedrock-runtime', region_name=os.getenv("AWS_REGION", "us-west-2"))
    except Exception as e:
        print(f"Error initializing boto3 client: {e}")
        return

    # Initialize ChromaDB persistent client
    chroma_path = os.path.join(os.path.dirname(__file__), "..", "data", "chroma")
    chroma_client = chromadb.PersistentClient(path=chroma_path)
    collection = chroma_client.get_or_create_collection(name="tutors")

    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "kb")
    
    tutor_ids = ["einstein", "lincoln", "mozart", "shakespeare"]
    
    total_chunks = 0
    
    for tutor_id in tutor_ids:
        tutor_dir = os.path.join(data_dir, tutor_id)
        if not os.path.exists(tutor_dir):
            print(f"Directory not found: {tutor_dir}")
            continue
            
        for filename in os.listdir(tutor_dir):
            if not filename.endswith(".txt"):
                continue
                
            filepath = os.path.join(tutor_dir, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Basic metadata inference
            source = filename.replace(".txt", "").replace("_", " ").title()
            
            chunks = chunk_text(content, chunk_size=500, overlap=50)
            print(f"Processing {filepath} -> {len(chunks)} chunks")
            
            for i, chunk in enumerate(chunks):
                # 1. Get embedding from Titan
                body = json.dumps({"inputText": chunk})
                try:
                    response = bedrock.invoke_model(
                        body=body,
                        modelId="amazon.titan-embed-text-v2:0",
                        accept="application/json",
                        contentType="application/json"
                    )
                    response_body = json.loads(response['body'].read())
                    embedding = response_body['embedding']
                    
                    # 2. Save to Chroma
                    doc_id = f"{tutor_id}_{filename}_chunk_{i}"
                    
                    # Add required metadata
                    metadata = {
                        "tutorId": tutor_id,
                        "source": source,
                        "year": "Unknown", # You can parse this from content if needed
                        "url": f"https://en.wikipedia.org/wiki/{source.replace(' ', '_')}"
                    }
                    
                    collection.add(
                        ids=[doc_id],
                        embeddings=[embedding],
                        documents=[chunk],
                        metadatas=[metadata]
                    )
                    
                    total_chunks += 1
                except Exception as e:
                    print(f"Error processing chunk {i} for {tutor_id}: {e}")

    print(f"Successfully built KB. Total chunks added: {total_chunks}")

if __name__ == "__main__":
    build_kb()
