const { GoogleGenerativeAI } = require("@google/generative-ai");
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function checkModels() {
  console.log("Testing Google AI models with your API key...\n");
  console.log("API Key starts with:", process.env.GOOGLE_API_KEY?.substring(0, 15) + "...");
  
  // Test text generation models first
  const textModels = [
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
  ];
  
  for (const modelName of textModels) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in one word");
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} works! Response: ${text}\n`);
    } catch (e) {
      console.log(`❌ ${modelName} failed:`, e.message, '\n');
    }
  }
  
  // Try embedding models
  const embedModels = [
    "embedding-001",
    "text-embedding-004",
    "models/embedding-001"
  ];
  
  console.log("\n--- Testing embedding models ---\n");
  
  for (const modelName of embedModels) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent("test");
      console.log(`✅ ${modelName} works! Embedding length: ${result.embedding.values.length}\n`);
    } catch (e) {
      console.log(`❌ ${modelName} failed:`, e.message, '\n');
    }
  }
}

checkModels();