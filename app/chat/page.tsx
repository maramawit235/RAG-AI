'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// Icons
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ content: string; document: string }>;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI assistant. Ask me anything about your documents!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content || "I couldn't process that request.",
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

  const handleDriveClick = () => {
    setMessages(prev => [...prev, { role: 'assistant', content: 'Google Drive picker not configured. Implement OAuth and Drive picker to enable this.' }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D2B55] via-[#4B4485] to-[#786DB5] font-sans text-white">
      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl border border-white/10">
                <span className="text-2xl">🪐</span>
              </div>
              <h1 className="text-xl font-bold text-white">GALAXY AI</h1>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Chat Container */}
      <div className="max-w-5xl mx-auto px-4 py-8 h-[calc(100vh-5rem)]">
        <div className="h-full flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3 bg-gradient-to-r from-[#4B4485]/50 to-[#2D2B55]/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center">
              <BotIcon />
            </div>
            <div>
              <h2 className="font-bold">AI Assistant</h2>
              <p className="text-xs text-purple-200">Connected to your knowledge base</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-tr from-pink-500 to-purple-600' 
                      : 'bg-white/10 border border-white/20'
                  }`}>
                    {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`space-y-2 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-tr-none'
                          : 'bg-white/10 border border-white/20 text-white rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm md:text-base">{msg.content}</p>
                    </div>

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <details className="text-xs opacity-70">
                        <summary className="cursor-pointer hover:opacity-100">
                          Sources ({msg.sources.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {msg.sources.map((source, j) => (
                            <div key={j} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                              <div className="font-medium text-purple-300 text-xs mb-1">
                                {source.document}
                              </div>
                              <div className="text-xs text-white/80">{source.content}</div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <BotIcon />
                  </div>
                  <div className="bg-white/10 border border-white/20 p-4 rounded-2xl rounded-tl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <form onSubmit={handleSubmit} className="flex gap-3 items-center">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={uploading}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10"
                aria-label="Upload file"
              >
                📎
              </button>

              <button
                type="button"
                onClick={handleDriveClick}
                disabled={uploading}
                className="p-3 bg-white/5 rounded-xl hover:bg-white/10"
                aria-label="Upload from Google Drive"
              >
                🟢
              </button>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,.md,.csv,.jpg,.png"
                hidden
              />

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 text-white placeholder-purple-200/50 transition-all"
                disabled={isLoading || uploading}
              />

              <button
                type="submit"
                disabled={isLoading || uploading}
                className="px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <SendIcon />
                <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}