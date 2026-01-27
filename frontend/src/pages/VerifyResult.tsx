import { useSearchParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthService } from '../services/auth.service';

export default function VerifyResult() {
  const [searchParams] = useSearchParams();
  const statusFromQuery = searchParams.get('status');
  const msgFromQuery = searchParams.get('message');
  const tokenFromQuery = searchParams.get('token');

  // Helper to parse hash fragment parameters (after '#')
  const parseHashParams = (): URLSearchParams => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const raw = hash && hash.startsWith('#') ? hash.slice(1) : (hash || '');
    return new URLSearchParams(raw);
  };

  const hashParams = parseHashParams();
  const statusFromHash = hashParams.get('status');
  const msgFromHash = hashParams.get('message');
  const tokenFromHash = hashParams.get('token');

  const status = statusFromQuery || statusFromHash;
  const message = msgFromQuery || msgFromHash;
  const token = tokenFromQuery || tokenFromHash;

  const isSuccess = status === 'success';

  useEffect(() => {
    // If token exists, try to auto-login regardless of status. This handles cases where
    // redirects or clients changed the status but token was still delivered.
    if (token) {
      try {
        const decoded = decodeURIComponent(token);
        AuthService.saveToken(decoded);
        // Force a reload to allow AuthProvider to initialize with the new token
        window.location.replace('/dashboard');
        return;
      } catch (e) {
        console.error('Failed to auto-login after verification', e);
      }
    }

    // No token, only redirect if explicit success without token (nothing to do)
    if (isSuccess && !token) {
      // Nothing to auto-login with; user can click Sign In
      console.warn('Verification reported success but token missing');
    }
  }, [isSuccess, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {isSuccess || token ? (
          <>
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Email Verified</h2>
            <p className="text-gray-700 mb-6">{message || 'Your email has been verified successfully. You will be redirected.'}</p>
            <div className="flex justify-center gap-4">
              <Link to="/login" className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Sign In</Link>
              <Link to="/dashboard" className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-lg">Go to Dashboard</Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Verification Failed</h2>
            <p className="text-gray-700 mb-6">{message || 'Verification token is invalid or expired.'}</p>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="px-6 py-2 bg-amber-500 text-white rounded-lg">Register</Link>
              <Link to="/login" className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-lg">Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
