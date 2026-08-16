// src/pages/admin/AdminAnnouncements.tsx - ENHANCED UI

import React, { useState, useEffect } from "react";
import {
    Plus, Megaphone, CheckCircle, Clock, X, Calendar, Users,
    Edit2, Trash2, Eye, EyeOff, Send, Bell, Sparkles,
    Filter, Search, ChevronDown, ChevronUp, Award
} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    audience: "All" | "Students" | "Teachers" | "Parents" | "Admin";
    priority: "Low" | "Medium" | "High" | "Urgent";
    date: string;
    status: "Published" | "Draft" | "Archived";
    createdBy: {
        _id: string;
        name: string;
    };
    createdAt: string;
    expiresAt?: string;
    views?: number;
}

interface AnnouncementForm {
    title: string;
    content: string;
    audience: "All" | "Students" | "Teachers" | "Parents" | "Admin";
    priority: "Low" | "Medium" | "High" | "Urgent";
    date: string;
    status: "Published" | "Draft" | "Archived";
    expiresAt: string;
}

const AUDIENCE_BADGES: Record<string, { bg: string; text: string; icon: string }> = {
    All: { bg: "bg-purple-100", text: "text-purple-700", icon: "🌐" },
    Students: { bg: "bg-blue-100", text: "text-blue-700", icon: "🎓" },
    Teachers: { bg: "bg-green-100", text: "text-green-700", icon: "👨‍🏫" },
    Parents: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "👨‍👩‍👧" },
    Admin: { bg: "bg-red-100", text: "text-red-700", icon: "👑" },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    Low: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-300", icon: "📌" },
    Medium: { bg: "bg-blue-100", text: "text-blue-600", border: "border-blue-300", icon: "🔵" },
    High: { bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-300", icon: "🔶" },
    Urgent: { bg: "bg-red-100", text: "text-red-600", border: "border-red-300", icon: "🚨" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    Published: { bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle size={14} /> },
    Draft: { bg: "bg-gray-100", text: "text-gray-600", icon: <Clock size={14} /> },
    Archived: { bg: "bg-gray-100", text: "text-gray-400", icon: <EyeOff size={14} /> },
};

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAudience, setFilterAudience] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const [formData, setFormData] = useState<AnnouncementForm>({
        title: "",
        content: "",
        audience: "All",
        priority: "Medium",
        date: new Date().toISOString().split("T")[0],
        status: "Published",
        expiresAt: "",
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const token = localStorage.getItem('token');
            // API call - replace with actual endpoint
            // const response = await axios.get('http://localhost:7000/api/announcements', {
            //     headers: { Authorization: `Bearer ${token}` }
            // });
            // setAnnouncements(response.data.data || []);

            // Mock data
            setAnnouncements([
                {
                    _id: "1",
                    title: "📢 School Reopening Announcement",
                    content: "School will reopen on September 15, 2026. All students must report to their classes by 8:00 AM sharp. Please come with your school materials and uniforms ready.",
                    audience: "All",
                    priority: "High",
                    date: "2026-09-01",
                    status: "Published",
                    createdBy: { _id: "admin1", name: "Admin User" },
                    createdAt: "2026-09-01T10:00:00Z",
                    expiresAt: "2026-09-15T23:59:59Z",
                    views: 245,
                },
                {
                    _id: "2",
                    title: "👨‍👩‍👧‍👦 Parent-Teacher Meeting",
                    content: "Parent-teacher meeting is scheduled for October 10, 2026 at 2:00 PM in the school auditorium. All parents are encouraged to attend.",
                    audience: "Parents",
                    priority: "Medium",
                    date: "2026-09-15",
                    status: "Published",
                    createdBy: { _id: "admin1", name: "Admin User" },
                    createdAt: "2026-09-15T14:30:00Z",
                    expiresAt: "2026-10-10T23:59:59Z",
                    views: 89,
                },
                {
                    _id: "3",
                    title: "🚨 Urgent: Exam Schedule Change",
                    content: "Due to unforeseen circumstances, the final exams have been rescheduled to November 15-20, 2026. New timetables will be distributed soon.",
                    audience: "Students",
                    priority: "Urgent",
                    date: "2026-09-20",
                    status: "Published",
                    createdBy: { _id: "admin1", name: "Admin User" },
                    createdAt: "2026-09-20T08:15:00Z",
                    expiresAt: "2026-11-20T23:59:59Z",
                    views: 512,
                },
            ]);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // API call - replace with actual endpoint
            // await axios.post('http://localhost:7000/api/announcements', formData, {
            //     headers: { Authorization: `Bearer ${token}` }
            // });

            const newAnnouncement: Announcement = {
                _id: Date.now().toString(),
                ...formData,
                createdBy: { _id: user?._id || 'current', name: user?.name || 'You' },
                createdAt: new Date().toISOString(),
                views: 0,
            };

            if (editingId) {
                setAnnouncements(announcements.map(a =>
                    a._id === editingId ? { ...a, ...formData } : a
                ));
            } else {
                setAnnouncements([newAnnouncement, ...announcements]);
            }

            setShowModal(false);
            resetForm();
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to save announcement");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            content: "",
            audience: "All",
            priority: "Medium",
            date: new Date().toISOString().split("T")[0],
            status: "Published",
            expiresAt: "",
        });
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this announcement?")) return;
        setAnnouncements(announcements.filter(a => a._id !== id));
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getFilteredAnnouncements = () => {
        let filtered = announcements;

        if (filterAudience !== "All") {
            filtered = filtered.filter(a => a.audience === filterAudience);
        }
        if (filterStatus !== "All") {
            filtered = filtered.filter(a => a.status === filterStatus);
        }
        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.content.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    };

    const filteredAnnouncements = getFilteredAnnouncements();

    if (loading) {
        return (
            <DashboardLayout role="admin">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500 dark:text-gray-400">Loading announcements...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                {/* Header with Stats */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                            <Megaphone size={28} className="text-blue-600" />
                            Announcements
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full ml-2">
                                {announcements.length} total
                            </span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">Create and manage school announcements</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-200"
                    >
                        <Plus size={18} />
                        New Announcement
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Total</p>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{announcements.length}</h2>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl">
                                <Megaphone size={20} className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Published</p>
                                <h2 className="text-2xl font-bold text-green-600">
                                    {announcements.filter(a => a.status === "Published").length}
                                </h2>
                            </div>
                            <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl">
                                <CheckCircle size={20} className="text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Drafts</p>
                                <h2 className="text-2xl font-bold text-orange-600">
                                    {announcements.filter(a => a.status === "Draft").length}
                                </h2>
                            </div>
                            <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-xl">
                                <Clock size={20} className="text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Urgent</p>
                                <h2 className="text-2xl font-bold text-red-600">
                                    {announcements.filter(a => a.priority === "Urgent").length}
                                </h2>
                            </div>
                            <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-xl">
                                <Bell size={20} className="text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search announcements..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={filterAudience}
                                onChange={(e) => setFilterAudience(e.target.value)}
                                className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="All">All Audiences</option>
                                <option value="All">🌐 All</option>
                                <option value="Students">🎓 Students</option>
                                <option value="Teachers">👨‍🏫 Teachers</option>
                                <option value="Parents">👨‍👩‍👧 Parents</option>
                                <option value="Admin">👑 Admin</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="All">All Status</option>
                                <option value="Published">✅ Published</option>
                                <option value="Draft">📝 Draft</option>
                                <option value="Archived">📦 Archived</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Announcements Cards */}
                <div className="space-y-4">
                    {filteredAnnouncements.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                            <Megaphone size={56} className="mx-auto text-gray-300 dark:text-gray-600" />
                            <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">No announcements found</h3>
                            <p className="text-gray-500 dark:text-gray-400">Create your first announcement to get started</p>
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                            >
                                <Plus size={16} className="inline mr-2" />
                                Create Announcement
                            </button>
                        </div>
                    ) : (
                        filteredAnnouncements.map((announcement) => {
                            const priorityStyle = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.Medium;
                            const audienceBadge = AUDIENCE_BADGES[announcement.audience] || AUDIENCE_BADGES.All;
                            const statusStyle = STATUS_STYLES[announcement.status] || STATUS_STYLES.Draft;
                            const isExpanded = expandedId === announcement._id;

                            return (
                                <div
                                    key={announcement._id}
                                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${priorityStyle.border} border-gray-200 dark:border-gray-700 hover:shadow-md transition-all overflow-hidden`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {/* Title Row */}
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                                        {announcement.title}
                                                    </h3>
                                                    <span className={`px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${priorityStyle.bg} ${priorityStyle.text}`}>
                                                        {priorityStyle.icon} {announcement.priority}
                                                    </span>
                                                    <span className={`px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
                                                        {statusStyle.icon} {announcement.status}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <p className={`text-gray-600 dark:text-gray-300 mt-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                                    {announcement.content}
                                                </p>

                                                {/* Meta Info */}
                                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${audienceBadge.bg} ${audienceBadge.text}`}>
                                                        {audienceBadge.icon} {announcement.audience}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(announcement.date).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users size={14} />
                                                        {announcement.views || 0} views
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        👤 {announcement.createdBy?.name || 'Unknown'}
                                                    </span>
                                                    {announcement.expiresAt && (
                                                        <span className="flex items-center gap-1 text-orange-500">
                                                            <Clock size={14} />
                                                            Expires: {new Date(announcement.expiresAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                                                <button
                                                    onClick={() => toggleExpand(announcement._id)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                    title={isExpanded ? "Show less" : "Show more"}
                                                >
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(announcement._id);
                                                        setFormData({
                                                            title: announcement.title,
                                                            content: announcement.content,
                                                            audience: announcement.audience,
                                                            priority: announcement.priority,
                                                            date: announcement.date,
                                                            status: announcement.status,
                                                            expiresAt: announcement.expiresAt || "",
                                                        });
                                                        setShowModal(true);
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(announcement._id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <Sparkles size={20} className="text-blue-600" />
                                {editingId ? "Edit Announcement" : "Create Announcement"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-gray-100 transition">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Enter announcement title"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 dark:text-gray-100"
                                    placeholder="Write your announcement content here..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Audience</label>
                                    <select
                                        value={formData.audience}
                                        onChange={(e) => setFormData({ ...formData, audience: e.target.value as any })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="All">🌐 All</option>
                                        <option value="Students">🎓 Students</option>
                                        <option value="Teachers">👨‍🏫 Teachers</option>
                                        <option value="Parents">👨‍👩‍👧 Parents</option>
                                        <option value="Admin">👑 Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="Low">📌 Low</option>
                                        <option value="Medium">🔵 Medium</option>
                                        <option value="High">🔶 High</option>
                                        <option value="Urgent">🚨 Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    >
                                        <option value="Published">✅ Published</option>
                                        <option value="Draft">📝 Draft</option>
                                        <option value="Archived">📦 Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Expires At (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition font-medium flex items-center gap-2"
                                >
                                    <Send size={18} />
                                    {editingId ? "Update" : "Publish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AdminAnnouncements;