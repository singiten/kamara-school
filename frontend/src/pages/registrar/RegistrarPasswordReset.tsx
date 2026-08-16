import { useState, useEffect } from "react";
import { 
    RefreshCw, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Mail, 
    User, 
    Key,
    Search,
    Filter,
    AlertCircle,
    Eye,
    EyeOff
} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface ResetRequest {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    email: string;
    status: 'pending' | 'resolved' | 'cancelled';
    requestedAt: string;
    resolvedAt?: string;
    resolvedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    notes?: string;
}

const RegistrarPasswordReset = () => {
    const [requests, setRequests] = useState<ResetRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'cancelled'>('pending');
    const [searchTerm, setSearchTerm] = useState("");
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ResetRequest | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/api/password-reset/all');
            setRequests(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching requests:", error);
            setError(error.response?.data?.error || "Failed to load requests");
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedRequest) return;
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }

        setSubmitting(true);
        try {
            const response = await apiClient.post(
                `/api/password-reset/${selectedRequest._id}/reset`,
                { newPassword, notes }
            );

            setSuccess(true);
            setSuccessMessage(`Password reset successfully for ${selectedRequest.userId.name}`);
            setShowResetModal(false);
            fetchRequests();
            setNewPassword("");
            setNotes("");
            setSelectedRequest(null);

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to reset password");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelRequest = async (requestId: string) => {
        if (!window.confirm("Are you sure you want to cancel this reset request?")) return;
        try {
            await apiClient.put(
                `/api/password-reset/${requestId}/cancel`,
                { reason: "Cancelled by registrar" }
            );
            fetchRequests();
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to cancel request");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return { icon: <Clock size={14} />, text: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
            case 'resolved':
                return { icon: <CheckCircle size={14} />, text: 'Resolved', color: 'bg-green-100 text-green-700' };
            case 'cancelled':
                return { icon: <XCircle size={14} />, text: 'Cancelled', color: 'bg-red-100 text-red-700' };
            default:
                return { icon: <Clock size={14} />, text: status, color: 'bg-gray-100 text-gray-700' };
        }
    };

    const filteredRequests = requests.filter(r => {
        const matchesFilter = filter === 'all' || r.status === filter;
        const matchesSearch = r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             r.userId?.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <DashboardLayout role="registrar">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading reset requests...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="registrar">
            <div className="space-y-6">
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-green-700 dark:text-green-400 flex items-center gap-3">
                        <CheckCircle size={24} />
                        <p className="font-medium">{successMessage}</p>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <Key size={24} className="text-blue-600" />
                            Password Reset Requests
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage and process password reset requests</p>
                    </div>
                    <button
                        onClick={fetchRequests}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{requests.length}</h2>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-sm p-4 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-yellow-600 dark:text-yellow-400 text-sm">Pending</p>
                        <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                            {requests.filter(r => r.status === 'pending').length}
                        </h2>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-sm p-4 border border-green-200 dark:border-green-800">
                        <p className="text-green-600 dark:text-green-400 text-sm">Resolved</p>
                        <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {requests.filter(r => r.status === 'resolved').length}
                        </h2>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm p-4 border border-red-200 dark:border-red-800">
                        <p className="text-red-600 dark:text-red-400 text-sm">Cancelled</p>
                        <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                            {requests.filter(r => r.status === 'cancelled').length}
                        </h2>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'pending', 'resolved', 'cancelled'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">User</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Role</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Requested</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No reset requests found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((request) => {
                                        const status = getStatusBadge(request.status);
                                        return (
                                            <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                                                    {request.userId?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={14} className="text-gray-400" />
                                                        {request.email}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                                        {request.userId?.role || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(request.requestedAt).toLocaleDateString()}
                                                    <br />
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {new Date(request.requestedAt).toLocaleTimeString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${status.color}`}>
                                                        {status.icon} {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        {request.status === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedRequest(request);
                                                                        setShowResetModal(true);
                                                                    }}
                                                                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                                                                >
                                                                    Reset
                                                                </button>
                                                                <button
                                                                    onClick={() => handleCancelRequest(request._id)}
                                                                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                        {request.status === 'resolved' && (
                                                            <span className="text-xs text-green-600 dark:text-green-400">Resolved</span>
                                                        )}
                                                        {request.status === 'cancelled' && (
                                                            <span className="text-xs text-red-600 dark:text-red-400">Cancelled</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showResetModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="text-center mb-6">
                            <Key size={48} className="text-blue-500 mx-auto mb-3" />
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Reset Password</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Reset password for <span className="font-medium">{selectedRequest.userId?.name}</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{selectedRequest.email}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    New Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any notes..."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100 resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setSelectedRequest(null);
                                        setNewPassword("");
                                        setNotes("");
                                    }}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={submitting || newPassword.length < 6}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50"
                                >
                                    {submitting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default RegistrarPasswordReset;