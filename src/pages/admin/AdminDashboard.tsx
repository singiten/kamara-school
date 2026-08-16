import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import UserRegistrationModal from "../../components/forms/UserRegistrationModal";
import type { UserData } from "../../types/user";
import axios from "axios";

const AdminDashboard = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRole, setModalRole] = useState<"student" | "teacher">("student");

    const [stats, setStats] = useState([
        { title: "Total Students", value: "0" },
        { title: "Total Teachers", value: "0" },
        { title: "Attendance Today", value: "0%" },
        { title: "Announcements", value: "0" },
    ]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');

            const statsRes = await axios.get('http://localhost:7000/api/users/stats/roles', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const usersRes = await axios.get('http://localhost:7000/api/users?limit=5', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = statsRes.data.data;
            setStats([
                { title: "Total Students", value: data.students?.toString() || "0" },
                { title: "Total Teachers", value: data.teachers?.toString() || "0" },
                { title: "Attendance Today", value: "90%" },
                { title: "Announcements", value: "10" },
            ]);

            const activities = usersRes.data.data.slice(0, 5).map((user: any) => ({
                activity: `New ${user.role} registered`,
                user: user.name,
                time: new Date(user.createdAt).toLocaleDateString(),
            }));

            setRecentActivities(activities);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setLoading(false);
        }
    };

    // ✅ UPDATED: Handles age properly
    const handleSave = async (data: UserData) => {
        try {
            const token = localStorage.getItem('token');

            // ✅ Map frontend fields to backend schema
            const userData: any = {
                name: `${data.firstName} ${data.lastName}`.trim(),
                email: data.email,
                password: data.password || "password123",
                role: modalRole,
            };

            // ✅ Add age if provided (convert to number)
            if (data.age) {
                userData.age = parseInt(data.age.toString());
            }

            // ✅ Add class only for students
            if (modalRole === "student") {
                userData.class = data.grade || "Grade 10A";
            }

            // ✅ Add teacher-specific fields
            if (modalRole === "teacher") {
                userData.subject = data.department || "General";
                userData.hireDate = new Date().toISOString().split('T')[0];
            }

            // ✅ Add phone and gender if provided
            if (data.phone) {
                userData.phone = data.phone;
            }
            if (data.gender) {
                userData.gender = data.gender;
            }

            console.log("📤 Sending to backend:", userData);

            const response = await axios.post('http://localhost:7000/api/users', userData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("✅ User created:", response.data);
            setModalOpen(false);
            await fetchDashboardData();
            alert(`${modalRole.charAt(0).toUpperCase() + modalRole.slice(1)} added successfully!`);

        } catch (error: any) {
            console.error("❌ Error saving user:", error);
            const errorMsg = error.response?.data?.error ||
                error.response?.data?.errors?.join(', ') ||
                "Failed to add user";
            alert(errorMsg);
        }
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
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.title} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
                            <h3 className="text-3xl font-bold mt-2 text-gray-800 dark:text-gray-100">
                                {stat.value}
                            </h3>
                        </div>
                    ))}
                </div>

                {/* Recent Activities */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Activities</h3>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    setModalRole("student");
                                    setModalOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base"
                            >
                                + Add Student
                            </button>

                            <button
                                onClick={() => {
                                    setModalRole("teacher");
                                    setModalOpen(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm sm:text-base"
                            >
                                + Add Teacher
                            </button>
                        </div>
                    </div>

                    <UserRegistrationModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        role={modalRole}
                        onSave={handleSave}
                    />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                                    <th className="pb-3">Activity</th>
                                    <th className="pb-3">User</th>
                                    <th className="pb-3">Time</th>
                                </tr>
                            </thead>

                            <tbody className="text-gray-700 dark:text-gray-200">
                                {recentActivities.length > 0 ? (
                                    recentActivities.map((activity, index) => (
                                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                            <td className="py-4">{activity.activity}</td>
                                            <td className="py-4">{activity.user}</td>
                                            <td className="py-4">{activity.time}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="py-4 text-gray-500 dark:text-gray-400" colSpan={3}>
                                            No recent activities
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;