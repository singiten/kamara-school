import { useState, useEffect } from "react";
import { Plus, X, ClipboardCheck } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface AttendanceRecord {
    _id: string;
    studentId: {
        _id: string;
        name: string;
    };
    status: "present" | "absent" | "late" | "excused";
    date: string;
    classId: {
        _id: string;
        name: string;
    };
    remarks?: string;
}

interface AttendanceForm {
    studentId: string;
    date: string;
    status: "present" | "absent" | "late" | "excused";
    classId: string;
    remarks: string;
}

const Attendance = () => {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<AttendanceForm>({
        studentId: "",
        date: new Date().toISOString().split("T")[0],
        status: "present",
        classId: "",
        remarks: "",
    });

    // ✅ Fetch attendance data on load
    useEffect(() => {
        fetchAttendanceData();
        fetchStudentsAndClasses();
    }, []);

    const fetchAttendanceData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Get teacher's classes first
            const classesRes = await axios.get('http://localhost:7000/api/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (classesRes.data.data.length > 0) {
                const classId = classesRes.data.data[0]._id;
                
                // Get attendance for the first class
                const attendanceRes = await axios.get(
                    `http://localhost:7000/api/attendance/class/${classId}?semester=Semester%201&academicYear=2024/25`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                setAttendanceRecords(attendanceRes.data.data.flatMap((record: any) => 
                    record.records.map((r: any) => ({
                        ...r,
                        _id: record._id,
                        date: record.date,
                        classId: record.classId,
                    }))
                ));
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setLoading(false);
        }
    };

    const fetchStudentsAndClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Get students
            const studentsRes = await axios.get('http://localhost:7000/api/users?role=student', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(studentsRes.data.data);

            // Get teacher's classes
            const classesRes = await axios.get('http://localhost:7000/api/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(classesRes.data.data);
            
            if (classesRes.data.data.length > 0) {
                setFormData(prev => ({ ...prev, classId: classesRes.data.data[0]._id }));
            }
        } catch (error) {
            console.error("Error fetching students/classes:", error);
        }
    };

    // ✅ Mark attendance (POST to backend)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            const attendanceData = {
                classId: formData.classId,
                date: formData.date,
                semester: "Semester 1",
                academicYear: "2024/25",
                records: [{
                    studentId: formData.studentId,
                    status: formData.status,
                    remarks: formData.remarks || "",
                }]
            };

            await axios.post('http://localhost:7000/api/attendance', attendanceData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setFormData({
                studentId: "",
                date: new Date().toISOString().split("T")[0],
                status: "present",
                classId: formData.classId,
                remarks: "",
            });
            
            // Refresh attendance data
            await fetchAttendanceData();
            
        } catch (error: any) {
            console.error("Error marking attendance:", error);
            alert(error.response?.data?.error || "Failed to mark attendance");
        }
    };

    // ✅ Calculate stats from real data
    const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
    const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
    const lateCount = attendanceRecords.filter((r) => r.status === "late").length;

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            present: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
            absent: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
            late: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
            excused: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
        };
        return styles[status] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    };

    if (loading) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading attendance...</div>
                </div>
            </DashboardLayout>
        );
    }

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Mark Attendance</h2>
                    <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Class Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                        <select
                            required
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Student Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
                        <select
                            required
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Student</option>
                            {students.map((student) => (
                                <option key={student._id} value={student._id}>{student.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as "present" | "absent" | "late" | "excused" })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="late">Late</option>
                                <option value="excused">Excused</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks (optional)</label>
                        <input
                            type="text"
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Sick leave"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <DashboardLayout role="teacher">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Attendance</h1>
                        <p className="text-gray-500 dark:text-gray-400">Track student attendance</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={18} /> Mark Attendance
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400"><ClipboardCheck size={25} /></div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Present</p>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{presentCount}</h2>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-400"><ClipboardCheck size={25} /></div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Absent</p>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{absentCount}</h2>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center gap-4">
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg text-yellow-600 dark:text-yellow-400"><ClipboardCheck size={25} /></div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Late</p>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{lateCount}</h2>
                        </div>
                    </div>
                </div>

                {/* Attendance Table - NO GRADE COLUMN */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Student</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {attendanceRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No attendance records yet.
                                        </td>
                                    </tr>
                                ) : (
                                    attendanceRecords.slice(0, 10).map((record) => (
                                        <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{record.studentId?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{new Date(record.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(record.status)}`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && modalContent}
        </DashboardLayout>
    );
};

export default Attendance;