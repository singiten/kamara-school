// src/pages/registrar/RegistrarClasses.tsx - COMPLETE FIXED

import { useState, useEffect } from "react";
import {
    Plus, Edit2, Trash2, Search, School, Users, BookOpen, X
} from "lucide-react"; // ✅ ADDED X HERE
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface ClassData {
    _id: string;
    name: string;
    grade: string;
    section: string;
    academicYear: string;
    students: { _id: string; name: string }[];
    teacherIds: { _id: string; name: string; subject: string }[];
    subjects: string[];
    classLevel: string;
    createdAt: string;
}

// ✅ Predefined values
const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const ACADEMIC_YEARS = ['2024/25', '2025/26', '2026/27', '2027/28'];

const RegistrarClasses = () => {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [teachers, setTeachers] = useState<{ _id: string; name: string; subject: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        grade: "",
        section: "",
        academicYear: "2024/25",
        teacherIds: [] as string[],
        subjects: [] as string[],
        subjectInput: "",
    });

    useEffect(() => {
        fetchClasses();
        fetchTeachers();
    }, []);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/registrar/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching classes:", error);
            setError(error.response?.data?.error || "Failed to load classes");
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/registrar/teachers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeachers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        }
    };

    // ✅ Auto-generate class name from grade + section
    const generateClassName = (grade: string, section: string) => {
        if (grade && section) {
            return `Grade ${grade}${section}`;
        }
        return "";
    };

    // ✅ Handle grade or section change
    const handleGradeOrSectionChange = (field: string, value: string) => {
        const newFormData = { ...formData, [field]: value };
        const className = generateClassName(
            field === 'grade' ? value : formData.grade,
            field === 'section' ? value : formData.section
        );
        newFormData.name = className;
        setFormData(newFormData);
    };

    const handleAddSubject = () => {
        if (formData.subjectInput.trim() && !formData.subjects.includes(formData.subjectInput.trim())) {
            setFormData({
                ...formData,
                subjects: [...formData.subjects, formData.subjectInput.trim()],
                subjectInput: "",
            });
        }
    };

    const handleRemoveSubject = (subject: string) => {
        setFormData({
            ...formData,
            subjects: formData.subjects.filter(s => s !== subject),
        });
    };

    const handleTeacherToggle = (teacherId: string) => {
        setFormData({
            ...formData,
            teacherIds: formData.teacherIds.includes(teacherId)
                ? formData.teacherIds.filter(id => id !== teacherId)
                : [...formData.teacherIds, teacherId],
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Validate
        if (!formData.grade || !formData.section) {
            alert('Please select both grade and section');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:7000/api/registrar/classes', {
                name: formData.name,
                grade: formData.grade,
                section: formData.section,
                academicYear: formData.academicYear,
                teacherIds: formData.teacherIds,
                subjects: formData.subjects,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            setSuccess(true);
            setSuccessMessage(response.data.message || '✅ Class created successfully!');
            fetchClasses();

            // Reset form
            setFormData({
                name: "",
                grade: "",
                section: "",
                academicYear: "2024/25",
                teacherIds: [],
                subjects: [],
                subjectInput: "",
            });

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to create class");
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

    if (loading) {
        return (
            <DashboardLayout role="registrar">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading classes...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="registrar">
            <div className="space-y-6">
                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400 flex items-center gap-3">
                        <School size={24} />
                        <div>
                            <p className="font-medium">{successMessage}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Class Management</h1>
                        <p className="text-gray-500 dark:text-gray-400">Create and manage school classes</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                        Create Class
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Classes</p>
                        <h2 className="text-2xl font-bold text-blue-600">{classes.length}</h2>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
                        <h2 className="text-2xl font-bold text-green-600">
                            {classes.reduce((sum, c) => sum + (c.students?.length || 0), 0)}
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Teachers</p>
                        <h2 className="text-2xl font-bold text-purple-600">{teachers.length}</h2>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Academic Year</p>
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">{classes[0]?.academicYear || 'N/A'}</h2>
                    </div>
                </div>

                {/* Classes Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Class</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Level</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Students</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Teachers</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Subjects</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Academic Year</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {classes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No classes created yet.
                                        </td>
                                    </tr>
                                ) : (
                                    classes.map((cls) => (
                                        <tr key={cls._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{cls.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClassLevelBadge(cls.classLevel)}`}>
                                                    {cls.classLevel || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{cls.students?.length || 0}</td>
                                            <td className="px-4 py-3">
                                                {cls.teacherIds?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {cls.teacherIds.map((t: any) => (
                                                            <span key={t._id} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs">
                                                                {t.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                        <span className="text-gray-400 dark:text-gray-500 text-sm">No teachers</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {cls.subjects?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {cls.subjects.map((s) => (
                                                            <span key={s} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                        <span className="text-gray-400 dark:text-gray-500 text-sm">No subjects</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{cls.academicYear}</td>
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
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <School size={20} />
                                    Create New Class
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Grade & Section Selection */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Class Details</h3>

                                    <div className="grid grid-cols-2 gap-4">
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

                                    {formData.name && (
                                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                                📚 Class Name: <span className="font-bold">{formData.name}</span>
                                            </p>
                                            <p className="text-xs text-blue-500 dark:text-blue-400">
                                                Auto-generated from Grade {formData.grade} Section {formData.section}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year *</label>
                                        <select
                                            value={formData.academicYear}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                            required
                                        >
                                            {ACADEMIC_YEARS.map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Teacher Assignment */}
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                                        <Users size={16} />
                                        Assign Teachers
                                    </h3>
                                    {teachers.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No teachers available. Please create teachers first.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {teachers.map((teacher) => (
                                                <label
                                                    key={teacher._id}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition ${formData.teacherIds.includes(teacher._id)
                                                        ? 'border-green-500 bg-green-100 dark:bg-green-900/30'
                                                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.teacherIds.includes(teacher._id)}
                                                        onChange={() => handleTeacherToggle(teacher._id)}
                                                        className="w-4 h-4 text-green-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-800 dark:text-gray-200">{teacher.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">({teacher.subject})</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Subjects */}
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                    <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-400 mb-3 flex items-center gap-2">
                                        <BookOpen size={16} />
                                        Subjects
                                    </h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="e.g., Mathematics"
                                            value={formData.subjectInput}
                                            onChange={(e) => setFormData({ ...formData, subjectInput: e.target.value })}
                                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubject())}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSubject}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {formData.subjects.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {formData.subjects.map((subject) => (
                                                <span
                                                    key={subject}
                                                    className="flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm"
                                                >
                                                    {subject}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSubject(subject)}
                                                        className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
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
                                        <School size={18} />
                                        Create Class
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

export default RegistrarClasses;