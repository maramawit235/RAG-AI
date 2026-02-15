'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    content: string;
    document: string;
    similarity: number;
  }>;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Array<{id:string; file_name?:string; title?:string;}>>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // load recent documents for selector
    const load = async () => {
      try {
        const res = await fetch('/api/documents');
        const json = await res.json();
        setDocuments(json.documents || []);
        if (json.documents && json.documents.length > 0) setSelectedDocumentId(json.documents[0].id);
      } catch (e) {
        console.error('Failed to load documents', e);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage], selectedDocumentId }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        sources: data.sources
      }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Upload handlers ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      console.log('Upload response', data);

      // Refresh documents list and select the newly uploaded document if returned
      if (data?.documentId) {
        try {
          const docsRes = await fetch('/api/documents');
          const docsJson = await docsRes.json();
          setDocuments(docsJson.documents || []);
          setSelectedDocumentId(data.documentId);
        } catch (e) {
          console.error('Failed to refresh documents after upload', e);
        }
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Uploaded "${file.name}" — ${data.message || 'processed'}` },
      ]);
    } catch (err) {
      console.error('Upload failed', err);
      setMessages(prev => [...prev, { role: 'assistant', content: `Upload failed: ${String(err)}` }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Google Drive picker stub — requires gapi + picker setup on the page
  const handleDriveClick = () => {
    if (!(window as any).gapi || !(window as any).google) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Google Drive picker not loaded. Add the Google API script and implement a server-side proxy to fetch Drive files.',
        },
      ]);
      return;
    }

    try {
      (window as any).gapi.load('picker', () => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Drive picker opened (stub).' }]);
      });
    } catch (e) {
      console.error('Drive picker error', e);
    }
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto border rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
        <h2 className="text-lg font-semibold">Chat with Your Documents</h2>
        <p className="text-sm opacity-90">Ask questions about your uploaded PDFs</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>👋 Ask me anything about your documents!</p>
            <p className="text-sm mt-2">For example: "What skills are in my CV?" or "Summarize chapter 3"</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-900 rounded-bl-none shadow'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer opacity-70 hover:opacity-100">
                    Sources ({msg.sources.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {msg.sources.map((source, j) => (
                      <div key={j} className="p-2 bg-gray-100 rounded text-gray-700">
                        <div className="font-medium">{source.document}</div>
                        <div className="mt-1">{source.content}</div>
                        <div className="mt-1 text-right opacity-60">
                          Relevance: {source.similarity}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg shadow">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-white rounded-b-lg">
        <div className="flex items-center space-x-2">
          {/* Upload (local) button */}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            aria-label="Upload file"
            className="p-2 rounded hover:bg-gray-100"
          >
            📎
          </button>

          {/* Google Drive (stub) */}
          <button
            type="button"
            onClick={handleDriveClick}
            disabled={uploading}
            aria-label="Upload from Google Drive"
            className="p-2 rounded hover:bg-gray-100"
          >
            🟢
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt,.md,.csv,.jpg,.png"
            hidden
            aria-hidden
          />

          {/* Text input */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedDocumentId || ''}
              onChange={(e) => setSelectedDocumentId(e.target.value || null)}
              className="p-2 border rounded-lg bg-white mr-2"
            >
              {documents.length === 0 && <option value="">No documents</option>}
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name || d.title || d.id}
                </option>
              ))}
            </select>

            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || uploading}
          />
          </div>
          <button
            type="submit"
            disabled={isLoading || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}