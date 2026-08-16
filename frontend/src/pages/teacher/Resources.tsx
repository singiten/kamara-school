// src/pages/teacher/Resources.tsx - COMPLETE SAFE VERSION

import { useState, useEffect } from "react";
import { 
    Upload, FileText, Download, Trash2, Search, 
    X, Check, RefreshCw, School 
} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface Resource {
    _id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    readableSize: string;
    subject: string;
    topic: string;
    classLevel: string;
    grade: string;
    sections: string[];
    assignedClasses: { _id: string; name: string; grade: string; section: string }[];
    semester: string;
    academicYear: string;
    uploadedBy: { _id: string; name: string; email: string };
    downloadCount: number;
    viewCount: number;
    isActive: boolean;
    createdAt: string;
}

interface Class {
    _id: string;
    name: string;
    grade: string;
    section: string;
    classLevel: string;
}

const SEMESTERS = ['Semester 1', 'Semester 2', 'Summer'];
const ACADEMIC_YEARS = [ '2025/26', '2026/27', '2027/28'];

const TeacherResources = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterClassLevel, setFilterClassLevel] = useState<string>("");
    const [filterSubject, setFilterSubject] = useState<string>("");
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        subject: "",
        topic: "",
        classLevel: "",
        grade: "",
        sections: [] as string[],
        semester: "Semester 1",
        academicYear: "2026/27",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchResources();
        fetchTeacherClasses();
    }, [filterClassLevel, filterSubject]);

    const fetchResources = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:7000/api/resources';
            const params = new URLSearchParams();
            if (filterClassLevel) params.append('classLevel', filterClassLevel);
            if (filterSubject) params.append('subject', filterSubject);
            if (searchTerm) params.append('search', searchTerm);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResources(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching resources:", error);
            setLoading(false);
        }
    };

    // ✅ Fetch teacher's assigned classes
    const fetchTeacherClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // ✅ Get teacher's classes from the API
            const response = await axios.get('http://localhost:7000/api/resources/teacher/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const classesData = response.data.data || [];
            setTeacherClasses(classesData);
            console.log('📚 Teacher Classes loaded:', classesData.length, 'classes');
            
            // ✅ If no classes, try fallback
            if (classesData.length === 0) {
                console.log('⚠️ No classes from /teacher/classes, trying /auth/me');
                const meRes = await axios.get('http://localhost:7000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const user = meRes.data.data;
                if (user.assignedClasses && user.assignedClasses.length > 0) {
                    setTeacherClasses(user.assignedClasses);
                    console.log('📚 Found classes from /me:', user.assignedClasses.length);
                }
            }
        } catch (error) {
            console.error("Error fetching teacher classes:", error);
            setTeacherClasses([]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const toggleSection = (section: string) => {
        setFormData(prev => {
            const current = prev.sections || [];
            if (current.includes(section)) {
                return { ...prev, sections: current.filter(s => s !== section) };
            } else {
                return { ...prev, sections: [...current, section] };
            }
        });
    };

    const selectAllSections = () => {
        const allSections = teacherClasses.map(c => c.section);
        setFormData(prev => ({ ...prev, sections: allSections }));
    };

    const deselectAllSections = () => {
        setFormData(prev => ({ ...prev, sections: [] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.grade || formData.sections.length === 0) {
            alert('Please select a grade and at least one section.');
            return;
        }

        if (!selectedFile && !editingId) {
            alert('Please select a file to upload');
            return;
        }

        const selectedClassIds = teacherClasses
            .filter(c => formData.sections.includes(c.section))
            .map(c => c._id);

        if (selectedClassIds.length === 0) {
            alert('No classes found for the selected grade and sections.');
            return;
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('subject', formData.subject);
            formDataToSend.append('topic', formData.topic);
            formDataToSend.append('classLevel', formData.classLevel);
            formDataToSend.append('grade', formData.grade);
            formDataToSend.append('sections', JSON.stringify(formData.sections));
            formDataToSend.append('assignedClasses', JSON.stringify(selectedClassIds));
            formDataToSend.append('semester', formData.semester);
            formDataToSend.append('academicYear', formData.academicYear);
            if (selectedFile) {
                formDataToSend.append('file', selectedFile);
            }

            const url = editingId 
                ? `http://localhost:7000/api/resources/${editingId}`
                : 'http://localhost:7000/api/resources/upload';
            const method = editingId ? 'put' : 'post';

            await axios({
                method,
                url,
                data: formDataToSend,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess(true);
            setSuccessMessage(editingId ? '✅ Resource updated successfully!' : '✅ Resource uploaded successfully!');
            setShowModal(false);
            resetForm();
            fetchResources();

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to upload resource");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            subject: "",
            topic: "",
            classLevel: "",
            grade: "",
            sections: [],
            semester: "Semester 1",
            academicYear: "2026/27",
        });
        setSelectedFile(null);
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:7000/api/resources/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchResources();
            alert('✅ Resource deleted successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete resource");
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:7000/api/resources/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to download resource");
        }
    };

    const getFileIcon = (fileType: string) => {
        const icons: Record<string, { icon: string; color: string }> = {
            pdf: { icon: '📄', color: 'bg-red-100 text-red-700' },
            doc: { icon: '📝', color: 'bg-blue-100 text-blue-700' },
            docx: { icon: '📝', color: 'bg-blue-100 text-blue-700' },
            xls: { icon: '📊', color: 'bg-green-100 text-green-700' },
            xlsx: { icon: '📊', color: 'bg-green-100 text-green-700' },
            ppt: { icon: '📑', color: 'bg-orange-100 text-orange-700' },
            pptx: { icon: '📑', color: 'bg-orange-100 text-orange-700' },
            image: { icon: '🖼️', color: 'bg-purple-100 text-purple-700' },
            video: { icon: '🎬', color: 'bg-pink-100 text-pink-700' },
        };
        return icons[fileType] || { icon: '📎', color: 'bg-gray-100 text-gray-700' };
    };

    const getClassLevelLabel = (level: string) => {
        const labels: Record<string, string> = {
            primary: 'Primary (1-4)',
            middle: 'Middle (5-8)',
            secondary: 'Secondary (9-12)',
        };
        return labels[level] || level;
    };

    // ✅ Safely extract unique grades
    const availableGrades = teacherClasses && teacherClasses.length > 0 
        ? [...new Set(teacherClasses.map(c => String(c.grade)))] 
        : [];

    // ✅ If loading, show spinner
    if (loading) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading resources...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // ✅ Check if there was an error but we have some data
    const hasResources = resources && resources.length > 0;
    const hasClasses = teacherClasses && teacherClasses.length > 0;

    return (
        <DashboardLayout role="teacher">
            <div className="space-y-6">
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-green-700 dark:text-green-400 flex items-center gap-3 animate-fadeIn">
                        <Check size={24} />
                        <p className="font-medium">{successMessage}</p>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <FileText size={24} className="text-blue-600 dark:text-blue-400" />
                            Resources
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Upload resources for your assigned classes</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
                    >
                        <Upload size={18} />
                        Upload Resource
                    </button>
                </div>

                {/* Teacher Classes Info - SAFE */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <School size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">Your Assigned Classes:</span>
                        {!hasClasses ? (
                            <span className="text-yellow-600 dark:text-yellow-400 text-sm">No classes assigned yet</span>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {teacherClasses.map((cls) => (
                                    <span key={cls._id} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                                        {cls.name} (Grade {cls.grade}{cls.section})
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats - SAFE */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Resources</p>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{resources?.length || 0}</h2>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-600 dark:text-blue-400 text-sm">Total Downloads</p>
                        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {resources?.reduce((sum, r) => sum + (r.downloadCount || 0), 0) || 0}
                        </h2>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow-sm p-4 border border-purple-200 dark:border-purple-800">
                        <p className="text-purple-600 dark:text-purple-400 text-sm">Active</p>
                        <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                            {resources?.filter(r => r.isActive).length || 0}
                        </h2>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by title or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterClassLevel}
                                onChange={(e) => setFilterClassLevel(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                            >
                                <option value="">All Levels</option>
                                {['primary', 'middle', 'secondary'].map(level => (
                                    <option key={level} value={level}>
                                        {getClassLevelLabel(level)}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => {
                                    setFilterClassLevel("");
                                    setFilterSubject("");
                                    setSearchTerm("");
                                    fetchResources();
                                }}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Resources Table - SAFE */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">File</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Title</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Subject</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Grade</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Sections</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Downloads</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {!hasResources ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No resources uploaded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    resources.map((resource) => {
                                        const fileInfo = getFileIcon(resource.fileType);
                                        return (
                                            <tr key={resource._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-4 py-3">
                                                    <span className="text-2xl">{fileInfo.icon}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-200">{resource.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{resource.readableSize}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{resource.subject}</td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{resource.grade || 'N/A'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {resource.sections?.map((s: string) => (
                                                            <span key={s} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                                                                {s}
                                                            </span>
                                                        )) || <span className="text-gray-400 dark:text-gray-500 text-xs">All</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{resource.downloadCount || 0}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDownload(resource._id, resource.fileName)}
                                                            className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                                                            title="Download"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(resource._id)}
                                                            className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
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
            </div>

            {/* Upload Modal - Only show if we have classes */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingId ? "Edit Resource" : "Upload Resource"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Mathematics Notes - Chapter 5"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Brief description of the resource..."
                                />
                            </div>

                            {/* Subject & Topic */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Mathematics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                                    <input
                                        type="text"
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Quadratic Equations"
                                    />
                                </div>
                            </div>

                            {/* Grade Selection - SAFE */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                                {!hasClasses ? (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
                                        ⚠️ You don't have any assigned classes. Please contact the registrar.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.grade}
                                        onChange={(e) => {
                                            const grade = e.target.value;
                                            const sections = teacherClasses
                                                .filter(c => String(c.grade) === grade)
                                                .map(c => c.section);
                                            const gradeNum = parseInt(grade);
                                            setFormData({ 
                                                ...formData, 
                                                grade,
                                                sections: [],
                                                classLevel: gradeNum >= 9 ? 'secondary' : 
                                                           gradeNum >= 5 ? 'middle' : 'primary'
                                            });
                                        }}
                                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Grade</option>
                                        {availableGrades.map((grade: string) => (
                                            <option key={grade} value={grade}>Grade {grade}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Section Selection - SAFE */}
                            {formData.grade && hasClasses && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Select Sections *
                                            <span className="text-xs text-gray-400 ml-2">
                                                ({teacherClasses.filter(c => String(c.grade) === formData.grade).length} available)
                                            </span>
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={selectAllSections}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={deselectAllSections}
                                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 p-4 bg-gray-50 rounded-xl max-h-40 overflow-y-auto border border-gray-200">
                                        {teacherClasses
                                            .filter(c => String(c.grade) === formData.grade)
                                            .map((cls) => {
                                                const isSelected = formData.sections.includes(cls.section);
                                                return (
                                                    <label
                                                        key={cls._id}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                                                            isSelected 
                                                                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                                                : 'border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSection(cls.section)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm font-medium">
                                                            {cls.section}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                    </div>
                                    {formData.sections.length === 0 && (
                                        <p className="text-xs text-red-500 mt-1">
                                            ⚠️ Please select at least one section
                                        </p>
                                    )}
                                    {formData.sections.length > 0 && (
                                        <p className="text-xs text-green-600 mt-1">
                                            ✅ {formData.sections.length} section{formData.sections.length > 1 ? 's' : ''} selected: {formData.sections.join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Semester & Academic Year */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {SEMESTERS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                    <select
                                        value={formData.academicYear}
                                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                        className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {ACADEMIC_YEARS.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer block">
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-2xl">📄</span>
                                                <span className="text-gray-700 font-medium">{selectedFile.name}</span>
                                                <span className="text-sm text-gray-400">
                                                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                        ) : (
                                            <div>
                                                <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                                <p className="text-gray-500">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, PowerPoint, Images, Videos (Max 50MB)</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 border rounded-xl text-gray-700 hover:bg-gray-50 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading || formData.sections.length === 0 || !formData.grade || !hasClasses}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {uploading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                            Uploading...
                                        </span>
                                    ) : (
                                        editingId ? 'Update Resource' : 'Upload Resource'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeacherResources;