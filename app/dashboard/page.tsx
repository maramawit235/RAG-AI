'use client';

import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// File icon helper function
function getFileIcon(fileName: string) {
  if (!fileName) return '📁';
  if (fileName.endsWith('.pdf')) return '📄';
  if (fileName.endsWith('.docx')) return '📝';
  if (fileName.endsWith('.txt')) return '📃';
  if (fileName.endsWith('.md')) return '📘';
  if (fileName.endsWith('.csv')) return '📊';
  if (fileName.endsWith('.jpg') || fileName.endsWith('.png')) return '🖼️';
  return '📁';
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(documentId: string) {
    if (confirm('Are you sure you want to delete this document?')) {
      try {
        await supabase.from('documents').delete().eq('id', documentId);
        fetchDocuments(); // Refresh the list
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Prevent default form submission
    
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file) return;
    
    setUploading(true);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Document uploaded successfully!');
        fetchDocuments(); // Refresh the document list
        e.currentTarget.reset(); // Reset the form
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">RAG AI Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/chat" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Go to Chat
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="file"
                name="file"
                accept=".pdf,.docx,.txt,.md"
                required
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 min-w-[100px]"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Supported formats: PDF, DOCX, TXT, MD
            </p>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No documents uploaded yet</p>
              <p className="text-sm text-gray-400 mt-2">Upload a PDF, DOCX, TXT, or MD file to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center space-x-3">
                    {/* File icon using the helper function */}
                    <span className="text-2xl">
                      {getFileIcon(doc.file_name)}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.title || doc.file_name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{doc.file_name?.split('.').pop()?.toUpperCase()}</span>
                        <span>•</span>
                        <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(`/api/documents/${doc.id}`, '_blank')}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
            <p className="text-2xl font-semibold mt-2">{documents.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500">Latest Upload</h3>
            <p className="text-sm mt-2 truncate">
              {documents[0]?.file_name || 'No documents yet'}
            </p>
          </div>
          <Link 
            href="/chat" 
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md p-6 hover:shadow-lg transition"
          >
            <h3 className="text-sm font-medium text-blue-100">Chat with AI</h3>
            <p className="text-xl font-semibold text-white mt-2">Ask Questions →</p>
          </Link>
        </div>
      </main>
    </div>
  );
}