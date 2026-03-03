import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
      <nav className="relative border-b border-emerald-800/40 bg-gradient-to-r from-emerald-700 to-emerald-600 shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link
                to="/dashboard"
                className="flex items-center gap-2 text-white hover:text-amber-200 transition"
            >
              <div className="p-1.5 rounded-lg">
                <img src="/icons/verfalarm-icon.png" alt="Verfalarm Icon" className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold">Verfalarm</span>
            </Link>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-4">
              <ThemeToggle />
              <Link
                  to="/profile"
                  className="flex items-center gap-2 text-amber-100 hover:text-white transition dark:text-slate-300 dark:hover:text-emerald-300"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">{user?.displayName}</span>
              </Link>
              <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile: theme toggle + hamburger */}
            <div className="flex sm:hidden items-center gap-2">
              <ThemeToggle />
              <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="text-white p-2 rounded-lg hover:bg-emerald-600/50 transition"
                  aria-label="Toggle menu"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown — floating, right-aligned */}
        {menuOpen && (
            <div className="sm:hidden absolute right-4 mt-1 w-48 z-50 rounded-xl shadow-lg overflow-hidden border border-emerald-800/40 dark:border-slate-700">
              <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-3 bg-emerald-700 hover:bg-emerald-600 text-amber-100 hover:text-white transition dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
              >
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">{user?.displayName}</span>
              </Link>
              <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-2 w-full px-4 py-3 bg-emerald-700 hover:bg-emerald-600 text-amber-100 hover:text-white transition dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-t border-emerald-800/30 dark:border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </div>
        )}
      </nav>
  );
}