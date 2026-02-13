'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function DocumentViewer() {
  const params = useParams();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, []);

  async function fetchDocument() {
    try {
      const response = await fetch(`/api/documents/${params.id}`);
      const data = await response.json();
      setDocument(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!document) return <div className="p-8">Document not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{document.document.title}</h1>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-gray-600">
            Uploaded: {new Date(document.document.createdAt).toLocaleString()}
          </p>
          <p className="text-gray-600">
            Total Chunks: {document.totalChunks}
          </p>
        </div>

        <div className="space-y-4">
          {document.chunks.map((chunk: any) => (
            <div key={chunk.index} className="bg-white rounded-lg shadow-md p-6">
              <div className="text-sm text-gray-500 mb-2">Chunk {chunk.index + 1}</div>
              <div className="whitespace-pre-wrap">{chunk.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}