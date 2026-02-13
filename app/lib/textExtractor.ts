import mammoth from 'mammoth';

export async function extractTextFromFile(file: File): Promise<{ text: string; metadata: any }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // PDF files
  if (file.type === 'application/pdf') {
    const pdfParse = require('pdf-parse-fork');
    const pdfData = await pdfParse(buffer);
    return {
      text: pdfData.text || "",
      metadata: {
        pages: pdfData.numpages,
        info: pdfData.info
      }
    };
  }

  // Word documents
  else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      metadata: {
        messages: result.messages
      }
    };
  }

  // Text files
  else if (file.type === 'text/plain') {
    const text = buffer.toString('utf-8');
    return {
      text: text,
      metadata: {}
    };
  }

  // Fallback for other text-based files
  else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    const text = buffer.toString('utf-8');
    return {
      text: text,
      metadata: {}
    };
  }

  throw new Error(`Unsupported file type: ${file.type || file.name}`);
}

export function getFileIcon(fileName: string): string {
  if (fileName.endsWith('.pdf')) return '📄';
  if (fileName.endsWith('.docx')) return '📝';
  if (fileName.endsWith('.txt')) return '📃';
  if (fileName.endsWith('.md')) return '📘';
  return '📁';
}