import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, UserPlus, X, Check, BookOpen } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Teacher {
    _id: string;
    name: string;
    email: string;
    subject: string;
    hireDate: string;
    phone: string;
    assignedClasses: Class[];
    createdAt: string;
}

interface Class {
    _id: string;
    name: string;
    grade: string;
    section: string;
}

const RegistrarTeachers = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "password123",
        subject: "",
        hireDate: "",
        phone: "",
        assignedClasses: [] as string[],
    });

    useEffect(() => {
        fetchTeachers();
        fetchClasses();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await apiClient.get('/api/registrar/teachers');
            setTeachers(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching teachers:", error);
            setError(error.response?.data?.error || "Failed to load teachers");
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await apiClient.get('/api/registrar/classes');
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('/api/registrar/teachers', formData);

            setShowModal(false);
            setSuccess(true);
            setSuccessMessage(response.data.message || 'Teacher added successfully!');
            fetchTeachers();

            setFormData({
                name: "",
                email: "",
                password: "password123",
                subject: "",
                hireDate: "",
                phone: "",
                assignedClasses: [],
            });

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to add teacher");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this teacher?")) return;
        try {
            await apiClient.delete(`/api/registrar/teachers/${id}`);
            fetchTeachers();
            alert('Teacher deleted successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete teacher");
        }
    };

    const handleClassToggle = (classId: string) => {
        setFormData(prev => {
            const current = prev.assignedClasses || [];
            if (current.includes(classId)) {
                return { ...prev, assignedClasses: current.filter(id => id !== classId) };
            } else {
                return { ...prev, assignedClasses: [...current, classId] };
            }
        });
    };

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <DashboardLayout role="registrar">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading teachers...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="registrar">
            <div className="space-y-6">
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400 flex items-center gap-3">
                        <Check size={24} />
                        <div>
                            <p className="font-medium">{successMessage}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Teacher Management</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage teacher records and class assignments</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus size={18} />
                        Add Teacher
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search teachers by name, email, or subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Subject</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Assigned Classes</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredTeachers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            {teachers.length === 0 ? "No teachers registered yet." : "No teachers match your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTeachers.map((teacher) => (
                                        <tr key={teacher._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{teacher.name}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{teacher.email}</td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{teacher.subject || 'N/A'}</td>
                                            <td className="px-4 py-3">
                                                {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {teacher.assignedClasses.map((cls: any) => (
                                                            <span key={cls._id} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                                                                {cls.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleDelete(teacher._id)}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Add New Teacher</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Personal Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., John Doe"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                                            <input
                                                type="email"
                                                placeholder="teacher@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Mathematics"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 0912345678"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hire Date</label>
                                        <input
                                            type="date"
                                            value={formData.hireDate}
                                            onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
                                        <BookOpen size={16} />
                                        Assign to Classes
                                    </h3>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">Select one or more classes this teacher will teach</p>

                                    {classes.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No classes available. Please create classes first.</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {classes.map((cls) => (
                                                <label
                                                    key={cls._id}
                                                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${formData.assignedClasses?.includes(cls._id)
                                                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30'
                                                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.assignedClasses?.includes(cls._id) || false}
                                                        onChange={() => handleClassToggle(cls._id)}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-800 dark:text-gray-200">{cls.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                    >
                                        <UserPlus size={18} />
                                        Add Teacher
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

export default RegistrarTeachers;