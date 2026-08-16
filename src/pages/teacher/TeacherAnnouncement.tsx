// src/pages/teacher/TeacherAnnouncements.tsx
import { useState, useEffect } from "react";
import { Megaphone, Calendar, Clock, AlertCircle, Plus, X, Edit2, Trash2 } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    audience: string;
    priority: string;
    expiresAt: string;
    createdAt: string;
    createdBy: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    isExpired: boolean;
    timeRemaining: string;
}

const TeacherAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        audience: "all",
        priority: "medium",
        expiresAt: "",
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:7000/api/announcements', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnnouncements(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching announcements:", error);
            setError(error.response?.data?.error || "Failed to load announcements");
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingId 
                ? `http://localhost:7000/api/announcements/${editingId}`
                : 'http://localhost:7000/api/announcements';
            const method = editingId ? 'put' : 'post';
            
            await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setShowModal(false);
            setEditingId(null);
            setFormData({
                title: "",
                content: "",
                audience: "all",
                priority: "medium",
                expiresAt: "",
            });
            fetchAnnouncements();
            alert(editingId ? '✅ Announcement updated!' : '✅ Announcement created!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to save announcement");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:7000/api/announcements/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAnnouncements();
            alert('✅ Announcement deleted!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to delete announcement");
        }
    };

    const openEditModal = (announcement: Announcement) => {
        setEditingId(announcement._id);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            audience: announcement.audience,
            priority: announcement.priority,
            expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : "",
        });
        setShowModal(true);
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'bg-gray-100 text-gray-700',
            medium: 'bg-blue-100 text-blue-700',
            high: 'bg-yellow-100 text-yellow-700',
            urgent: 'bg-red-100 text-red-700',
        };
        return colors[priority] || 'bg-gray-100 text-gray-700';
    };

    const getAudienceLabel = (audience: string) => {
        const labels: Record<string, string> = {
            all: '📢 All Users',
            students: '🎓 Students',
            teachers: '👨‍🏫 Teachers',
            parents: '👪 Parents',
            admin: '👑 Admin',
        };
        return labels[audience] || audience;
    };

    if (loading) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500">Loading announcements...</div>
                </div>
            </DashboardLayout>
        );
    }

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-semibold">
                        {editingId ? "Edit Announcement" : "New Announcement"}
                    </h2>
                    <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Announcement title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            required
                            rows={4}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Announcement content"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                            <select
                                value={formData.audience}
                                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Users</option>
                                <option value="students">Students</option>
                                <option value="teachers">Teachers</option>
                                <option value="parents">Parents</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                        <input
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                            className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Save</button>
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
                        <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
                        <p className="text-gray-500">Create and manage school announcements</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={18} /> New Announcement
                    </button>
                </div>

                {announcements.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <Megaphone size={48} className="mx-auto text-gray-300" />
                        <h3 className="mt-4 text-lg font-medium text-gray-700">No Announcements</h3>
                        <p className="text-gray-500">Create your first announcement to communicate with students and parents.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((announcement) => (
                            <div
                                key={announcement._id}
                                className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${
                                    announcement.priority === 'urgent' ? 'border-red-500' :
                                    announcement.priority === 'high' ? 'border-yellow-500' :
                                    announcement.priority === 'medium' ? 'border-blue-500' :
                                    'border-gray-300'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {announcement.title}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                                                {announcement.priority.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mt-1">{announcement.content}</p>
                                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(announcement.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                {announcement.timeRemaining || 'No expiry'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Megaphone size={14} />
                                                {getAudienceLabel(announcement.audience)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditModal(announcement)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(announcement._id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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

export default TeacherAnnouncements;