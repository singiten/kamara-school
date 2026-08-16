// src/pages/parent/ParentChildGrades.tsx - Converted to apiClient

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, BookOpen } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Grade {
    _id: string;
    subject: string;
    score: number;
    grade: string;
    type: string;
    semester: string;
    academicYear: string;
    date: string;
    teacherId: { name: string };
}

const ParentChildGrades = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchData();
    }, [childId]);

    const fetchData = async () => {
        try {
            // Use apiClient
            const userRes = await apiClient.get(`/api/users/${childId}`);
            setStudent(userRes.data.data);

            const gradesRes = await apiClient.get(`/api/grades/child/${childId}/grades`);
            setGrades(gradesRes.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching data:", error);
            setError(error.response?.data?.error || "Failed to load data");
            setLoading(false);
        }
    };

    const getGradeColor = (grade: string) => {
        const colors: Record<string, string> = {
            'A+': 'bg-green-100 text-green-700',
            'A': 'bg-green-100 text-green-700',
            'A-': 'bg-green-100 text-green-700',
            'B+': 'bg-blue-100 text-blue-700',
            'B': 'bg-blue-100 text-blue-700',
            'B-': 'bg-blue-100 text-blue-700',
            'C+': 'bg-yellow-100 text-yellow-700',
            'C': 'bg-yellow-100 text-yellow-700',
            'C-': 'bg-yellow-100 text-yellow-700',
            'D': 'bg-orange-100 text-orange-700',
            'F': 'bg-red-100 text-red-700',
        };
        return colors[grade] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <DashboardLayout role="parent">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading grades...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="parent">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-red-600">{error}</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="parent">
            <div className="space-y-6">
                <button
                    onClick={() => navigate('/parent/children')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                    <ArrowLeft size={18} /> Back to Children
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{student?.name}'s Grades</h1>
                    <p className="text-gray-500">{student?.class} • {student?.email}</p>
                </div>

                {grades.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <GraduationCap size={48} className="mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-700">No Grades Available</h3>
                        <p className="mt-1 text-gray-500">No grades have been recorded for this student yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Subject</th>
                                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Score</th>
                                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Grade</th>
                                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Teacher</th>
                                        <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {grades.map((grade) => (
                                        <tr key={grade._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{grade.subject}</td>
                                            <td className="px-6 py-4 font-bold">{grade.score}%</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGradeColor(grade.grade)}`}>
                                                    {grade.grade}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{grade.type}</td>
                                            <td className="px-6 py-4">{grade.teacherId?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(grade.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ParentChildGrades;