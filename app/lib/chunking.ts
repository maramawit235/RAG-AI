export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  // Input validation
  if (!text || typeof text !== 'string') {
    console.warn("Invalid text input for chunking");
    return [];
  }
  
  // If text is smaller than max chunk size, return as is
  if (text.length <= maxChunkSize) {
    return text.trim() ? [text] : [];
  }

  const chunks: string[] = [];
  let startIndex = 0;
  
  // Safety check: prevent infinite loops
  const maxIterations = Math.ceil(text.length / (maxChunkSize - overlap)) * 2;
  let iterations = 0;

  while (startIndex < text.length && iterations < maxIterations) {
    iterations++;
    
    // Calculate end index for this chunk
    let endIndex = Math.min(startIndex + maxChunkSize, text.length);
    
    // Try to break at natural boundaries
    if (endIndex < text.length) {
      // Look for paragraph break first (newline)
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > startIndex && paragraphBreak < endIndex) {
        endIndex = paragraphBreak;
      } else {
        // Look for sentence break
        const sentenceBreak = text.lastIndexOf('. ', endIndex);
        if (sentenceBreak > startIndex && sentenceBreak < endIndex) {
          endIndex = sentenceBreak + 1;
        } else {
          // Look for space as last resort
          const spaceBreak = text.lastIndexOf(' ', endIndex);
          if (spaceBreak > startIndex && spaceBreak < endIndex) {
            endIndex = spaceBreak;
          }
        }
      }
    }

    // Extract chunk
    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk && chunk.length > 0) {
      chunks.push(chunk);
    } else {
      // If we got an empty chunk, force move forward
      endIndex = Math.min(startIndex + maxChunkSize / 2, text.length);
    }

    // Move start index with overlap
    startIndex = endIndex - overlap;
    if (startIndex <= endIndex - overlap) {
      // Prevent getting stuck
      startIndex = endIndex;
    }
    if (startIndex < 0) startIndex = 0;
  }

  // Final safety check
  if (chunks.length === 0 && text.length > 0) {
    // Fallback: split by maxChunkSize without boundary detection
    for (let i = 0; i < text.length; i += maxChunkSize) {
      const chunk = text.substring(i, Math.min(i + maxChunkSize, text.length)).trim();
      if (chunk) chunks.push(chunk);
    }
  }

  console.log(`Chunking complete: ${chunks.length} chunks created`);
  return chunks;
}

export function createChunksWithMetadata(
  text: string, 
  source: string, 
  page?: number
): Array<{ text: string; metadata: Record<string, any> }> {
  // Safety check
  if (!text || text.length === 0) {
    return [];
  }
  
  const chunks = chunkText(text);
  
  return chunks.map((chunk, index) => ({
    text: chunk,
    metadata: {
      source,
      chunkIndex: index,
      totalChunks: chunks.length,
      page: page || null,
      timestamp: new Date().toISOString()
    }
  }));
}