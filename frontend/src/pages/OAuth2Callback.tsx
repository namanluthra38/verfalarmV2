import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Landing page for the OAuth2 redirect.
 * Spring redirects here as:  /oauth2/callback?token=<jwt>
 *
 * Reads the token, hands it to AuthContext (same path as email/password login),
 * then navigates to the dashboard. If anything is wrong it falls back to /login.
 */
export default function OAuth2Callback() {
  const navigate = useNavigate();
  const { setTokenAndUser } = useAuth(); // see note below
  const handled = useRef(false);        // strict-mode guard — prevents double-run

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error || !token) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    // Delegate to AuthContext so token storage stays in one place
    setTokenAndUser(token);
    navigate('/dashboard', { replace: true });
  }, [navigate, setTokenAndUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <img src="/icons/verfalarm-icon.png" alt="Verfalarm" className="w-16 h-16 object-contain animate-pulse" />
        </div>
        <p className="text-emerald-700 dark:text-emerald-400 font-medium">Signing you in…</p>
      </div>
    </div>
  );
}