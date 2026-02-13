import { NextResponse } from "next/server";
import { generateEmbedding, splitIntoChunks } from "../../lib/embeddings";
import { supabase } from "../../lib/supabaseClient";
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Store document in Supabase
    console.log("💾 Storing document in database...");
    
    const { data: document, error: docError } = await supabase
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
    
    for (let i = 0; i < textChunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${textChunks.length}...`);
      
      try {
        // Generate embedding
        const embedding = await generateEmbedding(textChunks[i]);
        
        // Store chunk
        const { data: chunk, error: chunkError } = await supabase
          .from('document_chunks')
          .insert({
            document_id: document.id,
            chunk_index: i,
            content: textChunks[i],
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (chunkError) throw chunkError;

        // Store embedding
        const { error: embedError } = await supabase
          .from('document_embeddings')
          .insert({
            chunk_id: chunk.id,
            embedding: embedding,
            created_at: new Date().toISOString()
          });

        if (embedError) throw embedError;

      } catch (error) {
        console.error(`Failed on chunk ${i}:`, error);
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`✅ Successfully stored ${textChunks.length} chunks with embeddings`);

    return NextResponse.json({
      success: true,
      message: "File processed and stored in vector database",
      documentId: document.id,
      fileType: file.type,
      fileIcon: getFileIcon(file.name),
      totalChunks: textChunks.length,
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