// src/pages/Login.tsx - WITH MUST CHANGE PASSWORD REDIRECT

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Sparkles } from "lucide-react";
import axios from "axios";
import { API_URL } from "../config/api";


// ✅ IMPORT LOGO
import schoolLogo from '../assets/logo.png';


const SCHOOL_NAME = 'Kamara School';
const SCHOOL_TAGLINE = 'Empowering Ethiopian Futures';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            console.log('📥 Login response:', response.data);

            if (response.data.success) {
                const { token, data, mustChangePassword } = response.data;

                // ✅ Save token and user
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(data));

                // ✅ If mustChangePassword is true, redirect to change password page
                if (mustChangePassword) {
                    console.log('🔑 User must change password');
                    navigate('/change-password');
                    return;
                }

                // ✅ Redirect based on role
                const role = data.role;
                if (role === 'admin') navigate('/admin');
                else if (role === 'registrar') navigate('/registrar');
                else if (role === 'finance_officer') navigate('/finance');
                else if (role === 'teacher') navigate('/teacher');
                else if (role === 'student') navigate('/student');
                else if (role === 'parent') navigate('/parent');
                else navigate('/dashboard');
            } else {
                setError(response.data.error || "Login failed");
            }
        } catch (err: any) {
            console.error('❌ Login error:', err);
            if (err.response) {
                setError(err.response.data?.error || "Login failed. Please try again.");
            } else if (err.request) {
                setError("Cannot connect to server. Please check if backend is running.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 dark:border-gray-700">
                {/* ✅ School Logo & Branding - CENTERED & LARGER */}
                <div className="text-center mb-8">
                    <div className="flex flex-col items-center justify-center gap-4 mb-4">
                        <img
                            src={schoolLogo}
                            alt={SCHOOL_NAME}
                            className="w-28 h-28 rounded-2xl object-cover shadow-xl border-2 border-blue-100 dark:border-gray-700"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const parent = (e.target as HTMLImageElement).parentElement;
                                if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl text-3xl font-bold text-white';
                                    fallback.textContent = 'KS';
                                    parent.appendChild(fallback);
                                }
                            }}
                        />
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                                {SCHOOL_NAME}
                            </h1>
                            <p className="text-sm text-blue-600 font-medium flex items-center justify-center gap-1 mt-1">
                                <Sparkles size={14} className="text-yellow-500" />
                                {SCHOOL_TAGLINE}
                                <Sparkles size={14} className="text-yellow-500" />
                            </p>
                        </div>
                    </div>
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-300 to-transparent mx-auto my-3"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to your account</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-2 mb-4">
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="you@school.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 dark:text-gray-100"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 dark:text-gray-100"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            {password.length === 0 && "Leave blank if you're changing your password"}
                        </p>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

               
                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        © {new Date().getFullYear()} {SCHOOL_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;