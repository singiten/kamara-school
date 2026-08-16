// src/pages/teacher/TeacherDashboard.tsx - COMPLETE FIXED

import { useState, useEffect } from "react";
import { 
    Users, 
    ClipboardCheck, 
    GraduationCap, 
    Megaphone, 
    Bell,
    Calendar,
    FileText,
    ChevronRight,
    Clock,
    Award,
    School,
    AlertCircle,
    BookOpen,
    UserPlus,
    BarChart,
    TrendingUp,
    CheckCircle,
    XCircle,
    Activity,
    Briefcase,
    FolderOpen,
    Upload,
    MessageCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

// ============================================
// 📌 INTERFACES
// ============================================

interface Student {
    _id: string;
    name: string;
    email: string;
    class: string;
    classLevel: string;
}

interface Class {
    _id: string;
    name: string;
    grade: string;
    section: string;
    students: Student[];
    teacherIds: string[];
}

interface Announcement {
    _id: string;
    title: string;
    content: string;
    audience: string;
    priority: string;
    createdAt: string;
    createdBy?: { name: string };
    status?: string; // ✅ ADDED - Fixes the error
}

interface Resource {
    _id: string;
    title: string;
    subject: string;
    fileUrl: string;
    downloadCount: number;
    viewCount: number;
    createdAt: string;
}

interface Worksheet {
    _id: string;
    title: string;
    subject: string;
    totalQuestions: number;
    totalMarks: number;
    status: string;
    createdAt: string;
}

// ============================================
// 📌 MAIN COMPONENT
// ============================================

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // ✅ State
    const [teacherInfo, setTeacherInfo] = useState<any>(null);
    const [assignedClasses, setAssignedClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalResources, setTotalResources] = useState(0);
    const [totalWorksheets, setTotalWorksheets] = useState(0);
    const [pendingTasks, setPendingTasks] = useState(0);

    // ✅ Get user info
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?._id || '';
    const teacherName = user?.name || 'Teacher';
    const teacherSubject = user?.subject || '';

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
            
            // ✅ 1. Fetch teacher info
            await fetchTeacherInfo(token);
            
            // ✅ 2. Fetch assigned classes
            await fetchAssignedClasses(token);
            
            // ✅ 3. Fetch announcements
            await fetchAnnouncements(token);
            
            // ✅ 4. Fetch resources
            await fetchResources(token);
            
            // ✅ 5. Fetch worksheets
            await fetchWorksheets(token);
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching teacher data:", error);
            setError("Failed to load dashboard data");
            setLoading(false);
        }
    };

    // ✅ Fetch Teacher Info
    const fetchTeacherInfo = async (token: string) => {
        try {
            const response = await axios.get(
                `http://localhost:7000/api/auth/me`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTeacherInfo(response.data.data);
        } catch (error) {
            console.error("Error fetching teacher info:", error);
        }
    };

    // ✅ Fetch Assigned Classes
    const fetchAssignedClasses = async (token: string) => {
        try {
            // Try to get teacher's assigned classes
            const response = await axios.get(
                `http://localhost:7000/api/resources/teacher/classes`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const classesData = response.data.data || [];
            setAssignedClasses(classesData);
            
            // Count total students across all classes
            let studentCount = 0;
            classesData.forEach((cls: any) => {
                studentCount += cls.students?.length || 0;
            });
            setTotalStudents(studentCount);
            
        } catch (error) {
            console.error("Error fetching assigned classes:", error);
            // Fallback: try to get from /auth/me
            try {
                const meRes = await axios.get(
                    `http://localhost:7000/api/auth/me`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const userData = meRes.data.data;
                if (userData.assignedClasses) {
                    setAssignedClasses(userData.assignedClasses);
                }
            } catch (fallbackError) {
                console.error("Fallback error:", fallbackError);
            }
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
            // Filter for teacher-relevant announcements
            const teacherAnnouncements = announcementsData.filter(
                (a: any) => a.audience === 'teachers' || a.audience === 'all' || a.audience === 'All'
            );
            setAnnouncements(teacherAnnouncements.slice(0, 5));
        } catch (error) {
            console.error("Error fetching announcements:", error);
        }
    };

    // ✅ Fetch Resources
    const fetchResources = async (token: string) => {
        try {
            const response = await axios.get(
                'http://localhost:7000/api/resources',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const resourcesData = response.data.data || [];
            setResources(resourcesData.slice(0, 5));
            setTotalResources(resourcesData.length);
        } catch (error) {
            console.error("Error fetching resources:", error);
        }
    };

    // ✅ Fetch Worksheets
    const fetchWorksheets = async (token: string) => {
        try {
            const response = await axios.get(
                'http://localhost:7000/api/worksheets/my-worksheets',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const worksheetsData = response.data.data || [];
            setWorksheets(worksheetsData.slice(0, 5));
            setTotalWorksheets(worksheetsData.length);
            
            // Count pending tasks (draft worksheets)
            const pending = worksheetsData.filter((w: any) => w.status === 'draft').length;
            setPendingTasks(pending);
        } catch (error) {
            console.error("Error fetching worksheets:", error);
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
            draft: 'bg-gray-100 text-gray-700',
            published: 'bg-green-100 text-green-700',
            archived: 'bg-red-100 text-red-700',
            pending: 'bg-yellow-100 text-yellow-700',
            completed: 'bg-green-100 text-green-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
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
            <DashboardLayout role="teacher">
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
            <DashboardLayout role="teacher">
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

    // ✅ Fixed: Use optional chaining to safely access status
    const publishedAnnouncements = announcements.filter(a => a.status === 'Published' || a.status === 'published');

    return (
        <DashboardLayout role="teacher">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            Welcome, {teacherName} 👋
                        </h1>
                        <p className="text-gray-500">
                            {teacherSubject ? `Teaching ${teacherSubject}` : 'Manage your classes and students'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link 
                            to="/teacher/attendance"
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <ClipboardCheck size={18} />
                            Take Attendance
                        </Link>
                        <Link 
                            to="/teacher/resources"
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2"
                        >
                            <Upload size={18} />
                            Upload Resource
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Students</p>
                                <h2 className="text-3xl font-bold text-blue-600">{totalStudents}</h2>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Users size={22} className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Assigned Classes</p>
                                <h2 className="text-3xl font-bold text-green-600">{assignedClasses.length}</h2>
                            </div>
                            <div className="bg-green-100 p-3 rounded-xl">
                                <School size={22} className="text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Resources</p>
                                <h2 className="text-3xl font-bold text-purple-600">{totalResources}</h2>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <FolderOpen size={22} className="text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Pending Tasks</p>
                                <h2 className="text-3xl font-bold text-yellow-600">{pendingTasks}</h2>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-xl">
                                <Activity size={22} className="text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classes Overview */}
                {assignedClasses.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <School size={20} className="text-blue-600" />
                                Your Classes
                            </h2>
                            <Link 
                                to="/teacher/classes" 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {assignedClasses.map((cls) => (
                                <div key={cls._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="font-medium text-gray-800">{cls.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {cls.students?.length || 0} students
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link 
                                            to={`/teacher/attendance?class=${cls._id}`}
                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition"
                                        >
                                            Attendance
                                        </Link>
                                        <Link 
                                            to={`/teacher/grades?class=${cls._id}`}
                                            className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition"
                                        >
                                            Grades
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Resources & Worksheets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Resources */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <FolderOpen size={20} className="text-blue-600" />
                                Recent Resources
                            </h3>
                            <Link 
                                to="/teacher/resources" 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        {resources.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                                <p>No resources uploaded yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {resources.map((resource) => (
                                    <div key={resource._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-medium text-gray-800">{resource.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {resource.subject} • {resource.downloadCount || 0} downloads
                                            </p>
                                        </div>
                                        <span className="text-xs text-gray-400">{getTimeAgo(resource.createdAt)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Worksheets */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <BookOpen size={20} className="text-green-600" />
                                Recent Worksheets
                            </h3>
                            <Link 
                                to="/teacher/worksheets" 
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                                View All <ChevronRight size={16} />
                            </Link>
                        </div>
                        {worksheets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                                <p>No worksheets created yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {worksheets.map((worksheet) => (
                                    <div key={worksheet._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-medium text-gray-800">{worksheet.title}</p>
                                            <p className="text-xs text-gray-500">
                                                {worksheet.subject} • {worksheet.totalQuestions} questions
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(worksheet.status)}`}>
                                                {worksheet.status || 'draft'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Announcements & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Announcements */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Megaphone size={20} className="text-blue-600" />
                                Recent Announcements
                            </h3>
                            <Link 
                                to="/teacher/announcements" 
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

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Briefcase size={20} className="text-blue-600" />
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link 
                                to="/teacher/attendance"
                                className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition text-center border border-blue-200"
                            >
                                <ClipboardCheck size={24} className="mx-auto text-blue-600 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Take Attendance</span>
                            </Link>
                            <Link 
                                to="/teacher/grades"
                                className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition text-center border border-green-200"
                            >
                                <Award size={24} className="mx-auto text-green-600 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Enter Grades</span>
                            </Link>
                            <Link 
                                to="/teacher/resources"
                                className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition text-center border border-purple-200"
                            >
                                <Upload size={24} className="mx-auto text-purple-600 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Upload Resource</span>
                            </Link>
                            <Link 
                                to="/teacher/worksheets/create"
                                className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition text-center border border-orange-200"
                            >
                                <FileText size={24} className="mx-auto text-orange-600 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Create Worksheet</span>
                            </Link>
                            <Link 
                                to="/teacher/chat"
                                className="p-4 bg-pink-50 rounded-xl hover:bg-pink-100 transition text-center border border-pink-200"
                            >
                                <MessageCircle size={24} className="mx-auto text-pink-600 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Messages</span>
                            </Link>
                            <Link 
                                to="/teacher/report-cards"
                                className="p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition text-center border border-yellow-200"
                            >
                                <FileText size={24} className="mx-auto text-yellow-600 mb-2" />
                                <span className="text-sm font-medium text-gray-700">Report Cards</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeacherDashboard;