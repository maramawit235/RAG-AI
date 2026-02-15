// app/lib/embeddings.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use the current stable embedding model
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text);
    const fullEmbedding = result.embedding.values; // 3072 dimensions
    
    // TRUNCATE to 384 dimensions (your database requirement)
    const truncatedEmbedding = fullEmbedding.slice(0, 384);
    
    console.log(`✅ Generated embedding: ${fullEmbedding.length} → ${truncatedEmbedding.length} dimensions`);
    
    return truncatedEmbedding;
  } catch (error) {
    console.error("Error generating embedding with Gemini:", error);
    throw error;
  }
}