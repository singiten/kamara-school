// src/pages/finance/FinanceFees.tsx - UPDATED to use /api/finance/fee-structures

import { useState, useEffect } from "react";
import { 
    Plus, 
    Edit2, 
    Trash2, 
    DollarSign, 
    Calendar, 
    AlertCircle, 
    Users,
    X,
    Check,
    Clock
} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface FeeStructure {
    _id: string;
    name: string;
    amount: number;
    feeType: string;
    classLevel: string;
    semester: string;
    academicYear: string;
    startDate: string;
    endDate: string;
    lateFeeAmount: number;
    gracePeriodDays: number;
    isActive: boolean;
    totalAmount?: number;
    isOverdue?: boolean;
}

const FinanceFees = () => {
    const [fees, setFees] = useState<FeeStructure[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [assignedCount, setAssignedCount] = useState(0);
    
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        feeType: "tuition",
        classLevel: "secondary",
        semester: "Semester 1",
        academicYear: "2024/25",
        startDate: "",
        endDate: "",
        lateFeeAmount: "",
        gracePeriodDays: "",
        autoAssign: true,
    });

    useEffect(() => {
        fetchFees();
    }, []);

    // ✅ UPDATED: Use /api/finance/fee-structures
    const fetchFees = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/finance/fee-structures', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFees(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching fees:", error);
            setError(error.response?.data?.error || "Failed to load fees");
            setLoading(false);
        }
    };

 // In FinanceFees.tsx - Update handleSubmit

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        alert('❌ End date must be after start date!');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:7000/api/finance/fee-structures', {
            name: formData.name,
            description: "",
            amount: parseFloat(formData.amount),
            feeType: formData.feeType,
            classLevel: formData.classLevel,
            semester: formData.semester,
            academicYear: formData.academicYear,
            startDate: formData.startDate,
            endDate: formData.endDate,
            lateFeeAmount: parseFloat(formData.lateFeeAmount) || 0,
            gracePeriodDays: parseInt(formData.gracePeriodDays) || 0,
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setShowModal(false);
        
        // ✅ Get assigned count from response
        const assigned = response.data.data?.assignedCount || 0;
        setAssignedCount(assigned);
        
        setSuccess(true);
        setSuccessMessage(
            `✅ Fee structure created successfully! ${assigned > 0 ? `Assigned to ${assigned} students.` : 'No students found in this class level.'}`
        );
        
        fetchFees();
        
        // Reset form
        setFormData({
            name: "",
            amount: "",
            feeType: "tuition",
            classLevel: "secondary",
            semester: "Semester 1",
            academicYear: "2024/25",
            startDate: "",
            endDate: "",
            lateFeeAmount: "",
            gracePeriodDays: "",
            autoAssign: true,
        });
        
        setTimeout(() => {
            setSuccess(false);
            setSuccessMessage("");
            setAssignedCount(0);
        }, 5000);
        
    } catch (error: any) {
        console.error('❌ Error:', error);
        if (error.response) {
            const errorMsg = error.response.data?.error || error.response.data?.message || JSON.stringify(error.response.data);
            alert(`❌ Server Error: ${errorMsg}`);
        } else if (error.request) {
            alert('❌ No response from server. Please check if server is running.');
        } else {
            alert(`❌ Error: ${error.message}`);
        }
    }
};

    // ✅ NEW: Manual assignment function using existing assign-fees endpoint
    const assignFeeToStudents = async (feeStructureId: string, classLevel: string) => {
        try {
            const token = localStorage.getItem('token');
            
            // First, get all students in this class level
            const studentsRes = await axios.get('http://localhost:7000/api/registrar/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const allStudents = studentsRes.data.data || [];
            const filteredStudents = allStudents.filter(
                (student: any) => student.classLevel === classLevel
            );
            
            if (filteredStudents.length === 0) {
                console.log(`⚠️ No students found in ${classLevel} level`);
                return 0;
            }
            
            const studentIds = filteredStudents.map((s: any) => s._id);
            
            // Assign fee to students
            const assignRes = await axios.post('http://localhost:7000/api/finance/assign-fees', {
                feeStructureId,
                studentIds,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const assigned = assignRes.data.data?.successful?.length || 0;
            console.log(`✅ Assigned to ${assigned} students in ${classLevel}`);
            return assigned;
            
        } catch (error) {
            console.error('❌ Error assigning fees:', error);
            return 0;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(amount);
    };

    const isFeeOverdue = (fee: FeeStructure) => {
        const now = new Date();
        const deadline = new Date(fee.endDate);
        deadline.setDate(deadline.getDate() + (fee.gracePeriodDays || 0));
        return now > deadline;
    };

    const getTotalAmount = (fee: FeeStructure) => {
        let total = fee.amount;
        if (isFeeOverdue(fee)) {
            total += (fee.lateFeeAmount || 0);
        }
        return total;
    };

    const getClassLevelBadge = (level: string) => {
        const colors: Record<string, string> = {
            primary: 'bg-green-100 text-green-700',
            middle: 'bg-yellow-100 text-yellow-700',
            secondary: 'bg-blue-100 text-blue-700',
        };
        return colors[level] || 'bg-gray-100 text-gray-700';
    };

    const getFeeTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            tuition: 'bg-purple-100 text-purple-700',
            registration: 'bg-indigo-100 text-indigo-700',
            activity: 'bg-pink-100 text-pink-700',
            library: 'bg-orange-100 text-orange-700',
            lab: 'bg-cyan-100 text-cyan-700',
            sports: 'bg-green-100 text-green-700',
            other: 'bg-gray-100 text-gray-700',
        };
        return colors[type] || 'bg-gray-100 text-gray-700';
    };

    // ✅ UPDATED: Use /api/finance/fee-structures
    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this fee structure?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:7000/api/finance/fee-structures/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFees();
            alert('✅ Fee structure deleted successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete fee");
        }
    };

    // ✅ UPDATED: Use /api/finance/fee-structures/:id/toggle
    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:7000/api/finance/fee-structures/${id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchFees();
            alert(`✅ Fee ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to toggle fee status");
        }
    };

    if (loading) {
        return (
            <DashboardLayout role="finance_officer">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading fee structures...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="finance_officer">
            <div className="space-y-6">
                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400 flex items-center gap-3 animate-fadeIn">
                        <Check size={24} className="flex-shrink-0" />
                        <div>
                            <p className="font-medium">{successMessage}</p>
                            {assignedCount > 0 && (
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    ✅ {assignedCount} students have been assigned this fee automatically.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Fee Structures</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage school fee structures with automatic assignment</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                        Create Fee
                    </button>
                </div>

                {/* Fee Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Level</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Start Date</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">End Date</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Total</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {fees.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No fee structures created yet.
                                        </td>
                                    </tr>
                                ) : (
                                    fees.map((fee) => {
                                        const overdue = isFeeOverdue(fee);
                                        const totalAmount = getTotalAmount(fee);
                                        
                                        return (
                                            <tr key={fee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{fee.name}</td>
                                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{formatCurrency(fee.amount)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeeTypeBadge(fee.feeType)}`}>
                                                        {fee.feeType.charAt(0).toUpperCase() + fee.feeType.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassLevelBadge(fee.classLevel)}`}>
                                                        {fee.classLevel.charAt(0).toUpperCase() + fee.classLevel.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{new Date(fee.startDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                    <div className="flex items-center gap-2">
                                                        {new Date(fee.endDate).toLocaleDateString()}
                                                        {overdue && (
                                                            <span className="text-red-500 text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full flex items-center gap-1">
                                                                <AlertCircle size={12} />
                                                                Overdue
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(totalAmount)}</span>
                                                        {totalAmount > fee.amount && (
                                                            <span className="text-xs text-red-500 block">
                                                                +{formatCurrency(fee.lateFeeAmount)} late fee
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`px-2 py-1 rounded-full text-xs text-center ${
                                                            fee.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            {fee.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                        {fee.gracePeriodDays > 0 && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1">
                                                                <Clock size={10} />
                                                                Grace: {fee.gracePeriodDays}d
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleToggleActive(fee._id, fee.isActive)}
                                                            className={`px-2 py-1 rounded text-xs transition-colors ${
                                                                fee.isActive 
                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                            }`}
                                                        >
                                                            {fee.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(fee._id)}
                                                            className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Fee Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <DollarSign size={24} className="text-blue-600" />
                                    Create Fee Structure
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Basic Information */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Basic Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Semester 1 Tuition"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (ETB) *</label>
                                            <input
                                                type="number"
                                                placeholder="e.g., 5000"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type *</label>
                                            <select
                                                value={formData.feeType}
                                                onChange={(e) => setFormData({ ...formData, feeType: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="tuition">Tuition</option>
                                                <option value="registration">Registration</option>
                                                <option value="activity">Activity</option>
                                                <option value="library">Library</option>
                                                <option value="lab">Lab</option>
                                                <option value="sports">Sports</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Level *</label>
                                            <select
                                                value={formData.classLevel}
                                                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="primary">Primary (1-4)</option>
                                                <option value="middle">Middle (5-8)</option>
                                                <option value="secondary">Secondary (9-12)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                                            <select
                                                value={formData.semester}
                                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="Semester 1">Semester 1</option>
                                                <option value="Semester 2">Semester 2</option>
                                                <option value="Summer">Summer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 2024/25"
                                                value={formData.academicYear}
                                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Date Range Section */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Date Range
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date (Deadline) *</label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Penalty System Section */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        Late Payment Penalty
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Late Fee Amount (ETB)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g., 100"
                                                value={formData.lateFeeAmount}
                                                onChange={(e) => setFormData({ ...formData, lateFeeAmount: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                                step="0.01"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Extra charge if payment is late</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period (Days)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g., 5"
                                                value={formData.gracePeriodDays}
                                                onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days after deadline before penalty applies</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Auto-Assign Section */}
                                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                                        <Users size={16} />
                                        Assignment Options
                                    </h3>
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="autoAssign"
                                            checked={formData.autoAssign}
                                            onChange={(e) => setFormData({ ...formData, autoAssign: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded mt-1 focus:ring-2 focus:ring-blue-500"
                                        />
                                        <div>
                                            <label htmlFor="autoAssign" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                                Automatically assign to all students in <span className="text-blue-600 dark:text-blue-400 font-semibold capitalize">{formData.classLevel}</span> level
                                            </label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formData.autoAssign 
                                                    ? '✅ All students in this class level will receive this fee automatically' 
                                                    : '❌ You will need to manually assign this fee to students later'}
                                            </p>
                                            {formData.autoAssign && (
                                                <div className="mt-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg inline-block">
                                                    💡 This will save you time! No need to assign individually.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowModal(false)} 
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <DollarSign size={16} />
                                        Create Fee
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default FinanceFees;