import { NextResponse } from "next/server";
import { generateEmbedding } from "../../lib/embeddings"; // This now uses Gemini
import { supabase } from "../../lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, selectedDocumentId: clientSelectedDocumentId } = body;
    const userMessage = messages[messages.length - 1].content;

    // Get relevant chunks using embeddings
    const queryEmbedding = await generateEmbedding(userMessage);
    // If the user explicitly mentions a filename (or says "this file"), try to prefer that document.
    const filenameMatch = userMessage.match(/([\w\s\-_.]+\.(pdf|docx|txt|md|csv))/i);

    let chunksQuery;
    let selectedDocId: string | null = null;

    // If client provided a document selection, prefer it
    if (clientSelectedDocumentId) {
      selectedDocId = clientSelectedDocumentId;
      const { data: chunkRows } = await supabase
        .from('document_chunks')
        .select('id')
        .eq('document_id', clientSelectedDocumentId);

      const chunkIds = (chunkRows || []).map((r: any) => r.id).filter(Boolean);
      if (chunkIds.length > 0) {
        chunksQuery = supabase
          .from('document_embeddings')
          .select(`embedding, document_chunks ( content, documents ( title ) )`)
          .in('chunk_id', chunkIds);
      }
    }
    if (filenameMatch) {
      const name = filenameMatch[1];
      // try to find a document with matching file_name or title
      const { data: matchedDocs } = await supabase
        .from('documents')
        .select('id,title,file_name')
        .ilike('file_name', `%${name}%`)
        .limit(1);

      console.log('chat: filenameMatch ->', name, 'matchedDocs count=', matchedDocs?.length);

      if (matchedDocs && matchedDocs.length > 0) {
        const docId = matchedDocs[0].id;
        selectedDocId = docId;

        // Get chunk ids for the document, then query embeddings by chunk_id
        const { data: chunkRows } = await supabase
          .from('document_chunks')
          .select('id')
          .eq('document_id', docId);

        const chunkIds = (chunkRows || []).map((r: any) => r.id).filter(Boolean);
        if (chunkIds.length > 0) {
          chunksQuery = supabase
            .from('document_embeddings')
            .select(`embedding, document_chunks ( content, documents ( title ) )`)
            .in('chunk_id', chunkIds);
        }
      }
    }

    // If we didn't build a chunksQuery above (no filename match or no doc found),
    // prefer the most recently uploaded document when user references "the file" or similar.
    if (!chunksQuery) {
      // pick most recent document
      const { data: recent } = await supabase
        .from('documents')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('chat: recent documents count=', recent?.length);

      if (recent && recent.length > 0) {
        const recentId = recent[0].id;
        selectedDocId = recentId;

        const { data: chunkRows } = await supabase
          .from('document_chunks')
          .select('id')
          .eq('document_id', recentId);

        const chunkIds = (chunkRows || []).map((r: any) => r.id).filter(Boolean);
        if (chunkIds.length > 0) {
          chunksQuery = supabase
            .from('document_embeddings')
            .select(`embedding, document_chunks ( content, documents ( title ) )`)
            .in('chunk_id', chunkIds);
        }
      }
    }

    // fallback: query all chunks if we still don't have a document-specific query
    if (!chunksQuery) {
      chunksQuery = supabase
        .from('document_embeddings')
        .select(`embedding, document_chunks!inner ( content, documents!inner (title) )`);
    }

    let { data: chunks } = await chunksQuery;

    console.log('chat: chunks count=', chunks?.length);

    // If we selected a specific document but found no chunks, gather diagnostics and try a global fallback
    if (!chunks || chunks.length === 0) {
      if (selectedDocId) {
        // count chunks for the selected document
        const { data: chunkRows } = await supabase
          .from('document_chunks')
          .select('id')
          .eq('document_id', selectedDocId);

        console.log('chat: document_chunks for selectedDocId=', selectedDocId, 'count=', chunkRows?.length);

        // check embeddings for those chunk ids
        const chunkIds = (chunkRows || []).map((r: any) => r.id).filter(Boolean);
        let embeddingCount = 0;
        if (chunkIds.length > 0) {
          const { data: embedRows } = await supabase
            .from('document_embeddings')
            .select('chunk_id')
            .in('chunk_id', chunkIds);
          embeddingCount = embedRows?.length || 0;
          console.log('chat: embeddings for selected doc chunk count=', embeddingCount);
        }

        // Try fallback to all chunks before giving up
        const { data: allChunks } = await supabase
          .from('document_embeddings')
          .select(`embedding, document_chunks!inner ( content, documents!inner (title) )`)
          .limit(200);

        if (allChunks && allChunks.length > 0) {
          console.log('chat: falling back to allChunks count=', allChunks.length);
          chunks = allChunks;
        } else {
          return NextResponse.json({
            role: 'assistant',
            content: "No documents found. Please upload a document first. Debug: selectedDocId=" + selectedDocId +
                     ", docChunkCount=" + (chunkRows?.length||0) + ", embeddingCount=" + embeddingCount +
                     ", sampleDocs=" + JSON.stringify((await supabase.from('documents').select('id,file_name').limit(5)).data)
          });
        }
      } else {
        // no specific doc selected and no chunks returned — try global fallback
        const { data: allChunks } = await supabase
          .from('document_embeddings')
          .select(`embedding, document_chunks!inner ( content, documents!inner (title) )`)
          .limit(200);

        if (allChunks && allChunks.length > 0) {
          chunks = allChunks;
        } else {
          return NextResponse.json({
            role: 'assistant',
            content: "No documents found. Please upload a document first. Debug: matchedFilename=" + (filenameMatch?.[1]||'') +
                     ", sampleDocs=" + JSON.stringify((await supabase.from('documents').select('id,file_name').limit(5)).data)
          });
        }
      }
    }

    // Compute similarity for all chunks and pick top N
    const scored = (chunks || []).map((item: any) => ({
      content: item.document_chunks.content,
      title: item.document_chunks.documents.title,
      embedding: Array.isArray(item.embedding) ? item.embedding : [],
      similarity: calculateCosineSimilarity(queryEmbedding, Array.isArray(item.embedding) ? item.embedding : [])
    }));

    const top = scored.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    const context = top.map(t => `Title: ${t.title || 'Document'}\n${t.content}`).join('\n\n---\n\n');

    // Generate response with Gemini using combined context
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a helpful assistant. Answer based on this context:\n\n${context}\n\nQuestion: ${userMessage}\n\nAnswer:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json({
      role: 'assistant',
      content: response,
      sources: top.map(t => ({ content: t.content.substring(0, 200) + '...', document: t.title || 'Document', similarity: t.similarity }))
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