'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('mesualegn@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload?.error || 'Login failed');
      }

      // Server set the auth cookie; navigate to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error?.message ?? error);
      setError(error?.message ?? 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D2B55] via-[#4B4485] to-[#786DB5] flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-3xl">🪐</span>
          <h1 className="text-2xl font-bold text-white">GALAXY AI</h1>
        </div>

        <h2 className="text-xl font-bold text-white mb-6 text-center">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-400"
            />
          </div>
          
          <div>
            <input
              id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-200/50 focus:outline-none focus:border-purple-400"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-6 text-purple-200">
          Don't have an account?{' '}
          <Link href="/signup" className="text-pink-400 hover:text-pink-300">
            Sign up
          </Link>
        </p>

        {/* Demo mode link (optional) */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <Link 
            href="/demo"
            className="block w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-center transition-all"
          >
            Continue to Demo Mode →
          </Link>
        </div>
      </div>
    </div>
  );
}