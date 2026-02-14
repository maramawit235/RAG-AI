import { NextResponse } from "next/server";
import { generateEmbedding } from "../../lib/embeddings"; // This now uses Gemini
import { supabase } from "../../lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    // Get relevant chunks using embeddings
    const queryEmbedding = await generateEmbedding(userMessage);
    
    const { data: chunks } = await supabase
      .from('document_embeddings')
      .select(`
        embedding,
        document_chunks!inner (
          content,
          documents!inner (title)
        )
      `);

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        role: 'assistant',
        content: "No documents found. Please upload a document first."
      });
    }

    // Find most relevant chunk
    const relevantChunk = chunks
      .map((item: any) => ({
        content: item.document_chunks.content,
        title: item.document_chunks.documents.title,
        similarity: calculateCosineSimilarity(
          queryEmbedding,
          Array.isArray(item.embedding) ? item.embedding : []
        )
      }))
      .sort((a, b) => b.similarity - a.similarity)[0];

    // Generate response with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `You are a helpful assistant. Answer based on this context:

Context: ${relevantChunk.content}

Question: ${userMessage}

Answer:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({
      role: 'assistant',
      content: response,
      sources: [{
        content: relevantChunk.content.substring(0, 200) + "...",
        document: relevantChunk.title || 'Document'
      }]
    });

  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length) return 0;
  const dot = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}