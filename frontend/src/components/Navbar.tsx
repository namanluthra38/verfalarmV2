import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, LogOut, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-emerald-800/40 bg-gradient-to-r from-emerald-700 to-emerald-600 shadow-md dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-white hover:text-amber-200 transition">
            <div className="bg-amber-400 p-2 rounded-lg">
              <Leaf className="w-6 h-6 text-emerald-800" />
            </div>
            <span className="text-xl font-bold">Verfalarm</span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/profile" className="flex items-center gap-2 text-amber-100 hover:text-white transition dark:text-slate-300 dark:hover:text-emerald-300">
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
        </div>
      </div>
    </nav>
  );
}
