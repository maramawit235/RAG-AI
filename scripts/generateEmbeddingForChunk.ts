import 'dotenv/config';
import { createClient } from '../app/lib/supabaseClient';
import { generateEmbedding } from '../app/lib/embeddings';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const serverSupabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

async function generateEmbeddingForChunk(chunkId: string, content: string) {
  try {
    console.log('Generating embedding for chunk', chunkId);
    const embedding = await generateEmbedding(content);
    console.log('Embedding length:', Array.isArray(embedding) ? embedding.length : typeof embedding);

    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.error('Invalid embedding generated');
      process.exit(1);
    }

    const { data, error } = await serverSupabase
      .from('document_embeddings')
      .insert([{ chunk_id: chunkId, embedding }])
      .select();

    if (error) {
      console.error('Failed to insert embedding:', error);
      process.exit(1);
    }

    console.log('✅ Inserted embedding for chunk', chunkId, data);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

const chunkId = process.argv[2] || process.env.CHUNK_ID;
const content = process.argv[3] || process.env.CHUNK_CONTENT;

if (!chunkId || !content) {
  console.error('Usage: ts-node scripts/generateEmbeddingForChunk.ts <CHUNK_ID> "<CONTENT>"');
  process.exit(1);
}

generateEmbeddingForChunk(chunkId, content);
