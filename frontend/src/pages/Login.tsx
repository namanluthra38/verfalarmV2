import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Leaf } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-emerald-600 p-3 rounded-full">
              <Leaf className="w-8 h-8 text-amber-100" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">Verfalarm</h1>
          <p className="text-emerald-700 dark:text-emerald-400">Welcome back! Keep your food fresh.</p>
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
              <Link
                to="/register"
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 mt-6">
          Track your food, reduce waste, save money
        </p>
      </div>
    </div>
  );
}
