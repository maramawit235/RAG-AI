import { generateEmbedding } from './embeddings';
import { supabase } from './supabaseClient';

export async function searchSimilarChunks(query: string, limit: number = 5) {
  try {
    console.log("🔍 Searching for:", query);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log(`Query embedding generated (length: ${queryEmbedding.length})`);

    // Use Supabase's vector similarity search (if you have pgvector enabled)
    const { data: chunks, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: limit
    });

    if (error) {
      console.error("RPC error:", error);
      
      // Fallback: Get all chunks and calculate manually
      console.log("Falling back to manual similarity calculation...");
      return await manualSimilaritySearch(queryEmbedding, limit);
    }

    console.log(`Found ${chunks?.length || 0} chunks via RPC`);
    return chunks || [];

  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

async function manualSimilaritySearch(queryEmbedding: number[], limit: number) {
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

    const chunksWithScores = chunks
      .map(item => {
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
        
        return {
          content: item.document_chunks.content,
          documentTitle: item.document_chunks.documents.title || item.document_chunks.documents.file_name,
          similarity
        };
      })
      .filter(item => item.similarity > 0.2) // Lower threshold for testing
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`Found ${chunksWithScores.length} relevant chunks manually`);
    chunksWithScores.forEach(c => {
      console.log(`Similarity: ${c.similarity.toFixed(3)} - Preview: ${c.content.substring(0, 50)}...`);
    });

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