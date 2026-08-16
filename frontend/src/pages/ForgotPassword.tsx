import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, AlertCircle, CheckCircle, GraduationCap, Sparkles } from "lucide-react";
import { apiClient } from "../config/api";

const SCHOOL_LOGO = 'src/assets/logo.png';
const SCHOOL_NAME = 'Elevate Skills Academy';
const SCHOOL_TAGLINE = 'Empowering Ethiopian Futures';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [requestId, setRequestId] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const response = await apiClient.post('/api/password-reset/request', { email });

            if (response.data.success) {
                setSuccess(true);
                setRequestId(response.data.data.requestId);
            }
        } catch (error: any) {
            console.error("Error requesting reset:", error);
            setError(error.response?.data?.error || "Failed to request password reset");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 dark:border-gray-700">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        {SCHOOL_LOGO ? (
                            <img
                                src={SCHOOL_LOGO}
                                alt={SCHOOL_NAME}
                                className="w-14 h-14 rounded-2xl object-cover shadow-lg"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                                <GraduationCap size={28} className="text-white" />
                            </div>
                        )}
                        <div className="text-left">
                            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                                {SCHOOL_NAME}
                            </h1>
                            <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                <Sparkles size={12} className="text-yellow-500" />
                                {SCHOOL_TAGLINE}
                            </p>
                        </div>
                    </div>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-blue-300 to-transparent mx-auto my-2"></div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Reset your password</p>
                </div>

                {success ? (
                    <div className="text-center">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6">
                            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Request Submitted!</h3>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                Your password reset request has been sent to the registrar.
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Request ID: <span className="font-mono">{requestId}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </button>
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                    Submitting...
                                </span>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>

                        <div className="text-center">
                            <Link to="/login" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-2">
                                <ArrowLeft size={16} />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        © {new Date().getFullYear()} {SCHOOL_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;