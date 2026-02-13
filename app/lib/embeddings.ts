import { HfInference } from '@huggingface/inference';

// Initialize the Hugging Face client with your token
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function generateEmbedding(text: string) {
  try {
    // Using a popular, free embedding model
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text,
    });
    
    // The response is already an array of numbers (the embedding)
    return response;
  } catch (error) {
    console.error("Error generating embedding with Hugging Face:", error);
    throw error;
  }
}

export function splitIntoChunks(text: string, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}