import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { UserService } from '../services/user.service';
import { UpdateDisplayNameRequest, UpdatePasswordRequest } from '../types/api.types';
import { Save, KeyRound, UserCircle, Mail, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Profile() {
    const { user, token, logout, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [dnLoading, setDnLoading] = useState(false);
    const [dnError, setDnError] = useState('');
    const [dnSuccess, setDnSuccess] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    if (!user || !token) {
        navigate('/login');
        return null;
    }

    const handleDisplayNameSave = async (e: any) => {
        e.preventDefault();
        setDnError('');
        setDnSuccess('');
        if (!displayName || displayName.trim().length === 0) return setDnError('Display name is required');
        setDnLoading(true);
        try {
            const req: UpdateDisplayNameRequest = { displayName: displayName.trim() };
            await UserService.updateDisplayName(user.id, req, token);
            setDnSuccess('Display name updated successfully!');
            await refreshUser();
        } catch (err: any) {
            setDnError(err?.message || 'Failed to update display name');
        } finally {
            setDnLoading(false);
        }
    };

    const handlePasswordSave = async (e: any) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');
        if (!currentPassword) return setPwError('Current password is required');
        if (!newPassword || newPassword.length < 6) return setPwError('New password must be at least 6 characters');
        setPwLoading(true);
        try {
            const req: UpdatePasswordRequest = { currentPassword, newPassword };
            await UserService.updatePassword(user.id, req, token);
            setPwSuccess('Password updated successfully! Redirecting to login...');
            setTimeout(() => {
                logout();
                navigate('/login');
            }, 1200);
        } catch (err: any) {
            setPwError(err?.message || 'Failed to update password');
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 mb-6 font-semibold transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-emerald-800">Account Settings</h1>
                    <p className="text-emerald-700 mt-1">Manage your profile and security preferences</p>
                </div>

                {/* Profile Overview Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-emerald-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                            <UserCircle className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-emerald-800">{user.displayName}</h2>
                            <div className="flex items-center gap-2 text-gray-600 mt-1">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{user.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Display Name Section */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <UserCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Display Name</h3>
                                    <p className="text-emerald-50 text-sm">Update what should we call you</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleDisplayNameSave} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your display name
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg
                             focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                             transition-all outline-none text-gray-900"
                                        placeholder="Enter your name"
                                    />
                                </div>

                                {dnError && (
                                    <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                        <span className="font-semibold">⚠</span>
                                        <span>{dnError}</span>
                                    </div>
                                )}

                                {dnSuccess && (
                                    <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-medium">{dnSuccess}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={dnLoading}
                                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg
                             hover:bg-emerald-700 shadow-lg shadow-emerald-200 font-semibold
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Save className="w-5 h-5" />
                                        {dnLoading ? 'Saving...' : 'Save Changes'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDisplayName(user.displayName);
                                            setDnError('');
                                            setDnSuccess('');
                                        }}
                                        className="px-6 py-3 bg-white border-2 border-emerald-200 rounded-lg
                             hover:bg-gray-50 font-medium text-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Security Section */}
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Security</h3>
                                    <p className="text-orange-50 text-sm">Keep your account secure with a strong password</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSave} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-lg
                               focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                               transition-all outline-none text-gray-900"
                                            placeholder="Enter current password"
                                        />
                                        <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 pl-11 border-2 border-gray-200 rounded-lg
                               focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                               transition-all outline-none text-gray-900"
                                            placeholder="At least 6 characters"
                                        />
                                        <KeyRound className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-1">
                                        Choose a strong password with at least 6 characters
                                    </p>
                                </div>

                                {pwError && (
                                    <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                        <span className="font-semibold">⚠</span>
                                        <span>{pwError}</span>
                                    </div>
                                )}

                                {pwSuccess && (
                                    <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-medium">{pwSuccess}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={pwLoading}
                                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg
                             hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-200 font-semibold
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Shield className="w-5 h-5" />
                                        {pwLoading ? 'Updating...' : 'Update Password'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentPassword('');
                                            setNewPassword('');
                                            setPwError('');
                                            setPwSuccess('');
                                        }}
                                        className="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg
                             hover:bg-gray-50 font-medium text-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}