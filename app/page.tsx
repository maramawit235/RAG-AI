'use client';

import Link from 'next/link';
import { useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function LandingPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D2B55] via-[#4B4485] to-[#786DB5]">
      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪐</span>
              <h1 className="text-2xl font-bold text-white">GALAXY AI</h1>
            </div>
            <div className="space-x-4">
              <Link href="/login" className="text-purple-200 hover:text-white">
                Login
              </Link>
              {/* SIGN UP BUTTON - ADD THIS */}
              <Link
                href="/signup"
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700"
              >
                Sign Up
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Chat with Your Documents
          </h2>
          <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
            Upload PDFs, Word documents, or text files and ask questions about them. 
            Our AI-powered chatbot provides instant answers based on your content.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 text-lg"
            >
              Try the Chatbot
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 text-lg"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-center text-white mb-12">Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="text-4xl mb-4">📄</div>
            <h4 className="text-xl font-semibold text-white mb-2">Document Upload</h4>
            <p className="text-purple-200">Upload PDFs, Word docs, and text files. We'll process them automatically.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="text-4xl mb-4">🤖</div>
            <h4 className="text-xl font-semibold text-white mb-2">AI-Powered Chat</h4>
            <p className="text-purple-200">Ask questions and get instant answers based on your document content.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <div className="text-4xl mb-4">🔒</div>
            <h4 className="text-xl font-semibold text-white mb-2">Secure & Private</h4>
            <p className="text-purple-200">Your documents are encrypted and only accessible to you.</p>
          </div>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}