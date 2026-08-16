import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Eye, Send, Clock, Users, FileText, X } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
    marks: number;
}

interface Worksheet {
    _id: string;
    title: string;
    description: string;
    classId: {
        _id: string;
        name: string;
    };
    subject: string;
    teacherId: {
        _id: string;
        name: string;
    };
    questions: Question[];
    startDate: string;
    endDate: string;
    duration: number;
    totalMarks: number;
    totalQuestions: number;
    status: 'draft' | 'published' | 'closed';
    createdAt: string;
}

const TeacherWorksheets = () => {
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        classId: "",
        subject: "",
        questions: [] as Question[],
        startDate: "",
        endDate: "",
        duration: 30,
    });
    const [currentQuestion, setCurrentQuestion] = useState<Question>({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        marks: 1,
    });

    useEffect(() => {
        fetchWorksheets();
        fetchClasses();
    }, []);

    const fetchWorksheets = async () => {
        try {
            const response = await apiClient.get('/api/worksheets');
            setWorksheets(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching worksheets:", error);
            setError(error.response?.data?.error || "Failed to load worksheets");
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const response = await apiClient.get('/api/classes');
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const handleAddQuestion = () => {
        if (!currentQuestion.question.trim() || currentQuestion.options.some(o => !o.trim())) {
            alert("Please fill in all question fields");
            return;
        }
        setFormData({
            ...formData,
            questions: [...formData.questions, { ...currentQuestion }],
        });
        setCurrentQuestion({
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
            marks: 1,
        });
    };

    const handleRemoveQuestion = (index: number) => {
        setFormData({
            ...formData,
            questions: formData.questions.filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.questions.length === 0) {
            alert("Please add at least one question");
            return;
        }

        try {
            const url = editingId
                ? `/api/worksheets/${editingId}`
                : '/api/worksheets';
            const method = editingId ? 'put' : 'post';

            const response = await apiClient[method](url, formData);

            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchWorksheets();
            alert(editingId ? 'Worksheet updated!' : 'Worksheet created!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to save worksheet");
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await apiClient.put(`/api/worksheets/${id}/publish`, {});
            fetchWorksheets();
            alert('Worksheet published!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to publish");
        }
    };

    const handleClose = async (id: string) => {
        try {
            await apiClient.put(`/api/worksheets/${id}/close`, {});
            fetchWorksheets();
            alert('Worksheet closed!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to close");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this worksheet?")) return;
        try {
            await apiClient.delete(`/api/worksheets/${id}`);
            fetchWorksheets();
            alert('Worksheet deleted!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            classId: "",
            subject: "",
            questions: [],
            startDate: "",
            endDate: "",
            duration: 30,
        });
        setCurrentQuestion({
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
            marks: 1,
        });
    };

    const openEditModal = (worksheet: Worksheet) => {
        setEditingId(worksheet._id);
        setFormData({
            title: worksheet.title,
            description: worksheet.description || "",
            classId: worksheet.classId._id,
            subject: worksheet.subject,
            questions: worksheet.questions,
            startDate: new Date(worksheet.startDate).toISOString().split('T')[0],
            endDate: new Date(worksheet.endDate).toISOString().split('T')[0],
            duration: worksheet.duration,
        });
        setShowModal(true);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700',
            published: 'bg-green-100 text-green-700',
            closed: 'bg-red-100 text-red-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading worksheets...</div>
                </div>
            </DashboardLayout>
        );
    }

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-semibold">
                        {editingId ? "Edit Worksheet" : "Create New Worksheet"}
                    </h2>
                    <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select
                            required
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            rows={2}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                            <input
                                type="number"
                                required
                                min="5"
                                max="180"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Questions ({formData.questions.length})</h4>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    placeholder="Question"
                                    value={currentQuestion.question}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    {currentQuestion.options.map((opt, idx) => (
                                        <input
                                            key={idx}
                                            type="text"
                                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOptions = [...currentQuestion.options];
                                                newOptions[idx] = e.target.value;
                                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                            }}
                                            className={`w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${
                                                currentQuestion.correctAnswer === idx ? 'border-green-500 bg-green-50' : ''
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Correct Answer:</label>
                                        <select
                                            value={currentQuestion.correctAnswer}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                                            className="border rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {currentQuestion.options.map((_, idx) => (
                                                <option key={idx} value={idx}>
                                                    Option {String.fromCharCode(65 + idx)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Marks:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={currentQuestion.marks}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) || 1 })}
                                            className="w-16 border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Add Question
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.questions.map((q, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                        <span className="font-medium text-sm">Q{idx + 1}:</span>
                                        <span className="text-sm ml-2">{q.question}</span>
                                        <span className="text-xs text-gray-500 ml-2">({q.marks} marks)</span>
                                        <span className="text-xs text-green-600 ml-2">
                                            ✓ {String.fromCharCode(65 + q.correctAnswer)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(idx)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                            {editingId ? "Update" : "Create"} Worksheet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <DashboardLayout role="teacher">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Worksheets</h1>
                        <p className="text-gray-500">Create and manage online worksheets</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={18} /> New Worksheet
                    </button>
                </div>

                {worksheets.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <FileText size={48} className="mx-auto text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-700">No Worksheets</h3>
                        <p className="text-gray-500">Create your first worksheet for students.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {worksheets.map((ws) => (
                            <div key={ws._id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800">{ws.title}</h3>
                                        <p className="text-sm text-gray-500">{ws.subject} • {ws.classId?.name || 'No class'}</p>
                                        <p className="text-sm text-gray-400 mt-1">{ws.questions.length} questions • {ws.totalMarks} marks</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ws.status)}`}>
                                        {ws.status.toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {ws.duration} min
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users size={14} /> {ws.totalQuestions} Qs
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {ws.status === 'draft' && (
                                        <button
                                            onClick={() => handlePublish(ws._id)}
                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200"
                                        >
                                            Publish
                                        </button>
                                    )}
                                    {ws.status === 'published' && (
                                        <button
                                            onClick={() => handleClose(ws._id)}
                                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200"
                                        >
                                            Close
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openEditModal(ws)}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200"
                                    >
                                        <Edit2 size={14} className="inline mr-1" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ws._id)}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200"
                                    >
                                        <Trash2 size={14} className="inline mr-1" /> Delete
                                    </button>
                                    <button
                                        onClick={() => window.location.href = `/teacher/worksheets/${ws._id}/results`}
                                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200"
                                    >
                                        <Eye size={14} className="inline mr-1" /> Results
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {showModal && modalContent}
        </DashboardLayout>
    );
};

export default TeacherWorksheets;