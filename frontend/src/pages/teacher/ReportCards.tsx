// src/pages/teacher/ReportCards.tsx - FIXED DROPDOWNS

import { useState, useEffect } from "react";
import { 
    Upload, FileText, Download, Trash2, Search, 
    X, Check, RefreshCw, School, Users, 
    Eye, Edit2, Plus, Filter, Loader2
} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface ReportCard {
    _id: string;
    studentId: { _id: string; name: string; email: string; class: string };
    classId: { _id: string; name: string; grade: string; section: string };
    term: string;
    academicYear: string;
    subjects: { name: string; score: number; grade: string; remarks: string }[];
    totalMarks: number;
    totalObtained: number;
    percentage: number;
    gpa: number;
    overallGrade: string;
    teacherRemarks: string;
    fileUrl: string;
    fileName: string;
    uploadedBy: { _id: string; name: string; email: string };
    status: string;
    isVisibleToStudent: boolean;
    isVisibleToParent: boolean;
    createdAt: string;
}

interface Student {
    _id: string;
    name: string;
    email: string;
    class: string;
    classLevel: string;
}

interface Class {
    _id: string;
    name: string;
    grade: string;
    section: string;
}

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Final'];
const ACADEMIC_YEARS = ['2024/25', '2025/26', '2026/27', '2027/28'];
const GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

const TeacherReportCards = () => {
    const [reportCards, setReportCards] = useState<ReportCard[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingClasses, setLoadingClasses] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTerm, setFilterTerm] = useState<string>("");
    const [filterAcademicYear, setFilterAcademicYear] = useState<string>("");

    const [formData, setFormData] = useState({
        studentId: "",
        classId: "",
        term: "",
        academicYear: "",
        subjects: [] as { name: string; score: number; grade: string; remarks: string }[],
        subjectName: "",
        subjectScore: "",
        subjectGrade: "",
        subjectRemarks: "",
        totalMarks: "",
        totalObtained: "",
        percentage: "",
        gpa: "",
        overallGrade: "",
        teacherRemarks: "",
        status: "published",
        isVisibleToStudent: true,
        isVisibleToParent: true,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchReportCards(),
            fetchStudents(),
            fetchClasses()
        ]);
        setLoading(false);
    };

    const fetchReportCards = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:7000/api/report-cards';
            const params = new URLSearchParams();
            if (filterTerm) params.append('term', filterTerm);
            if (filterAcademicYear) params.append('academicYear', filterAcademicYear);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReportCards(response.data.data || []);
        } catch (error: any) {
            console.error("Error fetching report cards:", error);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoadingStudents(true);
            const token = localStorage.getItem('token');
            
            // ✅ First try to get students from registrar
            const response = await axios.get('http://localhost:7000/api/registrar/students', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const studentsData = response.data.data || [];
            setStudents(studentsData);
            console.log('📚 Students loaded:', studentsData.length);
            setLoadingStudents(false);
        } catch (error: any) {
            console.error("Error fetching students:", error);
            setLoadingStudents(false);
            
            // ✅ Fallback: Try to get students from another endpoint
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:7000/api/users?role=student', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(response.data.data || []);
                console.log('📚 Students loaded (fallback):', response.data.data?.length);
            } catch (fallbackError) {
                console.error("Fallback error fetching students:", fallbackError);
            }
        }
    };

    const fetchClasses = async () => {
        try {
            setLoadingClasses(true);
            const token = localStorage.getItem('token');
            
            // ✅ First try to get classes from registrar
            const response = await axios.get('http://localhost:7000/api/registrar/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const classesData = response.data.data || [];
            setClasses(classesData);
            console.log('📚 Classes loaded:', classesData.length);
            setLoadingClasses(false);
        } catch (error: any) {
            console.error("Error fetching classes:", error);
            setLoadingClasses(false);
            
            // ✅ Fallback: Try to get classes from another endpoint
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:7000/api/classes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setClasses(response.data.data || []);
                console.log('📚 Classes loaded (fallback):', response.data.data?.length);
            } catch (fallbackError) {
                console.error("Fallback error fetching classes:", fallbackError);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const addSubject = () => {
        if (formData.subjectName && formData.subjectScore) {
            setFormData({
                ...formData,
                subjects: [...formData.subjects, {
                    name: formData.subjectName,
                    score: parseFloat(formData.subjectScore),
                    grade: formData.subjectGrade || '',
                    remarks: formData.subjectRemarks || '',
                }],
                subjectName: "",
                subjectScore: "",
                subjectGrade: "",
                subjectRemarks: "",
            });
        }
    };

    const removeSubject = (index: number) => {
        setFormData({
            ...formData,
            subjects: formData.subjects.filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.studentId || !formData.classId || !formData.term || !formData.academicYear) {
            alert('Please fill in all required fields.');
            return;
        }

        if (formData.subjects.length === 0) {
            alert('Please add at least one subject.');
            return;
        }

        const totalMarks = formData.subjects.reduce((sum, s) => sum + s.score, 0);
        const totalSubjects = formData.subjects.length;
        const percentage = totalSubjects > 0 ? (totalMarks / (totalSubjects * 100)) * 100 : 0;

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('studentId', formData.studentId);
            formDataToSend.append('classId', formData.classId);
            formDataToSend.append('term', formData.term);
            formDataToSend.append('academicYear', formData.academicYear);
            formDataToSend.append('subjects', JSON.stringify(formData.subjects));
            formDataToSend.append('totalMarks', totalMarks.toString());
            formDataToSend.append('totalObtained', totalMarks.toString());
            formDataToSend.append('percentage', percentage.toString());
            formDataToSend.append('gpa', '0');
            formDataToSend.append('overallGrade', formData.overallGrade || '');
            formDataToSend.append('teacherRemarks', formData.teacherRemarks || '');
            formDataToSend.append('status', formData.status);
            formDataToSend.append('isVisibleToStudent', formData.isVisibleToStudent.toString());
            formDataToSend.append('isVisibleToParent', formData.isVisibleToParent.toString());
            if (selectedFile) {
                formDataToSend.append('file', selectedFile);
            }

            await axios.post('http://localhost:7000/api/report-cards/upload', formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess(true);
            setSuccessMessage('✅ Report card uploaded successfully!');
            setShowModal(false);
            resetForm();
            fetchReportCards();

            setTimeout(() => {
                setSuccess(false);
                setSuccessMessage("");
            }, 5000);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to upload report card");
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            studentId: "",
            classId: "",
            term: "",
            academicYear: "",
            subjects: [],
            subjectName: "",
            subjectScore: "",
            subjectGrade: "",
            subjectRemarks: "",
            totalMarks: "",
            totalObtained: "",
            percentage: "",
            gpa: "",
            overallGrade: "",
            teacherRemarks: "",
            status: "published",
            isVisibleToStudent: true,
            isVisibleToParent: true,
        });
        setSelectedFile(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this report card?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:7000/api/report-cards/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchReportCards();
            alert('✅ Report card deleted successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete report card");
        }
    };

    const handleDownload = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:7000/api/report-cards/${id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report-card.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to download report card");
        }
    };

    const handleView = (report: ReportCard) => {
        setSelectedReport(report);
        setShowViewModal(true);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
            published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
            archived: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        };
        return styles[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    };

    const getGradeColor = (grade: string) => {
        const colors: Record<string, string> = {
            A: 'text-green-700 dark:text-green-400',
            'A-': 'text-green-600 dark:text-green-400',
            'B+': 'text-blue-600 dark:text-blue-400',
            B: 'text-blue-600 dark:text-blue-400',
            'B-': 'text-blue-500 dark:text-blue-400',
            'C+': 'text-yellow-600 dark:text-yellow-400',
            C: 'text-yellow-600 dark:text-yellow-400',
            'C-': 'text-yellow-500 dark:text-yellow-400',
            D: 'text-orange-600 dark:text-orange-400',
            F: 'text-red-600 dark:text-red-400',
        };
        return colors[grade] || 'text-gray-600 dark:text-gray-400';
    };

    const filteredReports = reportCards.filter(r => {
        const matchSearch = r.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.term?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch;
    });

    if (loading) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading report cards...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

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
                            Grade Reports
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Upload and manage student report cards</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
                    >
                        <Upload size={18} />
                        Upload Report Card
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Reports</p>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{reportCards.length}</h2>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow-sm p-4 border border-green-200 dark:border-green-800">
                        <p className="text-green-600 dark:text-green-400 text-sm">Published</p>
                        <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
                            {reportCards.filter(r => r.status === 'published').length}
                        </h2>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-sm p-4 border border-yellow-200 dark:border-yellow-800">
                        <p className="text-yellow-600 dark:text-yellow-400 text-sm">Drafts</p>
                        <h2 className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                            {reportCards.filter(r => r.status === 'draft').length}
                        </h2>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow-sm p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-blue-600 dark:text-blue-400 text-sm">Students</p>
                        <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {new Set(reportCards.map(r => r.studentId?._id)).size}
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
                                placeholder="Search by student name or term..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterTerm}
                                onChange={(e) => setFilterTerm(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                            >
                                <option value="">All Terms</option>
                                {TERMS.map(term => (
                                    <option key={term} value={term}>{term}</option>
                                ))}
                            </select>
                            <select
                                value={filterAcademicYear}
                                onChange={(e) => setFilterAcademicYear(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
                            >
                                <option value="">All Years</option>
                                {ACADEMIC_YEARS.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => {
                                    setFilterTerm("");
                                    setFilterAcademicYear("");
                                    setSearchTerm("");
                                    fetchReportCards();
                                }}
                                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Cards Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Student</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Class</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Term</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Year</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Grade</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No report cards uploaded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report) => (
                                        <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-800 dark:text-gray-200">{report.studentId?.name || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{report.studentId?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{report.classId?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{report.term}</td>
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{report.academicYear}</td>
                                            <td className="px-4 py-3">
                                                <span className={`font-bold ${getGradeColor(report.overallGrade)}`}>
                                                    {report.overallGrade || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleView(report)}
                                                        className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(report._id)}
                                                        className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                                                        title="Download"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(report._id)}
                                                        className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
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
            </div>

            {/* Upload Modal - FIXED DROPDOWNS */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                Upload Report Card
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Student & Class - FIXED */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student *</label>
                                    <select
                                        required
                                        value={formData.studentId}
                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Student</option>
                                        {loadingStudents ? (
                                            <option value="" disabled>Loading students...</option>
                                        ) : students.length === 0 ? (
                                            <option value="" disabled>No students found</option>
                                        ) : (
                                            students.map(student => (
                                                <option key={student._id} value={student._id}>
                                                    {student.name} ({student.class || 'No Class'})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {students.length === 0 && !loadingStudents && (
                                        <p className="text-xs text-yellow-600 mt-1">
                                            ⚠️ No students found. Please create students first.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class *</label>
                                    <select
                                        required
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Class</option>
                                        {loadingClasses ? (
                                            <option value="" disabled>Loading classes...</option>
                                        ) : classes.length === 0 ? (
                                            <option value="" disabled>No classes found</option>
                                        ) : (
                                            classes.map(cls => (
                                                <option key={cls._id} value={cls._id}>
                                                    {cls.name} (Grade {cls.grade}{cls.section})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    {classes.length === 0 && !loadingClasses && (
                                        <p className="text-xs text-yellow-600 mt-1">
                                            ⚠️ No classes found. Please create classes first.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Rest of the form remains the same... */}
                            {/* Term & Year */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term *</label>
                                    <select
                                        required
                                        value={formData.term}
                                        onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Term</option>
                                        {TERMS.map(term => (
                                            <option key={term} value={term}>{term}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year *</label>
                                    <select
                                        required
                                        value={formData.academicYear}
                                        onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Year</option>
                                        {ACADEMIC_YEARS.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subjects */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subjects & Grades</label>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                    <div className="grid grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Subject"
                                            value={formData.subjectName}
                                            onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Score"
                                            value={formData.subjectScore}
                                            onChange={(e) => setFormData({ ...formData, subjectScore: e.target.value })}
                                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            max="100"
                                        />
                                        <select
                                            value={formData.subjectGrade}
                                            onChange={(e) => setFormData({ ...formData, subjectGrade: e.target.value })}
                                            className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Grade</option>
                                            {GRADES.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={addSubject}
                                            className="bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 transition"
                                        >
                                            <Plus size={18} className="mx-auto" />
                                        </button>
                                    </div>
                                    {formData.subjects.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {formData.subjects.map((subject, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-600">
                                                    <div className="flex items-center gap-4">
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{subject.name}</span>
                                                        <span className="text-gray-700 dark:text-gray-300">{subject.score}%</span>
                                                        <span className={`font-bold ${getGradeColor(subject.grade)}`}>
                                                            {subject.grade}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubject(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formData.subjects.length === 0 && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Add at least one subject</p>
                                    )}
                                </div>
                            </div>

                            {/* Overall Grade & Remarks */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Overall Grade</label>
                                    <select
                                        value={formData.overallGrade}
                                        onChange={(e) => setFormData({ ...formData, overallGrade: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Grade</option>
                                        {GRADES.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher Remarks</label>
                                <textarea
                                    rows={2}
                                    value={formData.teacherRemarks}
                                    onChange={(e) => setFormData({ ...formData, teacherRemarks: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Enter teacher remarks..."
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Card File (PDF)</label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="report-upload"
                                    />
                                    <label htmlFor="report-upload" className="cursor-pointer block">
                                        {selectedFile ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-2xl">📄</span>
                                                <span className="text-gray-700 dark:text-gray-200 font-medium">{selectedFile.name}</span>
                                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                        ) : (
                                            <div>
                                                    <Upload size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                                                    <p className="text-gray-500 dark:text-gray-400">Click to upload PDF</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Only PDF files (Max 20MB)</p>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Visibility */}
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isVisibleToStudent}
                                        onChange={(e) => setFormData({ ...formData, isVisibleToStudent: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Visible to Student</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isVisibleToParent}
                                        onChange={(e) => setFormData({ ...formData, isVisibleToParent: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Visible to Parent</span>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg shadow-blue-200 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                            Uploading...
                                        </span>
                                    ) : (
                                        'Upload Report Card'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal (same as before) */}
            {showViewModal && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowViewModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Report Card Details</h2>
                            <button onClick={() => setShowViewModal(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Student Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Student</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedReport.studentId?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedReport.studentId?.email || ''}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Class</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedReport.classId?.name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Term</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedReport.term}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Academic Year</p>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedReport.academicYear}</p>
                                </div>
                            </div>

                            {/* Subjects */}
                            <div>
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Subjects</h3>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 dark:bg-gray-600">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Subject</th>
                                                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Score</th>
                                                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Grade</th>
                                                <th className="text-left px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                            {selectedReport.subjects.map((subject, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{subject.name}</td>
                                                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{subject.score}%</td>
                                                    <td className={`px-4 py-2 font-bold ${getGradeColor(subject.grade)}`}>
                                                        {subject.grade}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{subject.remarks || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-4 gap-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{selectedReport.totalMarks}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Obtained</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{selectedReport.totalObtained}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Percentage</p>
                                    <p className="font-bold text-gray-800 dark:text-gray-200">{selectedReport.percentage}%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Grade</p>
                                    <p className={`font-bold ${getGradeColor(selectedReport.overallGrade)}`}>
                                        {selectedReport.overallGrade || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Remarks */}
                            {selectedReport.teacherRemarks && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Teacher Remarks</p>
                                    <p className="text-gray-700 dark:text-gray-300">{selectedReport.teacherRemarks}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                                {selectedReport.fileUrl && (
                                    <button
                                        onClick={() => handleDownload(selectedReport._id)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download PDF
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowViewModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeacherReportCards;