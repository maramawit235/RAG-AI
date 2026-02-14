'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';
import { useState, useRef } from 'react';

// --- ICONS ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// File icon helper
function getFileIcon(fileName: string) {
  if (!fileName) return '📁';
  if (fileName.endsWith('.pdf')) return '📄';
  if (fileName.endsWith('.docx')) return '📝';
  if (fileName.endsWith('.txt')) return '📃';
  if (fileName.endsWith('.md')) return '📘';
  return '📁';
}

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Add session check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Dashboard session check:', session ? '✅ Authenticated' : '❌ Not authenticated');
      
      if (!session) {
        router.push('/login');
      }
    };
    
    checkUser();
  }, [router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetchDocuments();
    }
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
    if (confirm('Delete this file from the galaxy?')) {
      try {
        await supabase.from('documents').delete().eq('id', documentId);
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        await fetchDocuments();
        formRef.current?.reset();
        setShowUploadModal(false);
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

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  const filteredDocs = documents.filter((doc: any) => 
    (doc.title || doc.file_name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-[#2D2B55] via-[#4B4485] to-[#786DB5] font-sans text-white overflow-hidden selection:bg-purple-300 selection:text-purple-900 relative">
      
      {/* --- LEFT SIDEBAR --- */}
      <aside className="w-72 hidden md:flex flex-col bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 gap-6 relative z-20">
        
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="bg-white/10 p-2 rounded-xl border border-white/10 shadow-lg">
            <span className="text-2xl">🪐</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">GALAXY AI</h1>
            <p className="text-[10px] text-purple-200 uppercase tracking-widest">Dashboard v2.0</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
            <div className="px-2 pb-2 text-xs font-semibold text-purple-300/60 uppercase tracking-wider">Menu</div>
            
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl border border-white/20 text-white font-medium shadow-inner transition-all">
                <span className="text-lg">📊</span>
                <span>Dashboard</span>
            </button>

            <Link href="/chat" className="flex items-center gap-3 px-4 py-3 rounded-xl text-purple-100 hover:bg-white/10 hover:translate-x-1 transition-all group">
                <ChatIcon />
                <span>AI Chat</span>
            </Link>

            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-100 hover:bg-white/10 hover:translate-x-1 transition-all">
                <span className="text-lg">⚙️</span>
                <span>Settings</span>
            </button>

            {/* Logout Button */}
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:translate-x-1 transition-all mt-4"
            >
                <LogoutIcon />
                <span>Logout</span>
            </button>
        </nav>

        {/* Sidebar Footer Stats */}
        <div className="mt-auto bg-black/20 rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between text-xs mb-2">
                <span className="text-purple-200">Storage</span>
                <span className="font-bold text-white">75%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-full w-3/4"></div>
            </div>
            <p className="text-[10px] text-purple-300/50 mt-2">{documents.length} Files Uploaded</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Animated Background Blob */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#6C5DD3] rounded-full mix-blend-overlay filter blur-[120px] opacity-40 animate-pulse pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 py-6 z-10 shrink-0">
            <h2 className="text-2xl font-bold text-white/90 hidden sm:block">Dashboard</h2>
            
            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                {/* Search Bar */}
                <div className="relative group max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search universe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-sm placeholder-purple-300/50 focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all"
                    />
                </div>

                {/* Upload Button */}
                <button 
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all"
                >
                    <PlusIcon />
                    <span className="hidden sm:inline">Upload New</span>
                </button>

                {/* Profile Pic */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400 p-0.5 cursor-pointer hover:scale-105 transition-transform">
                    <div className="h-full w-full rounded-full bg-[#2D2B55] flex items-center justify-center text-sm font-bold">
                        JD
                    </div>
                </div>
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 z-10 scrollbar-hide">
            
            {/* HERO BANNER */}
            <div className="w-full bg-gradient-to-r from-[#4B4485]/80 to-[#2D2B55]/80 backdrop-blur-md border border-white/10 rounded-[30px] p-8 md:p-10 mb-8 relative overflow-hidden shadow-2xl group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                
                {/* Floating Astronaut */}
                <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[100px] lg:text-[140px] drop-shadow-2xl animate-bounce-slow opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 hidden md:block">
                    👨‍🚀
                </div>
                
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-purple-200 mb-4">
                        RAG AI SYSTEM V2
                    </span>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                        Knowledge <br/> Base Center
                    </h1>
                    <p className="text-purple-100/80 text-base md:text-lg mb-8 max-w-lg">
                        Manage your AI's training data. Upload documents to expand the neural network's galaxy of knowledge.
                    </p>
                    
                    <div className="flex gap-4">
                        <Link href="/chat" className="px-6 py-3 bg-white text-[#4B4485] rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform">
                            Start Chatting
                        </Link>
                    </div>
                </div>
            </div>

            {/* DOCUMENTS SECTION */}
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold">Recent Documents</h3>
                    <p className="text-sm text-purple-200/60">Manage your uploaded files</p>
                </div>
            </div>

            {/* Grid for Documents */}
            {loading ? (
                <div className="w-full h-40 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="w-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-purple-300">
                    <span className="text-4xl mb-4">🌌</span>
                    <p>No documents found in this sector.</p>
                    <button onClick={() => setShowUploadModal(true)} className="mt-4 text-pink-400 hover:text-pink-300 underline underline-offset-4">
                        Upload your first file
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocs.map((doc: any) => (
                        <div key={doc.id} className="group bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/5 hover:border-white/20 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#4B4485] to-[#2D2B55] flex items-center justify-center text-2xl shadow-inner border border-white/5">
                                    {getFileIcon(doc.file_name)}
                                </div>
                                {/* Action Buttons - Only Delete remains */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-black/20 rounded-lg p-1 backdrop-blur-md">
                                     <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-red-500/20 text-red-300 rounded-md" title="Delete">
                                        <TrashIcon />
                                     </button>
                                </div>
                            </div>
                            
                            <h4 className="font-semibold text-white/90 truncate mb-1" title={doc.title || doc.file_name}>
                                {doc.title || doc.file_name}
                            </h4>
                            
                            <div className="flex items-center justify-between text-xs text-purple-300/70 mt-3 border-t border-white/5 pt-3">
                                <div className="flex items-center gap-1">
                                    <FileTextIcon />
                                    <span>{(doc.file_name?.split('.').pop() || '').toUpperCase()}</span>
                                </div>
                                <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* --- UPLOAD MODAL --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#2D2B55] border border-white/20 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
                
                {/* Modal Glow Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
                
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Upload Document</h3>
                    <button 
                        onClick={() => setShowUploadModal(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <XIcon />
                    </button>
                </div>

                <form ref={formRef} onSubmit={handleUpload} className="space-y-6">
                    <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-purple-400/30 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-purple-400/60 transition-all group bg-white/5">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="group-hover:scale-110 transition-transform duration-300 mb-3">
                                <UploadIcon />
                            </div>
                            <p className="mb-2 text-sm text-purple-200"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-purple-400/70">PDF, DOCX, TXT, MD (Max 10MB)</p>
                        </div>
                        <input 
                            type="file" 
                            name="file"
                            accept=".pdf,.docx,.txt,.md"
                            required
                            disabled={uploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        />
                    </label>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowUploadModal(false)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {uploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Uploading...
                                </span>
                            ) : 'Upload File'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}