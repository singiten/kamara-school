// src/pages/student/MyFees.tsx - FIXED API ENDPOINT

import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface FeeStatus {
    feeName: string;
    status: string;
    statusText: string;
    statusColor: string;
    dueDate: string;
}

interface FeeSummary {
    totalFees: number;
    paid: number;
    pending: number;
    overdue: number;
}

const MyFees = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState<FeeSummary | null>(null);
    const [fees, setFees] = useState<FeeStatus[]>([]);

    useEffect(() => {
        fetchFeeStatus();
    }, []);

    const fetchFeeStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const studentId = user?._id;

            if (!studentId) {
                setError("Student ID not found");
                setLoading(false);
                return;
            }

            // ✅ Use the correct finance route for student fees
            const response = await axios.get(
                `http://localhost:7000/api/finance/parent/student-fees?studentId=${studentId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                const feesData = response.data.data || [];
                
                // ✅ Transform data to match the UI
                const transformedFees = feesData.map((fee: any) => {
                    let statusText = 'Pending';
                    let statusColor = 'yellow';
                    
                    if (fee.status === 'paid') {
                        statusText = 'Paid';
                        statusColor = 'green';
                    } else if (fee.isOverdue || fee.status === 'overdue') {
                        statusText = 'Overdue';
                        statusColor = 'red';
                    }
                    
                    return {
                        feeName: fee.feeName || 'Unknown Fee',
                        status: fee.status,
                        statusText: statusText,
                        statusColor: statusColor,
                        dueDate: fee.dueDate || fee.endDate || new Date().toISOString(),
                    };
                });

                // ✅ Calculate summary
                const totalFees = transformedFees.length;
                const paid = transformedFees.filter(f => f.status === 'paid').length;
                const pending = transformedFees.filter(f => f.status === 'pending').length;
                const overdue = transformedFees.filter(f => f.status === 'overdue' || f.statusColor === 'red').length;

                setSummary({
                    totalFees,
                    paid,
                    pending,
                    overdue,
                });
                setFees(transformedFees);
            }
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching fee status:", error);
            setError(error.response?.data?.error || "Failed to load fee status");
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string, color: string) => {
        const colorMap: Record<string, string> = {
            green: "bg-green-100 text-green-700",
            yellow: "bg-yellow-100 text-yellow-700",
            red: "bg-red-100 text-red-700",
        };

        const iconMap: Record<string, string> = {
            green: "✅",
            yellow: "⏳",
            red: "❌",
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorMap[color] || 'bg-gray-100 text-gray-700'}`}>
                {iconMap[color] || ''} {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <DashboardLayout role="student">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading fee status...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="student">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-red-600">{error}</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="student">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Fee Status</h1>
                    <p className="text-gray-500">Track your fee payment status</p>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                            <p className="text-gray-500 text-sm">Total Fees</p>
                            <h2 className="text-2xl font-bold text-gray-800">{summary.totalFees}</h2>
                        </div>
                        <div className="bg-green-50 rounded-xl shadow-sm p-4 text-center border border-green-200">
                            <p className="text-green-600 text-sm">✅ Paid</p>
                            <h2 className="text-2xl font-bold text-green-700">{summary.paid}</h2>
                        </div>
                        <div className="bg-yellow-50 rounded-xl shadow-sm p-4 text-center border border-yellow-200">
                            <p className="text-yellow-600 text-sm">⏳ Pending</p>
                            <h2 className="text-2xl font-bold text-yellow-700">{summary.pending}</h2>
                        </div>
                        <div className="bg-red-50 rounded-xl shadow-sm p-4 text-center border border-red-200">
                            <p className="text-red-600 text-sm">❌ Overdue</p>
                            <h2 className="text-2xl font-bold text-red-700">{summary.overdue}</h2>
                        </div>
                    </div>
                )}

                {/* Fee Status Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h2 className="font-semibold text-lg text-gray-800">Fee Status</h2>
                        <p className="text-sm text-gray-500">Your fee payment status (amounts hidden)</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Fee Name</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {fees.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                            No fees assigned to you.
                                        </td>
                                    </tr>
                                ) : (
                                    fees.map((fee, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{fee.feeName}</td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(fee.status, fee.statusColor)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MyFees;