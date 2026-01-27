import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api.config';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No token provided.');
        return;
      }
      setStatus('verifying');
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully. You can now sign in.');
        } else {
          const txt = await res.text();
          setStatus('error');
          setMessage(txt || 'Verification failed. The token may be invalid or expired.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Network error during verification.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'verifying' && <h2 className="text-xl font-semibold">Verifying your email...</h2>}
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Email Verified</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex justify-center gap-4">
              <Link to="/login" className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Sign In</Link>
              <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-lg">Go to Dashboard</button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Verification Failed</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="px-6 py-2 bg-amber-500 text-white rounded-lg">Register</Link>
              <Link to="/login" className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-lg">Sign In</Link>
            </div>
          </>
        )}

        {status === 'idle' && (
          <>
            <h2 className="text-xl font-semibold">Ready to verify</h2>
            <p className="text-gray-600">Click the button below to start verification.</p>
            <div className="mt-6">
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Retry</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

