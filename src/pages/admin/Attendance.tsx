import { useState, useEffect } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface AttendanceSummary {
    totalClasses: number;
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
}

interface AttendanceRecord {
    _id: string;
    date: string;
    classId: {
        _id: string;
        name: string;
    };
    records: {
        studentId: {
            _id: string;
            name: string;
        };
        status: string;
        remarks?: string;
    }[];
}

const AdminAttendance = () => {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [classes, setClasses] = useState<any[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');

            // 1️⃣ Get all classes
            const classesRes = await axios.get('http://localhost:7000/api/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(classesRes.data.data);

            // 2️⃣ Get attendance reports
            const reportRes = await axios.get('http://localhost:7000/api/attendance/reports?semester=Semester%201&academicYear=2024/25', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = reportRes.data.data;

            // 3️⃣ Set summary
            if (data && data.summary) {
                setSummary({
                    totalClasses: data.summary.totalClasses || 0,
                    totalStudents: data.summary.totalStudents || 0,
                    present: data.summary.present || 0,
                    absent: data.summary.absent || 0,
                    late: data.summary.late || 0,
                    excused: data.summary.excused || 0,
                });
            }

            // 4️⃣ Set recent records (last 5)
            if (data && data.records) {
                setRecentRecords(data.records.slice(0, 5));
            }

            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching attendance data:", error);
            setError(error.response?.data?.error || "Failed to load attendance data");
            setLoading(false);
        }
    };

    const fetchClassAttendance = async (classId: string) => {
        if (!classId) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `http://localhost:7000/api/attendance/class/${classId}?semester=Semester%201&academicYear=2024/25`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setRecentRecords(res.data.data.slice(0, 5));
        } catch (error) {
            console.error("Error fetching class attendance:", error);
        }
    };

    const handleClassFilter = (classId: string) => {
        setSelectedClass(classId);
        if (classId) {
            fetchClassAttendance(classId);
        } else {
            fetchDashboardData();
        }
    };

    const statusColors: Record<string, string> = {
        present: "bg-green-100 text-green-700",
        absent: "bg-red-100 text-red-700",
        late: "bg-yellow-100 text-yellow-700",
        excused: "bg-blue-100 text-blue-700",
    };

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading attendance data...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-red-600">{error}</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Attendance Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor daily and weekly attendance status for the school.</p>
                </div>

                {/* Stats Cards */}
                {summary && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Classes</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summary.totalClasses}</h3>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm text-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{summary.totalStudents}</h3>
                        </div>
                        <div className="bg-green-50 p-5 rounded-xl shadow-sm text-center border border-green-200">
                            <p className="text-green-600 text-sm">Present</p>
                            <h3 className="text-2xl font-bold text-green-700">{summary.present}</h3>
                        </div>
                        <div className="bg-red-50 p-5 rounded-xl shadow-sm text-center border border-red-200">
                            <p className="text-red-600 text-sm">Absent</p>
                            <h3 className="text-2xl font-bold text-red-700">{summary.absent}</h3>
                        </div>
                        <div className="bg-yellow-50 p-5 rounded-xl shadow-sm text-center border border-yellow-200">
                            <p className="text-yellow-600 text-sm">Late</p>
                            <h3 className="text-2xl font-bold text-yellow-700">{summary.late}</h3>
                        </div>
                        <div className="bg-blue-50 p-5 rounded-xl shadow-sm text-center border border-blue-200">
                            <p className="text-blue-600 text-sm">Excused</p>
                            <h3 className="text-2xl font-bold text-blue-700">{summary.excused}</h3>
                        </div>
                    </div>
                )}

                {/* Class Filter */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <label className="font-medium text-gray-700 dark:text-gray-300">Filter by Class:</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => handleClassFilter(e.target.value)}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 bg-white dark:bg-gray-700 dark:text-gray-100"
                        >
                            <option value="">All Classes</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Recent Attendance Records */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Recent Attendance Records</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Student</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Class</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {recentRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No attendance records found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentRecords.flatMap((record) =>
                                        record.records.map((r, index) => (
                                            <tr key={`${record._id}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{r.studentId?.name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-gray-800 dark:text-gray-200">{record.classId?.name || 'N/A'}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(record.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[r.status] || 'bg-gray-100 text-gray-700'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{r.remarks || '-'}</td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminAttendance;