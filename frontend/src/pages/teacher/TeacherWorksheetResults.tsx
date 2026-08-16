import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Award, TrendingUp, PieChart, Clock, FileText, Download, X } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Attempt {
    _id: string;
    studentId: {
        _id: string;
        name: string;
        email: string;
        class: string;
    };
    score: number;
    totalMarks: number;
    percentage: number;
    timeTaken: number;
    status: string;
    submittedAt: string;
    answers: {
        questionIndex: number;
        selectedOption: number;
        isCorrect: boolean;
        marksObtained: number;
    }[];
}

interface ResultData {
    worksheet: {
        title: string;
        subject: string;
        totalMarks: number;
        totalQuestions: number;
    };
    summary: {
        totalStudents: number;
        averageScore: number;
        highestScore: number;
        passedStudents: number;
        passRate: number;
    };
    attempts: Attempt[];
}

const TeacherWorksheetResults = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [data, setData] = useState<ResultData | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<Attempt | null>(null);

    useEffect(() => {
        fetchResults();
    }, [id]);

    const fetchResults = async () => {
        try {
            const response = await apiClient.get(`/api/worksheets/${id}/results`);
            setData(response.data.data);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching results:", error);
            setError(error.response?.data?.error || "Failed to load results");
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getGradeColor = (percentage: number) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-blue-600';
        if (percentage >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getGradeBadge = (percentage: number) => {
        if (percentage >= 80) return 'bg-green-100 text-green-700';
        if (percentage >= 60) return 'bg-blue-100 text-blue-700';
        if (percentage >= 40) return 'bg-yellow-100 text-yellow-700';
        return 'bg-red-100 text-red-700';
    };

    if (loading) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading results...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-red-600">{error || "Failed to load results"}</div>
                </div>
            </DashboardLayout>
        );
    }

    const { worksheet, summary, attempts } = data;

    return (
        <DashboardLayout role="teacher">
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/teacher/worksheets')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{worksheet.title}</h1>
                        <p className="text-gray-500">{worksheet.subject} • {worksheet.totalQuestions} questions • {worksheet.totalMarks} marks</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Users size={18} />
                            <span className="text-sm">Total Students</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{summary.totalStudents}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Award size={18} />
                            <span className="text-sm">Average Score</span>
                        </div>
                        <p className={`text-2xl font-bold mt-1 ${getGradeColor(summary.averageScore)}`}>
                            {summary.averageScore}%
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <TrendingUp size={18} />
                            <span className="text-sm">Highest Score</span>
                        </div>
                        <p className="text-2xl font-bold mt-1 text-green-600">{summary.highestScore}%</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-2 text-gray-500">
                            <PieChart size={18} />
                            <span className="text-sm">Pass Rate</span>
                        </div>
                        <p className={`text-2xl font-bold mt-1 ${summary.passRate >= 70 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {summary.passRate}%
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Student Results</h2>
                        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                            <Download size={16} /> Export
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Student</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Class</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Score</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Percentage</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Time Taken</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attempts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No students have attempted this worksheet yet.
                                        </td>
                                    </tr>
                                ) : (
                                    attempts.map((attempt) => (
                                        <tr key={attempt._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{attempt.studentId?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4">{attempt.studentId?.class || 'N/A'}</td>
                                            <td className="px-6 py-4">{attempt.score}/{attempt.totalMarks}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeBadge(attempt.percentage)}`}>
                                                    {attempt.percentage}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{formatTime(attempt.timeTaken)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    attempt.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {attempt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedStudent(attempt)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedStudent(null)}>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold">
                                {selectedStudent.studentId?.name} - Results
                            </h2>
                            <button onClick={() => setSelectedStudent(null)} className="p-1 rounded-lg hover:bg-gray-100">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-sm text-gray-500">Score</p>
                                    <p className="text-2xl font-bold">{selectedStudent.score}/{selectedStudent.totalMarks}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-sm text-gray-500">Percentage</p>
                                    <p className={`text-2xl font-bold ${getGradeColor(selectedStudent.percentage)}`}>
                                        {selectedStudent.percentage}%
                                    </p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Answer Breakdown</h4>
                                <div className="space-y-2">
                                    {selectedStudent.answers.map((ans, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <span className="text-sm">Q{idx + 1}</span>
                                            <span className={`text-sm font-medium ${ans.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                                {ans.isCorrect ? '✅' : '❌'} {ans.marksObtained} marks
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

export default TeacherWorksheetResults;