 
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function testToken() {
  console.log("🔍 Testing Hugging Face token...");
  console.log("Token starts with:", process.env.HUGGINGFACE_API_KEY?.substring(0, 10) + "...");
  
  try {
    console.log("\n📝 Testing text generation...");
    const response = await hf.textGeneration({
      model: 'HuggingFaceH4/zephyr-7b-beta',
      inputs: 'Hello, are you working?',
      parameters: { max_new_tokens: 50 }
    });
    
    console.log('✅ SUCCESS! Token works!');
    console.log('Response:', response.generated_text);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    // Try a different model if first fails
    try {
      console.log("\n📝 Testing with different model...");
      const response2 = await hf.textGeneration({
        model: 'microsoft/DialoGPT-medium',
        inputs: 'Hello',
        parameters: { max_new_tokens: 50 }
      });
      console.log('✅ SUCCESS with backup model!');
      console.log('Response:', response2.generated_text);
    } catch (error2) {
      console.error('❌ Both models failed:', error2.message);
    }
  }
}

testToken();