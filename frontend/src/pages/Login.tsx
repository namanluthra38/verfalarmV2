import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    // Let the browser navigate — Spring Security takes over from here
    window.location.href = `${API_BASE}/oauth2/authorization/github`;
  };
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/icons/verfalarm-icon.png" alt="Verfalarm" className="w-16 h-16 object-contain" />
            </div>
            <p className="text-emerald-700 dark:text-emerald-400">Welcome back! Stay on top of your products and alerts.</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-black/40 border border-emerald-100 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300 mb-6 flex items-center gap-2">
              <LogIn className="w-6 h-6" />
              Sign In
            </h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
            )}

            {/* ── OAuth providers ───────────────────────────────────────── */}
            <button
                type="button"
                onClick={handleGitHubLogin}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 mb-3 transition-colors"
            >
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" className="w-5 h-5 bg-white rounded-full p-0.5" />
              Sign in with GitHub
            </button>
            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 py-2 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-600 mb-6 transition-colors"
            >
              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
              Sign in with Google
            </button>

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-600" />
              </div>
              <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500">
                or sign in with email
              </span>
              </div>
            </div>

            {/* ── Email / password form ─────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    placeholder="Enter your password"
                />
              </div>

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md dark:shadow-black/30"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-slate-300">
                Don't have an account?{' '}
                <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 mt-6">
            Track your products, get timely alerts, save money
          </p>
        </div>
      </div>
  );
}