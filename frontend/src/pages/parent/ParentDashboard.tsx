// src/pages/parent/ParentDashboard.tsx - COMPLETE WITH TYPESCRIPT FIXES

import { useState, useEffect } from "react";
import { 
    Users, 
    ClipboardCheck, 
    GraduationCap, 
    Megaphone, 
    Bell,
    Calendar,
    DollarSign,
    FileText,
    ChevronRight,
    UserPlus,
    Clock,
    Award,
    School,
    AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

// ============================================
// 📌 INTERFACES
// ============================================

interface Child {
    _id: string;
    name: string;
    email: string;
    class: string;
    classLevel: string;
    age: number;
}

interface Announcement {
    _id: string;
    title: string;
    content: string;
    audience: string;
    priority: string;
    createdAt: string;
    createdBy?: { name: string };
    status?: string; // ✅ Added status field
}

interface Attendance {
    _id: string;
    studentId: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    subject?: string;
    classId?: string;
}

interface Grade {
    _id: string;
    studentId: string;
    subject: string;
    score: number;
    grade: string;
    term: string;
    academicYear: string;
}

interface FeeStatus {
    totalFees: number;
    paid: number;
    pending: number;
    overdue: number;
}

interface Payment {
    _id: string;
    amount: number;
    status: string;
    createdAt: string;
    studentFeeId?: { feeName: string };
}

// ============================================
// 📌 MAIN COMPONENT
// ============================================

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // ✅ State
    const [children, setChildren] = useState<Child[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [feeStatus, setFeeStatus] = useState<FeeStatus | null>(null);
    const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
    const [totalOutstanding, setTotalOutstanding] = useState(0);

    // ✅ Get user info with null check
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?._id || ''; // ✅ Provide fallback empty string
    const parentName = user?.name || 'Parent';

    // ============================================
    // 📡 FETCH DATA
    // ============================================

    useEffect(() => {
        if (userId) {
            fetchAllData();
        } else {
            setError("User not found. Please login again.");
            setLoading(false);
        }
    }, [userId]);

    const fetchAllData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError("Authentication required");
                setLoading(false);
                return;
            }
            
            // ✅ 1. Fetch children
            await fetchChildren(token);
            
            // ✅ 2. Fetch announcements
            await fetchAnnouncements(token);
            
            // ✅ 3. Fetch fees and payments
            await fetchFeesAndPayments(token);
            
            // ✅ 4. Fetch attendance and grades (if children exist)
            if (children.length > 0) {
                await fetchChildrenData(token);
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching parent data:", error);
            setError("Failed to load dashboard data");
            setLoading(false);
        }
    };

    // ✅ Fetch Children
    const fetchChildren = async (token: string) => {
        try {
            const response = await axios.get(
                `http://localhost:7000/api/parents/${userId}/children`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const childrenData = response.data.data || [];
            setChildren(childrenData);
            return childrenData;
        } catch (error) {
            console.error("Error fetching children:", error);
            return [];
        }
    };

    // ✅ Fetch Announcements
    const fetchAnnouncements = async (token: string) => {
        try {
            const response = await axios.get(
                'http://localhost:7000/api/announcements',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const announcementsData = response.data.data || [];
            // Filter for parent-relevant announcements
            const parentAnnouncements = announcementsData.filter(
                (a: any) => a.audience === 'parents' || a.audience === 'all' || a.audience === 'All'
            );
            setAnnouncements(parentAnnouncements.slice(0, 5));
        } catch (error) {
            console.error("Error fetching announcements:", error);
        }
    };

    // ✅ Fetch Fees and Payments
    const fetchFeesAndPayments = async (token: string) => {
        try {
            // Get children IDs
            const childIds = children.map(c => c._id);
            
            if (childIds.length === 0) return;

            // ✅ Fetch fee status for each child
            let totalFees = 0;
            let paid = 0;
            let pending = 0;
            let overdue = 0;
            let outstanding = 0;

            for (const childId of childIds) {
                try {
                    const feeRes = await axios.get(
                        `http://localhost:7000/api/finance/parent/student-fees?studentId=${childId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    const fees = feeRes.data.data || [];
                    totalFees += fees.length;
                    
                    const paidCount = fees.filter((f: any) => f.status === 'paid').length;
                    paid += paidCount;
                    
                    const pendingCount = fees.filter((f: any) => f.status === 'pending').length;
                    pending += pendingCount;
                    
                    const overdueCount = fees.filter((f: any) => f.isOverdue).length;
                    overdue += overdueCount;
                    
                    // Calculate outstanding balance
                    fees.forEach((f: any) => {
                        if (f.status !== 'paid') {
                            outstanding += f.totalAmount || f.amount || 0;
                        }
                    });
                } catch (error) {
                    console.error(`Error fetching fees for child ${childId}:`, error);
                }
            }

            setFeeStatus({ totalFees, paid, pending, overdue });
            setTotalOutstanding(outstanding);

            // ✅ Fetch recent payments
            if (childIds.length > 0) {
                try {
                    const payRes = await axios.get(
                        `http://localhost:7000/api/finance/parent/payments?studentId=${childIds[0]}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setRecentPayments(payRes.data.data?.slice(0, 5) || []);
                } catch (error) {
                    console.error("Error fetching payments:", error);
                }
            }
        } catch (error) {
            console.error("Error fetching fees and payments:", error);
        }
    };

    // ✅ Fetch Attendance and Grades for Children
    const fetchChildrenData = async (token: string) => {
        try {
            // For now, we'll use mock or limited data
            // In production, you would fetch from actual attendance and grade endpoints
            setAttendance([]);
            setGrades([]);
        } catch (error) {
            console.error("Error fetching children data:", error);
        }
    };

    // ============================================
    // 📊 HELPERS
    // ============================================

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'bg-gray-100 text-gray-600',
            medium: 'bg-blue-100 text-blue-700',
            high: 'bg-orange-100 text-orange-700',
            urgent: 'bg-red-100 text-red-700 animate-pulse',
        };
        return colors[priority] || 'bg-gray-100 text-gray-600';
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            paid: 'bg-green-100 text-green-700',
            overdue: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount || 0);
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // ============================================
    // 🎨 RENDER
    // ============================================

    if (loading) {
        return (
            <DashboardLayout role="parent">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading your dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="parent">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="text-xl text-red-600">{error}</p>
                        <button
                            onClick={() => fetchAllData()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ✅ Safe filter with optional chaining
    const publishedAnnouncements = announcements.filter(a => a.status === 'Published' || a.status === 'published');

    return (
        <DashboardLayout role="parent">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Welcome, {parentName} 👋
                        </h1>
                        <p className="text-gray-500">Monitor your children's progress</p>
                    </div>
                    <div className="flex gap-2">
                        <Link 
                            to="/parent/children"
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <UserPlus size={18} />
                            View Children
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Children</p>
                                <h2 className="text-3xl font-bold text-gray-800">{children.length}</h2>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Users size={22} className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Outstanding Balance</p>
                                <h2 className="text-3xl font-bold text-yellow-600">{formatCurrency(totalOutstanding)}</h2>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-xl">
                                <DollarSign size={22} className="text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Announcements</p>
                                <h2 className="text-3xl font-bold text-purple-600">{publishedAnnouncements.length}</h2>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <Megaphone size={22} className="text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Fees Due</p>
                                <h2 className="text-3xl font-bold text-red-600">{feeStatus?.pending || 0}</h2>
                            </div>
                            <div className="bg-red-100 p-3 rounded-xl">
                                <AlertCircle size={22} className="text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Children Overview */}
                {children.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <School size={20} className="text-blue-600" />
                                Your Children
                            </h2>
                            <Link 
                                to="/parent/children" 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {children.map((child) => (
                                <div key={child._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-800">{child.name}</p>
                                        <p className="text-sm text-gray-500">{child.class || 'No Class'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link 
                                            to={`/parent/child/${child._id}/grades`}
                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition"
                                        >
                                            Grades
                                        </Link>
                                        <Link 
                                            to={`/parent/child/${child._id}/attendance`}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition"
                                        >
                                            Attendance
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Announcements & Recent Payments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Announcements */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Megaphone size={20} className="text-blue-600" />
                                Recent Announcements
                            </h3>
                            <Link 
                                to="/parent/announcements" 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        {publishedAnnouncements.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Bell size={40} className="mx-auto text-gray-300 mb-3" />
                                <p>No announcements yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {publishedAnnouncements.slice(0, 3).map((a) => (
                                    <div key={a._id} className="border-b pb-3 last:border-0 hover:bg-gray-50 p-2 rounded-lg transition">
                                        <h4 className="font-medium text-gray-800">{a.title}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-2">{a.content}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            <span>{getTimeAgo(a.createdAt)}</span>
                                            <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(a.priority)}`}>
                                                {a.priority || 'Normal'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <DollarSign size={20} className="text-green-600" />
                                Recent Payments
                            </h3>
                            <Link 
                                to="/parent/payments" 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        {recentPayments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                                <p>No payment records</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentPayments.map((payment) => (
                                    <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {payment.studentFeeId?.feeName || 'Payment'}
                                            </p>
                                            <p className="text-xs text-gray-500">{getTimeAgo(payment.createdAt)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(payment.status)}`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <ClipboardCheck size={20} className="text-blue-600" />
                        Quick Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Children</p>
                            <p className="text-2xl font-bold text-blue-600">{children.length}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Fees Paid</p>
                            <p className="text-2xl font-bold text-green-600">{feeStatus?.paid || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Pending Fees</p>
                            <p className="text-2xl font-bold text-yellow-600">{feeStatus?.pending || 0}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Overdue</p>
                            <p className="text-2xl font-bold text-red-600">{feeStatus?.overdue || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link 
                        to="/parent/payments"
                        className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition flex items-center gap-3"
                    >
                        <div className="bg-green-100 p-2 rounded-xl">
                            <DollarSign size={18} className="text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Make Payment</span>
                    </Link>
                    <Link 
                        to="/parent/attendance"
                        className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition flex items-center gap-3"
                    >
                        <div className="bg-blue-100 p-2 rounded-xl">
                            <Calendar size={18} className="text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">View Attendance</span>
                    </Link>
                    <Link 
                        to="/parent/grades"
                        className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition flex items-center gap-3"
                    >
                        <div className="bg-purple-100 p-2 rounded-xl">
                            <Award size={18} className="text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Check Grades</span>
                    </Link>
                    <Link 
                        to="/parent/chat"
                        className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition flex items-center gap-3"
                    >
                        <div className="bg-pink-100 p-2 rounded-xl">
                            <Clock size={18} className="text-pink-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Contact Teacher</span>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ParentDashboard;