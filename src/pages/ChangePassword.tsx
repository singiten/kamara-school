// src/pages/ChangePassword.tsx - Force password change page (No current password required)

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff, Sparkles } from "lucide-react";
import axios from "axios";

// ✅ School Logo
import schoolLogo from '../assets/logo.png';
const SCHOOL_NAME = 'Kamara School';
const SCHOOL_TAGLINE = 'Empowering Ethiopian Futures';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // ✅ Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            // ✅ Get current user info
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            // ✅ Call change password WITHOUT current password
            const response = await axios.post(
                'http://localhost:7000/api/auth/change-password',
                {
                    newPassword: newPassword,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccess(true);
                // ✅ Clear the mustChangePassword flag from local storage
                if (user) {
                    user.mustChangePassword = false;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                // ✅ After 2 seconds, redirect to dashboard
                setTimeout(() => {
                    const role = user?.role || 'student';
                    if (role === 'admin') navigate('/admin');
                    else if (role === 'registrar') navigate('/registrar');
                    else if (role === 'finance_officer') navigate('/finance');
                    else if (role === 'teacher') navigate('/teacher');
                    else if (role === 'student') navigate('/student');
                    else if (role === 'parent') navigate('/parent');
                    else navigate('/dashboard');
                }, 2000);
            }
        } catch (err: any) {
            console.error('❌ Change password error:', err);
            setError(err.response?.data?.error || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 dark:border-gray-700">
                {/* School Logo & Branding */}
                <div className="text-center mb-6">
                    <div className="flex flex-col items-center justify-center gap-3 mb-3">
                        <img 
                            src={schoolLogo} 
                            alt={SCHOOL_NAME} 
                            className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-blue-100 dark:border-gray-700"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                                {SCHOOL_NAME}
                            </h1>
                            <p className="text-xs text-blue-600 font-medium flex items-center justify-center gap-1">
                                <Sparkles size={12} className="text-yellow-500" />
                                {SCHOOL_TAGLINE}
                            </p>
                        </div>
                    </div>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-blue-300 to-transparent mx-auto my-2"></div>
                </div>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Change Password</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        You must change your password before continuing
                    </p>
                </div>

                {success ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Password Changed!</h3>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">Redirecting to dashboard...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2">
                                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New Password *
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min 6 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 dark:text-gray-100"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 dark:text-gray-100"
                                    required
                                />
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <p>⚠️ Your password has been reset by the registrar.</p>
                            <p className="mt-1">Please create a new password to continue.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                    Changing...
                                </span>
                            ) : (
                                'Change Password'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangePassword;