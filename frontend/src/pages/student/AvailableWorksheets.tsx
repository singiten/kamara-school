import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, Award, Calendar, Users, CheckCircle, XCircle } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Worksheet {
    _id: string;
    title: string;
    description: string;
    subject: string;
    totalMarks: number;
    totalQuestions: number;
    duration: number;
    startDate: string;
    endDate: string;
    status: string;
    attempted: boolean;
    attemptStatus: string;
    score: number | null;
    percentage: number | null;
    teacherId: {
        name: string;
    };
}

const StudentAvailableWorksheets = () => {
    const navigate = useNavigate();
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchWorksheets();
    }, []);

    const fetchWorksheets = async () => {
        try {
            const response = await apiClient.get('/api/worksheets/available');
            setWorksheets(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching worksheets:", error);
            setError(error.response?.data?.error || "Failed to load worksheets");
            setLoading(false);
        }
    };

    const handleStart = async (worksheetId: string) => {
        try {
            await apiClient.post(`/api/worksheets/${worksheetId}/start`, {});
            navigate(`/student/worksheet/${worksheetId}/attempt`);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to start worksheet");
        }
    };

    const getTimeRemaining = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - now.getTime();
        if (diff <= 0) return "Expired";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${mins}m remaining`;
        return `${mins}m remaining`;
    };

    if (loading) {
        return (
            <DashboardLayout role="student">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading available worksheets...</div>
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Available Worksheets</h1>
                    <p className="text-gray-500">Complete worksheets to test your knowledge</p>
                </div>

                {worksheets.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <FileText size={48} className="mx-auto text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-700">No Worksheets Available</h3>
                        <p className="text-gray-500">Your teacher hasn't assigned any worksheets yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {worksheets.map((ws) => (
                            <div key={ws._id} className={`bg-white rounded-xl shadow-sm p-6 border ${
                                ws.attempted ? 'border-gray-200' : 'border-blue-200 hover:shadow-md transition'
                            }`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800">{ws.title}</h3>
                                        <p className="text-sm text-gray-500">{ws.subject} • {ws.teacherId?.name || 'Unknown'}</p>
                                        <p className="text-sm text-gray-400 mt-1">{ws.totalQuestions} questions • {ws.totalMarks} marks</p>
                                    </div>
                                    {ws.attempted && ws.attemptStatus === 'submitted' ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-bold text-green-600">{ws.percentage}%</span>
                                            <span className="text-xs text-gray-400">{ws.score}/{ws.totalMarks}</span>
                                        </div>
                                    ) : ws.attempted && ws.attemptStatus === 'in_progress' ? (
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                            In Progress
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {ws.duration} min
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} /> {getTimeRemaining(ws.endDate)}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    {ws.attempted && ws.attemptStatus === 'submitted' ? (
                                        <button
                                            disabled
                                            className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Completed
                                        </button>
                                    ) : ws.attempted && ws.attemptStatus === 'in_progress' ? (
                                        <button
                                            onClick={() => navigate(`/student/worksheet/${ws._id}/attempt`)}
                                            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2"
                                        >
                                            <Clock size={16} /> Resume
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStart(ws._id)}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                                        >
                                            <FileText size={16} /> Start Worksheet
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentAvailableWorksheets;