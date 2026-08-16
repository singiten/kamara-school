// src/pages/finance/FinanceDashboard.tsx - FIXED

import { useState, useEffect } from "react";
import { DollarSign, Clock, AlertCircle, TrendingUp, Plus, Users, FileText, CheckCircle } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";
import { Link } from "react-router-dom";

interface DashboardStats {
    totalCollected: number;
    pendingAmount: number;
    overdueAmount: number;
    collectionRate: number;
    totalFees: number;
    paidFees: number;
    pendingCount: number;
}

const FinanceDashboard = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalCollected: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        collectionRate: 0,
        totalFees: 0,
        paidFees: 0,
        pendingCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/finance/dashboard/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📊 Stats response:', response.data);
            setStats(response.data.data || {
                totalCollected: 0,
                pendingAmount: 0,
                overdueAmount: 0,
                collectionRate: 0,
                totalFees: 0,
                paidFees: 0,
                pendingCount: 0,
            });
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching stats:", error);
            setError(error.response?.data?.error || "Failed to load stats");
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount || 0);
    };

    if (loading) {
        return (
            <DashboardLayout role="finance_officer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading dashboard...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="finance_officer">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Finance Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage school fees, payments, and financial reports</p>
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-blue-700 dark:text-blue-400">Welcome, Finance Officer! You can view and manage all financial activities here.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Total Collected</p>
                                <p className="text-2xl font-bold text-green-800 dark:text-green-400">{formatCurrency(stats.totalCollected || 0)}</p>
                            </div>
                            <DollarSign size={32} className="text-green-600" />
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Pending Payments</p>
                                <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-400">{formatCurrency(stats.pendingAmount || 0)}</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-500">{stats.pendingCount || 0} payments pending</p>
                            </div>
                            <Clock size={32} className="text-yellow-600" />
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-red-700 dark:text-red-400 font-medium">Overdue Fees</p>
                                <p className="text-2xl font-bold text-red-800 dark:text-red-400">{formatCurrency(stats.overdueAmount || 0)}</p>
                            </div>
                            <AlertCircle size={32} className="text-red-600" />
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">Collection Rate</p>
                                <p className="text-2xl font-bold text-purple-800 dark:text-purple-400">{stats.collectionRate || 0}%</p>
                                <p className="text-xs text-purple-600 dark:text-purple-500">{stats.paidFees || 0} / {stats.totalFees || 0} fees paid</p>
                            </div>
                            <TrendingUp size={32} className="text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Fee Management</h3>
                        <div className="space-y-3">
                            <Link
                                to="/finance/fees"
                                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition"
                            >
                                <Plus size={20} className="text-blue-600" />
                                <div>
                                    <p className="font-medium text-blue-700 dark:text-blue-400">Create Fee Structure</p>
                                    <p className="text-sm text-blue-500 dark:text-blue-500">Create new fee structures</p>
                                </div>
                            </Link>
                            <Link
                                to="/finance/fees"
                                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                            >
                                <Users size={20} className="text-green-600" />
                                <div>
                                    <p className="font-medium text-green-700 dark:text-green-400">Assign Fees to Students</p>
                                    <p className="text-sm text-green-500 dark:text-green-500">Assign fees to students</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Payment Processing</h3>
                        <div className="space-y-3">
                            <Link
                                to="/finance/payments"
                                className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
                            >
                                <CheckCircle size={20} className="text-yellow-600" />
                                <div>
                                    <p className="font-medium text-yellow-700 dark:text-yellow-400">Confirm Payments</p>
                                    <p className="text-sm text-yellow-500 dark:text-yellow-500">Review and confirm pending payments</p>
                                </div>
                            </Link>
                            <Link
                                to="/finance/payments"
                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                            >
                                <FileText size={20} className="text-gray-600" />
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-gray-200">View All Payments</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">View payment history</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Reports Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            to="/finance/reports"
                            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <FileText size={24} className="text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">Revenue Report</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View revenue breakdown</p>
                            </div>
                        </Link>
                        <Link
                            to="/finance/reports"
                            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <FileText size={24} className="text-red-600" />
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">Expense Report</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View expense breakdown</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FinanceDashboard;