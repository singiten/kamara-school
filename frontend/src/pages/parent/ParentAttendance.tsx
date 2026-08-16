// src/pages/parent/ParentAttendance.tsx - Converted to apiClient

import { ClipboardCheck } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useAppContext } from "../../context/AppContext";

const ParentAttendance = () => {
    const { attendanceRecords } = useAppContext();

    const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
    const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
    const lateCount = attendanceRecords.filter((r) => r.status === "late").length;

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            present: "bg-gray-100 text-gray-700",
            absent: "bg-gray-100 text-gray-700",
            late: "bg-gray-100 text-gray-700",
        };
        return styles[status] || "bg-gray-100 text-gray-700";
    };

    return (
        <DashboardLayout role="parent">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Attendance Records</h1>
                    <p className="text-gray-500">View your children's attendance records</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
                        <div className="bg-gray-100 p-3 rounded-lg text-gray-600"><ClipboardCheck size={25} /></div>
                        <div><p className="text-gray-500 text-sm">Present</p><h2 className="text-2xl font-bold">{presentCount}</h2></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
                        <div className="bg-gray-100 p-3 rounded-lg text-gray-600"><ClipboardCheck size={25} /></div>
                        <div><p className="text-gray-500 text-sm">Absent</p><h2 className="text-2xl font-bold">{absentCount}</h2></div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
                        <div className="bg-gray-100 p-3 rounded-lg text-gray-600"><ClipboardCheck size={25} /></div>
                        <div><p className="text-gray-500 text-sm">Late</p><h2 className="text-2xl font-bold">{lateCount}</h2></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Student</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Grade</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendanceRecords.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No attendance records available yet.</td></tr>
                                ) : (
                                    attendanceRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{record.studentName}</td>
                                            <td className="px-6 py-4">{record.grade}</td>
                                            <td className="px-6 py-4 text-gray-600">{record.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(record.status)}`}>{record.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ParentAttendance;