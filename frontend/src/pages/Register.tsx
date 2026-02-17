import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Leaf } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ email, password, displayName });
      // After registering, direct user to a "check your email" page instead of auto-login
      navigate('/check-email');
    } catch (err) {
      // Normalize server errors into friendly messages
      const raw = err instanceof Error ? err.message : String(err);
      const lower = (raw || '').toLowerCase();
      let friendly = 'Registration failed';

      if (lower.includes('email') && (lower.includes('already') || lower.includes('registered') || lower.includes('exists'))) {
        friendly = 'This email is already registered — try signing in or use "Forgot password" to reset your password.';
      } else if (lower.includes('password') && (lower.includes('length') || lower.includes('8'))) {
        friendly = 'Password must be at least 8 characters.';
      } else if (raw) {
        // If the server sent a readable message, show it (fallback)
        friendly = raw;
      }

      setError(friendly || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-amber-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-500 p-3 rounded-full">
              <Leaf className="w-8 h-8 text-emerald-800" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">Verfalarm</h1>
          <p className="text-emerald-700 dark:text-emerald-400">Join us in fighting food waste!</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-black/40 border border-emerald-100 dark:border-slate-700 p-8">
          <h2 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300 mb-6 flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Create Account
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                placeholder="Your name"
              />
            </div>

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
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
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
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                placeholder="At least 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md dark:shadow-black/30"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-slate-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-amber-600 hover:text-amber-700 font-semibold transition"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-emerald-700 dark:text-emerald-300 mt-6">
          Smart food tracking for a sustainable future
        </p>
      </div>
    </div>
  );
}
