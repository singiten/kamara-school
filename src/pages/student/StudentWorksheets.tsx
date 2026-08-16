// src/pages/student/StudentWorksheets.tsx - USING SUBMITTED LOGIC

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Search,
    Eye,
    Calendar,
    Award,
    ChevronRight,
    BookOpen
} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface Worksheet {
    _id: string;
    title: string;
    subject: string;
    totalMarks: number;
    totalQuestions: number;
    duration: number;
    dueDate?: string;
    score?: number | null;
    percentage?: number | null;
    teacherName?: string;
    // ✅ KEY FIELD: This tells us if student submitted
    isSubmitted?: boolean;
    submittedAt?: string | null;
    status?: 'pending' | 'submitted' | 'completed' | 'overdue';
}

const StudentWorksheets = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchWorksheets();
    }, []);

    const fetchWorksheets = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/worksheets/my-worksheets', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setWorksheets(response.data.data || []);
                console.log('📊 Worksheets:', response.data.data);
            }
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching worksheets:", error);
            setError(error.response?.data?.error || "Failed to load worksheets");
            setLoading(false);
        }
    };

    // ✅ SIMPLE: Check if worksheet was submitted
    const isSubmitted = (w: Worksheet) => {
        return w.isSubmitted === true || 
               w.status === 'submitted' || 
               w.status === 'completed' ||
               (w.submittedAt !== undefined && w.submittedAt !== null);
    };

    const getStatusBadge = (w: Worksheet) => {
        if (isSubmitted(w)) {
            return {
                icon: <CheckCircle size={16} className="text-green-600" />,
                text: 'Submitted',
                color: 'bg-green-100 text-green-700'
            };
        }
        return {
            icon: <Clock size={16} className="text-yellow-600" />,
            text: 'Pending',
            color: 'bg-yellow-100 text-yellow-700'
        };
    };

    const getScoreColor = (percentage?: number | null) => {
        if (percentage === undefined || percentage === null) return 'text-gray-500';
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-blue-600';
        if (percentage >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const filteredWorksheets = worksheets.filter(w => {
        const submitted = isSubmitted(w);
        if (filter === 'submitted' && !submitted) return false;
        if (filter === 'pending' && submitted) return false;
        const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             w.subject.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (loading) {
        return (
            <DashboardLayout role="student">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading worksheets...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="student">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <p className="text-xl text-red-600">{error}</p>
                        <button onClick={fetchWorksheets} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="student">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen size={24} className="text-blue-600" />
                        Available Worksheets
                    </h1>
                    <p className="text-gray-500">Complete worksheets to test your knowledge</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center border">
                        <p className="text-gray-500 text-sm">Total</p>
                        <h2 className="text-2xl font-bold text-gray-800">{worksheets.length}</h2>
                    </div>
                    <div className="bg-yellow-50 rounded-xl shadow-sm p-4 text-center border border-yellow-200">
                        <p className="text-yellow-600 text-sm">Pending</p>
                        <h2 className="text-2xl font-bold text-yellow-700">
                            {worksheets.filter(w => !isSubmitted(w)).length}
                        </h2>
                    </div>
                    <div className="bg-green-50 rounded-xl shadow-sm p-4 text-center border border-green-200">
                        <p className="text-green-600 text-sm">Submitted</p>
                        <h2 className="text-2xl font-bold text-green-700">
                            {worksheets.filter(w => isSubmitted(w)).length}
                        </h2>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'submitted'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredWorksheets.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
                            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                            No worksheets found.
                        </div>
                    ) : (
                        filteredWorksheets.map((w) => {
                            const submitted = isSubmitted(w);
                            const status = getStatusBadge(w);

                            return (
                                <div key={w._id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{w.title}</h3>
                                            <p className="text-sm text-gray-500">{w.subject} • {w.teacherName || 'Teacher'}</p>
                                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                                                <span>{w.totalQuestions} questions</span>
                                                <span>{w.totalMarks} marks</span>
                                                <span>{w.duration} min</span>
                                                {w.dueDate && <span>Due: {new Date(w.dueDate).toLocaleDateString()}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 flex-wrap">
                                            {submitted && w.score !== undefined && w.score !== null && (
                                                <div className="text-center px-3 py-1.5 bg-gray-50 rounded-lg">
                                                    <p className={`text-lg font-bold ${getScoreColor(w.percentage)}`}>
                                                        {w.percentage ?? 0}%
                                                    </p>
                                                    <p className="text-xs text-gray-500">{w.score}/{w.totalMarks}</p>
                                                </div>
                                            )}

                                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                                                {status.icon} {status.text}
                                            </span>

                                            {submitted ? (
                                                // ✅ REVIEW BUTTON - Shows when submitted
                                                <button
                                                    onClick={() => navigate(`/student/worksheets/${w._id}/review`)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Eye size={16} /> Review
                                                </button>
                                            ) : (
                                                // Start button for pending worksheets
                                                <button
                                                    onClick={() => navigate(`/student/worksheets/${w._id}/attempt`)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    Start <ChevronRight size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentWorksheets;