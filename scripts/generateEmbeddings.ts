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

async function generateEmbeddingsForDoc(documentId: string) {
  console.log('Generating embeddings for document', documentId);
  const { data: chunks, error } = await serverSupabase
    .from('document_chunks')
    .select('id,content')
    .eq('document_id', documentId);

  if (error) throw error;
  if (!chunks || chunks.length === 0) {
    console.log('No chunks for document', documentId);
    return;
  }

  for (const c of chunks) {
    try {
      const embedding = await generateEmbedding(c.content);
      if (!Array.isArray(embedding) || embedding.length === 0) {
        console.warn('Invalid embedding for chunk', c.id);
        continue;
      }

      const { data: inserted, error: insertErr } = await serverSupabase
        .from('document_embeddings')
        .insert([{ chunk_id: c.id, embedding }])
        .select();

      if (insertErr) {
        console.error('Failed to insert embedding for chunk', c.id, insertErr);
      } else {
        console.log('Inserted embedding for chunk', c.id);
      }
    } catch (e) {
      console.error('Error generating/inserting for chunk', c.id, e);
    }
  }

  console.log('Done for document', documentId);
}

async function main() {
  const docId = process.argv[2] || process.env.DOCUMENT_ID;
  if (!docId) {
    console.error('Usage: ts-node scripts/generateEmbeddings.ts <DOCUMENT_ID>');
    process.exit(1);
  }

  await generateEmbeddingsForDoc(docId);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
