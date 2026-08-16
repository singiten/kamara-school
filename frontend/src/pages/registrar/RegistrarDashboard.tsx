// src/pages/registrar/RegistrarDashboard.tsx - Converted to apiClient

import { useState, useEffect } from "react";
import { Users, UserPlus, BookOpen, GraduationCap, School, Plus, Edit2, Trash2 } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
    class?: string;
    subject?: string;
}

interface ClassData {
    _id: string;
    name: string;
    grade: string;
    section: string;
    academicYear: string;
    students: UserData[];
    teacherIds: UserData[];
}

const RegistrarDashboard = () => {
    const [students, setStudents] = useState<UserData[]>([]);
    const [teachers, setTeachers] = useState<UserData[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const studentsRes = await apiClient.get('/api/registrar/students');
            setStudents(studentsRes.data.data || []);

            const teachersRes = await apiClient.get('/api/registrar/teachers');
            setTeachers(teachersRes.data.data || []);

            const classesRes = await apiClient.get('/api/registrar/classes');
            setClasses(classesRes.data.data || []);

            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching dashboard data:", error);
            setError(error.response?.data?.error || "Failed to load data");
            setLoading(false);
        }
    };

    const stats = [
        { title: "Total Students", value: students.length, icon: <Users size={24} className="text-blue-600" />, color: "bg-blue-50" },
        { title: "Total Teachers", value: teachers.length, icon: <UserPlus size={24} className="text-green-600" />, color: "bg-green-50" },
        { title: "Total Classes", value: classes.length, icon: <BookOpen size={24} className="text-purple-600" />, color: "bg-purple-50" },
    ];

    if (loading) {
        return (
            <DashboardLayout role="registrar">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading dashboard...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="registrar">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-red-600">{error}</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="registrar">
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.title} className={`${stat.color} p-5 rounded-xl shadow-sm flex items-center gap-4`}>
                            <div className="bg-white p-3 rounded-lg shadow-sm">{stat.icon}</div>
                            <div>
                                <p className="text-gray-500 text-sm">{stat.title}</p>
                                <h2 className="text-2xl font-bold text-gray-800">{stat.value}</h2>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Students</h3>
                        {students.slice(0, 5).length === 0 ? (
                            <p className="text-gray-500 text-sm">No students registered yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {students.slice(0, 5).map((student) => (
                                    <li key={student._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-800">{student.name}</p>
                                            <p className="text-sm text-gray-500">{student.class || 'No class'}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{student.email}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Teachers</h3>
                        {teachers.slice(0, 5).length === 0 ? (
                            <p className="text-gray-500 text-sm">No teachers registered yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {teachers.slice(0, 5).map((teacher) => (
                                    <li key={teacher._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-800">{teacher.name}</p>
                                            <p className="text-sm text-gray-500">{teacher.subject || 'No subject'}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{teacher.email}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default RegistrarDashboard;