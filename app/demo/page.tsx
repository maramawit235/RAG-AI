'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DemoPage() {
  const [documents, setDocuments] = useState([
    { id: '1', file_name: 'Sample Presentation.pdf', created_at: new Date().toISOString() },
    { id: '2', file_name: 'Research Notes.txt', created_at: new Date().toISOString() },
    { id: '3', file_name: 'Project Report.docx', created_at: new Date().toISOString() },
    { id: '4', file_name: 'Meeting Notes.md', created_at: new Date().toISOString() }
  ]);

  // Sample chat messages for demo
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI assistant in demo mode. Ask me anything about the sample documents!" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "This is a demo response. In the full version, I'd answer based on your uploaded documents. The RAG system would retrieve relevant chunks and generate a context-aware response."
      }]);
    }, 1000);

    setInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D2B55] via-[#4B4485] to-[#786DB5] p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Demo Mode Banner */}
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h2 className="text-white font-bold">Demo Mode Active</h2>
              <p className="text-yellow-200 text-sm">Using sample data for presentation</p>
            </div>
          </div>
          <Link 
            href="/login"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            Back to Login
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column - Documents */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📁</span> Sample Documents
            </h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {doc.file_name.endsWith('.pdf') ? '📄' : 
                       doc.file_name.endsWith('.docx') ? '📝' : 
                       doc.file_name.endsWith('.txt') ? '📃' : '📘'}
                    </span>
                    <span className="text-white">{doc.file_name}</span>
                  </div>
                  <span className="text-purple-300 text-sm">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-purple-500/20 rounded-xl">
              <p className="text-purple-200 text-sm">
                <span className="font-bold text-white">✨ Demo Info:</span> These are sample files. In the full version, you can upload your own PDFs, Word docs, and text files.
              </p>
            </div>
          </div>

          {/* Right Column - Chat Demo */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col h-[500px]">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>💬</span> AI Chat Demo
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-none'
                      : 'bg-white/10 text-white rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask something in demo mode..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 transition-all"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <span className="text-3xl mb-2 block">📤</span>
            <h3 className="text-white font-bold mb-1">Upload</h3>
            <p className="text-purple-200 text-sm">PDF, DOCX, TXT, MD files</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <span className="text-3xl mb-2 block">🤖</span>
            <h3 className="text-white font-bold mb-1">RAG Chat</h3>
            <p className="text-purple-200 text-sm">Context-aware responses</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <span className="text-3xl mb-2 block">🔒</span>
            <h3 className="text-white font-bold mb-1">Auth</h3>
            <p className="text-purple-200 text-sm">Supabase authentication</p>
          </div>
        </div>
      </div>
    </div>
  );
}