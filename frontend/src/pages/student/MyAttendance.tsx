import { useState, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, BarChart3 } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface SummaryData {
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    attendanceRate: number;
}

interface AttendanceSummary {
    _id: string;
    period: "week" | "month" | "semester" | "annual";
    periodStart: string;
    periodEnd: string;
    weekNumber?: number;
    month?: string;
    semester?: string;
    academicYear: string;
    summary: SummaryData;
}

const MyAttendance = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [overall, setOverall] = useState<SummaryData | null>(null);
    const [breakdown, setBreakdown] = useState<AttendanceSummary[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

    useEffect(() => {
        fetchAttendanceSummary();
    }, []);

    const fetchAttendanceSummary = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:7000/api/attendance/my-summary',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setOverall(response.data.data.overall);
                setBreakdown(response.data.data.breakdown || []);
            }
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching attendance summary:", error);
            setError(error.response?.data?.error || "Failed to load attendance");
            setLoading(false);
        }
    };

    const getFilteredBreakdown = () => {
        if (selectedPeriod === "all") return breakdown;
        return breakdown.filter(item => item.period === selectedPeriod);
    };

    const getPeriodLabel = (item: AttendanceSummary) => {
        switch (item.period) {
            case 'week':
                return `Week ${item.weekNumber} (${new Date(item.periodStart).toLocaleDateString()} - ${new Date(item.periodEnd).toLocaleDateString()})`;
            case 'month':
                return `${item.month} ${new Date(item.periodStart).getFullYear()}`;
            case 'semester':
                return `${item.semester} ${item.academicYear}`;
            case 'annual':
                return `Annual ${item.academicYear}`;
            default:
                return '';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'present':
                return <CheckCircle size={18} className="text-green-600" />;
            case 'absent':
                return <XCircle size={18} className="text-red-600" />;
            case 'late':
                return <Clock size={18} className="text-yellow-600" />;
            case 'excused':
                return <AlertCircle size={18} className="text-blue-600" />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="student">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading attendance summary...</div>
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
                    <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
                    <p className="text-gray-500">View your attendance summary</p>
                </div>

                {/* Overall Stats Cards */}
                {overall && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-green-500">
                            <p className="text-gray-500 text-sm">Present</p>
                            <h2 className="text-2xl font-bold text-green-600">{overall.present}</h2>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-red-500">
                            <p className="text-gray-500 text-sm">Absent</p>
                            <h2 className="text-2xl font-bold text-red-600">{overall.absent}</h2>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-yellow-500">
                            <p className="text-gray-500 text-sm">Late</p>
                            <h2 className="text-2xl font-bold text-yellow-600">{overall.late}</h2>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-blue-500">
                            <p className="text-gray-500 text-sm">Excused</p>
                            <h2 className="text-2xl font-bold text-blue-600">{overall.excused}</h2>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-purple-500">
                            <p className="text-gray-500 text-sm">Attendance Rate</p>
                            <h2 className="text-2xl font-bold text-purple-600">{overall.attendanceRate}%</h2>
                        </div>
                    </div>
                )}

                {/* Period Filter */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="font-medium text-gray-700">Filter by Period:</label>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Periods</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                            <option value="semester">Semester</option>
                            <option value="annual">Annual</option>
                        </select>
                    </div>
                </div>

                {/* Breakdown Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Attendance Breakdown
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({getFilteredBreakdown().length} records)
                            </span>
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Period</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Present</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Absent</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Late</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Excused</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Rate</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {getFilteredBreakdown().length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No attendance records found.
                                        </td>
                                    </tr>
                                ) : (
                                    getFilteredBreakdown().map((item) => {
                                        const rate = item.summary.attendanceRate;
                                        const statusColor = rate >= 90 ? 'text-green-600' : rate >= 75 ? 'text-yellow-600' : 'text-red-600';
                                        const statusText = rate >= 90 ? 'Good' : rate >= 75 ? 'Fair' : 'Needs Improvement';
                                        
                                        return (
                                            <tr key={item._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium">{getPeriodLabel(item)}</td>
                                                <td className="px-6 py-4 text-green-600">{item.summary.present}</td>
                                                <td className="px-6 py-4 text-red-600">{item.summary.absent}</td>
                                                <td className="px-6 py-4 text-yellow-600">{item.summary.late}</td>
                                                <td className="px-6 py-4 text-blue-600">{item.summary.excused}</td>
                                                <td className="px-6 py-4 font-bold">{item.summary.attendanceRate}%</td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-medium ${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-blue-700">
                    💡 Your attendance is summarized weekly. Daily records are removed after summarization to keep the system fast and efficient.
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MyAttendance;