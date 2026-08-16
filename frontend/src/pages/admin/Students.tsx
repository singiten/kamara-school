// src/pages/registrar/RegistrarStudents.tsx - WITH GRADE & SECTION DROPDOWNS

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, UserPlus, X, Check, Users } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface Student {
    _id: string;
    name: string;
    email: string;
    class: string;
    classLevel: string;
    age: number;
    parentId: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    } | null;
    createdAt: string;
}

interface Class {
    _id: string;
    name: string;
    grade: string;
    section: string;
    classLevel: string;
    academicYear: string;
}

// ✅ Predefined values
const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const RegistrarStudents = () => {
    const [students, setStudents] = useState<Student[]>([]);
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
        grade: "",
        section: "",
        classId: "",
        age: "",
        parentName: "",
        parentPhone: "",
        parentEmail: "",
    });

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/registrar/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching students:", error);
            setError(error.response?.data?.error || "Failed to load students");
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/registrar/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    // ✅ Generate class name from grade + section
    const generateClassName = (grade: string, section: string) => {
        if (grade && section) {
            return `Grade ${grade}${section}`;
        }
        return "";
    };

    // ✅ Find existing class by grade and section
    const findExistingClass = (grade: string, section: string) => {
        return classes.find(c => c.grade === grade && c.section === section);
    };

    // ✅ Handle grade or section change
    const handleGradeOrSectionChange = (field: string, value: string) => {
        const newFormData = { ...formData, [field]: value };

        // If both grade and section are selected, check if class exists
        const grade = field === 'grade' ? value : formData.grade;
        const section = field === 'section' ? value : formData.section;

        if (grade && section) {
            const existingClass = findExistingClass(grade, section);
            if (existingClass) {
                newFormData.classId = existingClass._id;
            } else {
                newFormData.classId = "";
            }
        }

        setFormData(newFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Validate grade and section
        if (!formData.grade || !formData.section) {
            alert('Please select both grade and section');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // ✅ Use existing class name or generate one
            const className = formData.classId
                ? classes.find(c => c._id === formData.classId)?.name || generateClassName(formData.grade, formData.section)
                : generateClassName(formData.grade, formData.section);

            const response = await axios.post('http://localhost:7000/api/registrar/students', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                class: className,
                age: parseInt(formData.age) || 0,
                parentName: formData.parentName,
                parentPhone: formData.parentPhone,
                parentEmail: formData.parentEmail,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setSuccess(true);
            setSuccessMessage(response.data.message || '✅ Student registered successfully!');
            fetchStudents();

            // Reset form
            setFormData({
                name: "",
                email: "",
                password: "password123",
                grade: "",
                section: "",
                classId: "",
                age: "",
                parentName: "",
                parentPhone: "",
                parentEmail: "",
            });

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to register student");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:7000/api/registrar/students/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStudents();
            alert('✅ Student deleted successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete student");
        }
    };

    const getClassLevelBadge = (level: string) => {
        const colors: Record<string, string> = {
            primary: 'bg-green-100 text-green-700',
            middle: 'bg-yellow-100 text-yellow-700',
            secondary: 'bg-blue-100 text-blue-700',
        };
        return colors[level] || 'bg-gray-100 text-gray-700';
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.class && s.class.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading students...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400 flex items-center gap-3">
                        <Check size={24} />
                        <div>
                            <p className="font-medium">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Student Management</h1>
                        <p className="text-gray-500 dark:text-gray-400">Register and manage student records</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <UserPlus size={18} />
                        Register Student
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search students by name, email, or class..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Name</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Class</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Level</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Parent</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            {students.length === 0 ? "No students registered yet." : "No students match your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{student.name}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{student.email}</td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{student.class || 'N/A'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassLevelBadge(student.classLevel)}`}>
                                                    {student.classLevel || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {student.parentId ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{student.parentId.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.parentId.email}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 text-sm">Not linked</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDelete(student._id)}
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ✅ Enhanced Modal with Grade & Section Dropdowns */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Register New Student</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Personal Information Section */}
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
                                                placeholder="student@example.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* ✅ Grade & Section Dropdowns */}
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade *</label>
                                            <select
                                                value={formData.grade}
                                                onChange={(e) => handleGradeOrSectionChange('grade', e.target.value)}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            >
                                                <option value="">Select Grade</option>
                                                {GRADES.map((grade) => (
                                                    <option key={grade} value={grade}>Grade {grade}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section *</label>
                                            <select
                                                value={formData.section}
                                                onChange={(e) => handleGradeOrSectionChange('section', e.target.value)}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            >
                                                <option value="">Select Section</option>
                                                {SECTIONS.map((section) => (
                                                    <option key={section} value={section}>Section {section}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* ✅ Show class assignment status */}
                                    {formData.grade && formData.section && (
                                        <div className={`mt-2 p-2 rounded-lg text-sm ${formData.classId
                                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
                                            }`}>
                                            {formData.classId ? (
                                                <div className="flex items-center gap-2">
                                                    <Users size={16} />
                                                    <span>
                                                        ✅ Assigned to existing class: <strong>
                                                            {classes.find(c => c._id === formData.classId)?.name || generateClassName(formData.grade, formData.section)}
                                                        </strong>
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>
                                                    ⚠️ No existing class found for Grade {formData.grade} Section {formData.section}.
                                                    A new class will be created automatically.
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                                            <input
                                                type="number"
                                                placeholder="e.g., 15"
                                                value={formData.age}
                                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                min="0"
                                                max="120"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                                            <input
                                                type="password"
                                                placeholder="Default: password123"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Parent Information Section */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                    <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-3">Parent Information</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g., Jane Doe"
                                                value={formData.parentName}
                                                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Email</label>
                                            <input
                                                type="email"
                                                placeholder="parent@example.com"
                                                value={formData.parentEmail}
                                                onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                            />
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">💡 Creates parent account if not exists</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Phone</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., 0912345678"
                                            value={formData.parentPhone}
                                            onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                        />
                                    </div>
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
                                        Register Student
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

export default RegistrarStudents;