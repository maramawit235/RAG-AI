import { NextResponse } from "next/server";
import { generateEmbedding } from "../../lib/embeddings";
import { supabase } from "../../lib/supabaseClient";
import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Define types for better TypeScript support
interface DocumentChunk {
  chunk_id: string;
  embedding: number[] | string;
  document_chunks: {
    content: string;
    document_id: string;
    documents: {
      title: string | null;
      file_name: string;
    };
  };
}

interface RelevantChunk {
  content: string;
  documentTitle: string;
  similarity: number;
}

// Manual similarity search fallback function
async function manualSimilaritySearch(queryEmbedding: number[], limit: number): Promise<RelevantChunk[]> {
  try {
    // Get all chunks with their embeddings
    const { data: chunks, error } = await supabase
      .from('document_embeddings')
      .select(`
        chunk_id,
        embedding,
        document_chunks!inner (
          content,
          document_id,
          documents!inner (
            title,
            file_name
          )
        )
      `);

    if (error) throw error;
    if (!chunks || chunks.length === 0) return [];

    console.log(`Manually comparing ${chunks.length} chunks`);

    const chunksWithScores: RelevantChunk[] = chunks
      .map((item: any) => {
        // Handle embedding - it might be a string or array
        let embedding = item.embedding;
        if (typeof embedding === 'string') {
          try {
            // Parse if it's a JSON string
            embedding = JSON.parse(embedding);
          } catch {
            // If it's a pgvector string format, clean it
            const cleaned = embedding.replace(/[\[\]]/g, '').split(',').map(Number);
            embedding = cleaned;
          }
        }
        
        // Ensure it's an array
        const embeddingArray = Array.isArray(embedding) ? embedding : [];
        
        // Calculate cosine similarity
        const similarity = calculateCosineSimilarity(queryEmbedding, embeddingArray);
        
        // Safely access nested properties
        const content = item.document_chunks?.content || '';
        const documents = item.document_chunks?.documents || {};
        const documentTitle = documents.title || documents.file_name || 'Unknown';
        
        return {
          content,
          documentTitle,
          similarity
        };
      })
      .filter(item => item.similarity > 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`Found ${chunksWithScores.length} relevant chunks manually`);
    return chunksWithScores;

  } catch (error) {
    console.error("Manual search error:", error);
    return [];
  }
}

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length) return 0;
  
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    console.log("💬 Chat request:", userMessage);

    // Step 1: Generate embedding for the query
    console.log("Generating query embedding...");
    const queryEmbedding = await generateEmbedding(userMessage);
    console.log(`Query embedding generated (length: ${queryEmbedding.length})`);

    // Step 2: Try vector search with Supabase RPC
    console.log("Attempting vector search with Supabase...");
    const { data: chunks, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: 5
    });

    let relevantChunks: RelevantChunk[] = [];

    if (error) {
      console.error("RPC error:", error);
      // Fall back to manual search
      console.log("Falling back to manual similarity search...");
      relevantChunks = await manualSimilaritySearch(queryEmbedding, 5);
    } else {
      console.log(`Found ${chunks?.length || 0} chunks via vector search`);
      relevantChunks = (chunks || []).map((c: any) => ({
        content: c.content || '',
        documentTitle: c.documentTitle || 'Unknown',
        similarity: c.similarity || 0
      }));
    }

    console.log(`Total relevant chunks found: ${relevantChunks.length}`);

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        role: 'assistant',
        content: "I couldn't find any relevant information in your documents. Try asking about something specific that you know is in your uploaded files."
      });
    }

    // Step 3: Build context from chunks
    const context = relevantChunks.map(chunk => chunk.content).join('\n\n---\n\n');
    console.log(`Context built (${context.length} characters)`);

    // Step 4: Generate response with Hugging Face
    console.log("Calling Hugging Face API...");
    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      inputs: `<s>[INST] You are a helpful assistant that answers questions based on the provided context.

Context:
${context}

Question: ${userMessage} [/INST]`,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.5,
        top_p: 0.95,
      },
    });

    console.log("✅ Response generated successfully");

    return NextResponse.json({
      role: 'assistant',
      content: response.generated_text,
      sources: relevantChunks.map((c: RelevantChunk) => ({
        content: c.content.substring(0, 200) + "...",
        document: c.documentTitle,
        similarity: Math.round(c.similarity * 100) / 100
      }))
    });

  } catch (error: any) {
    console.error("❌ Chat error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate response",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}