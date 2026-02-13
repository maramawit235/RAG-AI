import { chunkText, createChunksWithMetadata } from '../lib/chunking';

// Test text (sample from your PDF)
const sampleText = `Chapter 3
Random variables and Probability distribution

Discrete and Continuous Random Variables
A discrete random variable:
 has a countable number of possible values
 has discrete jumps (or gaps) between successive values
 has measurable probability associated with individual values
 counts

A continuous random variable:
 has an uncountably infinite number of possible values
 moves continuously from value to value
 has no measurable probability associated with each value
 measures (e.g.: height, weight, speed, value, duration, length)

Random Variables
Consider the different possible orderings of boy (B) and girl (G) in four 
sequential births. There are 2*2*2=2^4 = 16 possibilities, so the sample space 
is: 
BBBB BGBB GBBB GGBB
BBBG BGBG GBBG GGBG
BBGB BGGB GBGB GGGB
BBGG BGGG GBGG GGGG`;

// Test chunking
console.log("=== Testing chunkText ===");
const chunks = chunkText(sampleText, 200, 50);
console.log(`Created ${chunks.length} chunks\n`);

chunks.forEach((chunk, i) => {
  console.log(`Chunk ${i + 1} (${chunk.length} chars):`);
  console.log(chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
  console.log('---');
});

// Test with metadata
console.log("\n=== Testing createChunksWithMetadata ===");
const chunksWithMeta = createChunksWithMetadata(sampleText, 'test.pdf', 3);
console.log(`Created ${chunksWithMeta.length} chunks with metadata`);
console.log('First chunk metadata:', chunksWithMeta[0].metadata);
console.log('First chunk preview:', chunksWithMeta[0].text.substring(0, 100) + '...');