// src/pages/finance/FinancePayments.tsx - WITH apiClient

import { useState, useEffect } from "react";
import { Check, X, Eye, Download, AlertCircle, Banknote, Users, FileText } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Payment {
    _id: string;
    studentId: {
        _id: string;
        name: string;
        email: string;
        class: string;
    };
    studentFeeId: {
        _id: string;
        feeName: string;
        amount: number;
    };
    amount: number;
    bankName: string;
    referenceNumber: string;
    screenshotUrl: string;
    status: string;
    receiptNumber: string;
    receiptUrl: string;
    rejectionReason: string;
    confirmedBy: {
        _id: string;
        name: string;
        email: string;
    };
    confirmedAt: string;
    createdAt: string;
    notes: string;
    paymentDate: string;
}

interface Stats {
    pending: number;
    confirmed: number;
    rejected: number;
    totalCollected: number;
}

const FinancePayments = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [stats, setStats] = useState<Stats>({
        pending: 0,
        confirmed: 0,
        rejected: 0,
        totalCollected: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<string>("all");
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);

    useEffect(() => {
        fetchPayments();
        fetchStats();
    }, []);

    // ✅ Use apiClient
    const fetchPayments = async () => {
        try {
            const url = filter === 'all'
                ? '/api/finance/payments'
                : `/api/finance/payments?status=${filter}`;

            const response = await apiClient.get(url);
            setPayments(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching payments:", error);
            setError(error.response?.data?.error || "Failed to load payments");
            setLoading(false);
        }
    };

    // ✅ Use apiClient
    const fetchStats = async () => {
        try {
            const response = await apiClient.get('/api/finance/revenue');
            setStats(response.data.data || {
                pending: 0,
                confirmed: 0,
                rejected: 0,
                totalCollected: 0,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    // ✅ Use apiClient
    const handleViewPayment = async (paymentId: string) => {
        try {
            setViewLoading(true);
            const response = await apiClient.get(`/api/finance/payments/${paymentId}`);
            setSelectedPayment(response.data.data);
            setShowViewModal(true);
            setViewLoading(false);
        } catch (error: any) {
            console.error("Error fetching payment details:", error);
            alert(error.response?.data?.error || "Failed to load payment details");
            setViewLoading(false);
        }
    };

    // ✅ Use apiClient
    const handleApprove = async (id: string) => {
        if (!window.confirm("Are you sure you want to approve this payment?")) return;
        try {
            await apiClient.put(`/api/finance/payments/${id}/confirm`, {});
            setSuccess(true);
            setSuccessMessage("✅ Payment approved successfully!");
            fetchPayments();
            fetchStats();
            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to approve payment");
        }
    };

    // ✅ Use apiClient
    const handleReject = async (id: string) => {
        const reason = prompt("Please enter rejection reason:");
        if (reason === null) return;
        if (!window.confirm("Are you sure you want to reject this payment?")) return;
        try {
            await apiClient.put(`/api/finance/payments/${id}/reject`, { reason: reason || "Payment rejected" });
            setSuccess(true);
            setSuccessMessage("❌ Payment rejected!");
            fetchPayments();
            fetchStats();
            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to reject payment");
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            failed: 'bg-gray-100 text-gray-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <Check size={16} className="text-green-600" />;
            case 'pending': return <AlertCircle size={16} className="text-yellow-600" />;
            case 'rejected': return <X size={16} className="text-red-600" />;
            default: return null;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading payments...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400 flex items-center gap-3 animate-fadeIn">
                        <Check size={24} />
                        <p className="font-medium">{successMessage}</p>
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Payment Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Review and confirm student payments</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-sm text-yellow-700 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-yellow-800">{stats.pending || 0}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-700 font-medium">Confirmed</p>
                        <p className="text-2xl font-bold text-green-800">{stats.confirmed || 0}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-sm text-red-700 font-medium">Rejected</p>
                        <p className="text-2xl font-bold text-red-800">{stats.rejected || 0}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-700 font-medium">Total Collected</p>
                        <p className="text-2xl font-bold text-blue-800">{formatCurrency(stats.totalCollected || 0)}</p>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'pending'
                                    ? 'bg-yellow-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setFilter('confirmed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'confirmed'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Confirmed
                        </button>
                        <button
                            onClick={() => setFilter('rejected')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'rejected'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            Rejected
                        </button>
                    </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Student</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Fee</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Bank</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Reference</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No payments found.
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((payment) => (
                                        <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">{payment.studentId?.name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{payment.studentId?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{payment.studentFeeId?.feeName || 'N/A'}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(payment.amount)}</td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{payment.bankName}</td>
                                            <td className="px-4 py-3 font-mono text-sm text-gray-800 dark:text-gray-200">{payment.referenceNumber}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusBadge(payment.status)}`}>
                                                    {getStatusIcon(payment.status)}
                                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleViewPayment(payment._id)}
                                                        className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {payment.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(payment._id)}
                                                                className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                                                title="Approve"
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(payment._id)}
                                                                className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                                                title="Reject"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {payment.receiptUrl && (
                                                        <button
                                                            onClick={() => window.open(payment.receiptUrl, '_blank')}
                                                            className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                                            title="Download Receipt"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ✅ VIEW DETAILS MODAL */}
            {showViewModal && selectedPayment && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setShowViewModal(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <FileText size={20} />
                                Payment Details
                            </h2>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-1 rounded-lg hover:bg-gray-100 transition"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{selectedPayment.studentId?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedPayment.studentId?.email || ''}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Class</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{selectedPayment.studentId?.class || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Fee</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{selectedPayment.studentFeeId?.feeName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedPayment.amount)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Bank</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{selectedPayment.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Reference Number</p>
                                    <p className="font-mono font-medium text-gray-800 dark:text-gray-200">{selectedPayment.referenceNumber}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Payment Date</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{new Date(selectedPayment.paymentDate || selectedPayment.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedPayment.status)}`}>
                                        {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {selectedPayment.confirmedAt && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed At</p>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{new Date(selectedPayment.confirmedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed By</p>
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{selectedPayment.confirmedBy?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            )}

                            {selectedPayment.receiptNumber && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receipt Number</p>
                                    <p className="font-mono font-medium text-blue-600">{selectedPayment.receiptNumber}</p>
                                </div>
                            )}

                            {selectedPayment.rejectionReason && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Rejection Reason</p>
                                    <p className="text-red-600 dark:text-red-400 font-medium">{selectedPayment.rejectionReason}</p>
                                </div>
                            )}

                            {/* ✅ Payment Screenshot */}
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Screenshot</p>
                                {selectedPayment.screenshotUrl ? (
                                    <div className="border rounded-lg overflow-hidden">
                                        <img
                                            src={`${apiClient.defaults.baseURL}${selectedPayment.screenshotUrl}`}
                                            alt="Payment Screenshot"
                                            className="w-full max-h-96 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Screenshot+Not+Available';
                                            }}
                                        />
                                        <div className="bg-gray-50 dark:bg-gray-700 p-2 text-center">
                                            <a
                                                href={`${apiClient.defaults.baseURL}${selectedPayment.screenshotUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center gap-1"
                                            >
                                                <Eye size={14} />
                                                View Full Size
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                                        <p>No screenshot uploaded</p>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {selectedPayment.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                handleApprove(selectedPayment._id);
                                                setShowViewModal(false);
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                        >
                                            <Check size={18} />
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleReject(selectedPayment._id);
                                                setShowViewModal(false);
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                        >
                                            <X size={18} />
                                            Reject
                                        </button>
                                    </>
                                )}
                                {selectedPayment.receiptUrl && (
                                    <button
                                        onClick={() => window.open(selectedPayment.receiptUrl, '_blank')}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download Receipt
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default FinancePayments;