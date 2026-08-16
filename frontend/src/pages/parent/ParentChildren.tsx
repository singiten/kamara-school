import { useState, useEffect } from "react";
import type { Users, User, BookOpen, Eye, GraduationCap, ClipboardCheck } from "lucide-react";
import { Users as UsersIcon, User as UserIcon, BookOpen as BookOpenIcon, Eye as EyeIcon, GraduationCap as GraduationCapIcon, ClipboardCheck as ClipboardCheckIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface Child {
    _id: string;
    name: string;
    email: string;
    class: string;
    age: number;
    parentName: string;
}

const ParentChildren = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchChildren();
    }, []);

    const fetchChildren = async () => {
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user?._id;

            if (!userId) {
                setError("User not found");
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `http://localhost:7000/api/parents/${userId}/children`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setChildren(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching children:", error);
            setError(error.response?.data?.error || "Failed to load children");
            setLoading(false);
        }
    };

    // ✅ Navigate to child's grades
    const viewGrades = (childId: string) => {
        navigate(`/parent/child/${childId}/grades`);
    };

    // ✅ Navigate to child's attendance
    const viewAttendance = (childId: string) => {
        navigate(`/parent/child/${childId}/attendance`);
    };

    if (loading) {
        return (
            <DashboardLayout role="parent">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading children...</div>
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Children</h1>
                    <p className="text-gray-500">View your children's academic progress</p>
                </div>

                {children.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <UsersIcon size={48} className="mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-700">No Children Linked</h3>
                        <p className="mt-1 text-gray-500">Please contact the school registrar to link your children.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {children.map((child) => (
                            <div
                                key={child._id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                                onClick={() => setSelectedChild(child)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {child.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{child.name}</h3>
                                        <p className="text-sm text-gray-500">{child.class || 'No class'}</p>
                                        <p className="text-xs text-gray-400">{child.email}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {/* ✅ View Grades Button - Navigates to grades page */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            viewGrades(child._id);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition"
                                    >
                                        <GraduationCapIcon size={14} /> View Grades
                                    </button>
                                    
                                    {/* ✅ View Attendance Button - Navigates to attendance page */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            viewAttendance(child._id);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100 transition"
                                    >
                                        <ClipboardCheckIcon size={14} /> View Attendance
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Child Details Modal */}
                {selectedChild && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">{selectedChild.name}</h2>
                            <div className="space-y-2">
                                <p><span className="font-medium">Email:</span> {selectedChild.email}</p>
                                <p><span className="font-medium">Class:</span> {selectedChild.class || 'N/A'}</p>
                                <p><span className="font-medium">Age:</span> {selectedChild.age || 'N/A'}</p>
                                <p><span className="font-medium">Parent:</span> {selectedChild.parentName || 'N/A'}</p>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedChild(null);
                                        viewGrades(selectedChild._id);
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    View Grades
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedChild(null);
                                        viewAttendance(selectedChild._id);
                                    }}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    View Attendance
                                </button>
                                <button
                                    onClick={() => setSelectedChild(null)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ParentChildren;