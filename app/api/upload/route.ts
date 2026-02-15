import { NextResponse } from "next/server";
import { generateEmbedding } from "../../lib/embeddings";
import { splitIntoChunks } from "../../lib/embeddings";
import { supabase, createClient } from "../../lib/supabaseClient";
import { extractTextFromFile, getFileIcon } from "../../lib/textExtractor";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    console.log("📄 File received:", {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type
    });

    // Extract text based on file type
    console.log("🔄 Extracting text from file...");
    const { text: fullText, metadata } = await extractTextFromFile(file);
    
    console.log(`✅ Text extracted: ${fullText.length} characters`);
    if (metadata.pages) console.log(`Pages: ${metadata.pages}`);

    if (!fullText.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted from the file" },
        { status: 400 }
      );
    }

    // Split into chunks
    console.log("✂️ Splitting text into chunks...");
    const textChunks = splitIntoChunks(fullText, 1000);
    console.log(`✅ Created ${textChunks.length} chunks`);

    // Get current user (optional)
    let user: any = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.warn('Could not get user from anon client', e);
    }

    // Create a server-side Supabase client using service role key when available
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serverSupabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false }
    });

    // Store document in Supabase (server client to avoid RLS issues)
    console.log("💾 Storing document in database (server client)...");

    const { data: document, error: docError } = await serverSupabase
      .from('documents')
      .insert({
        user_id: user?.id || null,
        title: file.name,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (docError) throw docError;

    // Generate embeddings and store chunks
    console.log("🔢 Generating embeddings and storing chunks...");

    let embeddingsStored = 0;
    for (let i = 0; i < textChunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${textChunks.length}...`);

      try {
        // Generate embedding (now returns 384 dimensions)
        const embedding = await generateEmbedding(textChunks[i]);
        console.log('✅ Embedding generated:', {
          dimensions: Array.isArray(embedding) ? embedding.length : typeof embedding,
          sample: Array.isArray(embedding) ? embedding.slice(0, 3) : null
        });

        if (!Array.isArray(embedding) || embedding.length === 0) {
          throw new Error('Invalid embedding returned from generateEmbedding');
        }

        // Store chunk (server client)
        const { data: chunk, error: chunkError } = await serverSupabase
          .from('document_chunks')
          .insert({
            document_id: document.id,
            content: textChunks[i],
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (chunkError) {
          console.error('❌ CHUNK INSERT ERROR', chunkError);
          throw chunkError;
        }

        // Store embedding (server client)
        const { data: embedInsertData, error: embedError } = await serverSupabase
          .from('document_embeddings')
          .insert({
            chunk_id: chunk.id,
            embedding: embedding, // Now 384 dimensions
            created_at: new Date().toISOString()
          })
          .select();

        if (embedError) {
          console.error('❌ SUPABASE EMBED INSERT ERROR', {
            code: embedError.code,
            message: embedError.message,
            details: embedError.details,
            hint: embedError.hint
          });
          throw embedError;
        }

        console.log(`✅ Successfully stored embedding for chunk ${i + 1}`);
        embeddingsStored++;

      } catch (error: any) {
        console.error('❌ EMBEDDING FAILED:', {
          chunkIndex: i,
          message: error?.message || String(error),
          error
        });
        // Surface the error instead of continuing silently so failures are visible
        throw error;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Successfully stored ${textChunks.length} chunks; embeddings stored=${embeddingsStored}`);

    return NextResponse.json({
      success: true,
      message: "File processed and stored in vector database",
      documentId: document.id,
      fileType: file.type,
      fileIcon: getFileIcon(file.name),
      totalChunks: textChunks.length,
      embeddingsStored,
      preview: fullText.substring(0, 500) + "..."
    });

  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { 
        error: "Failed to process file", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}