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
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading dashboard...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage school fees, payments, and financial reports</p>
                    
                </div>
</div>
                {/* Reports Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link
                            to="/adminReport"
                            className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <FileText size={24} className="text-blue-600" />
                            <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">Revenue Report</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View revenue breakdown</p>
                            </div>
                        </Link>
                        <Link
                            to="/adminReport"
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
            
        </DashboardLayout>
    );
};


export default FinanceDashboard;