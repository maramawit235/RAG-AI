import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabaseClient';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const docId = params.id;

    const { data: chunkRows, error: chunkError } = await supabase
      .from('document_chunks')
      .select('id,content,created_at')
      .eq('document_id', docId);

    if (chunkError) {
      console.error('chunkRows error', chunkError);
      return NextResponse.json({ error: 'Failed to fetch chunks' }, { status: 500 });
    }

    const chunkIds = (chunkRows || []).map((r: any) => r.id).filter(Boolean);

    const { data: embedRows, error: embedError } = await supabase
      .from('document_embeddings')
      .select('id,chunk_id,embedding,created_at')
      .in('chunk_id', chunkIds);

    if (embedError) {
      console.error('embedRows error', embedError);
      return NextResponse.json({ error: 'Failed to fetch embeddings' }, { status: 500 });
    }

    return NextResponse.json({
      documentId: docId,
      chunkCount: chunkRows?.length || 0,
      chunks: chunkRows || [],
      embeddingCount: embedRows?.length || 0,
      embeddingsSample: (embedRows || []).slice(0, 5)
    });
  } catch (err) {
    console.error('debug exception', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
