import { Link } from 'react-router-dom';

export default function CheckEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-emerald-50 p-4 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-xl w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-black/40 border border-emerald-100 dark:border-slate-700 p-8 text-center">
        <h2 className="text-2xl font-semibold text-emerald-800 dark:text-emerald-300 mb-4">Check your email</h2>
        <p className="text-gray-700 dark:text-slate-300 mb-6">
          We've sent a verification link to your email address. Click the link in the email to verify your account before signing in.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Go to Sign In</Link>
          <Link to="/" className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-lg dark:bg-slate-700 dark:text-emerald-300">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
