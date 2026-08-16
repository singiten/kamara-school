import { useState, useEffect } from "react";
import {
    FileText,
    Download,
    Search,
    User,
    BookOpen,
    Clock,
    Grid,
    List,
} from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Resource {
    _id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    readableSize: string;
    fileIcon: string;
    subject: string;
    topic: string;
    classLevel: string;
    assignedClasses: { _id: string; name: string; grade: string; section: string }[];
    semester: string;
    academicYear: string;
    uploadedBy: { _id: string; name: string; email: string };
    downloadCount: number;
    viewCount: number;
    isActive: boolean;
    createdAt: string;
}

const CLASS_LEVELS = ['primary', 'middle', 'secondary'];
const SUBJECTS = ['Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'ICT', 'Physical Education', 'Art', 'Music'];

const StudentResources = () => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSubject, setFilterSubject] = useState<string>("");
    const [filterClassLevel, setFilterClassLevel] = useState<string>("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchResources();
    }, [filterSubject, filterClassLevel]);

    const fetchResources = async () => {
        try {
            let url = '/api/resources';
            const params = new URLSearchParams();
            if (filterSubject) params.append('subject', filterSubject);
            if (filterClassLevel) params.append('classLevel', filterClassLevel);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await apiClient.get(url);
            setResources(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching resources:", error);
            setLoading(false);
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const response = await apiClient.get(`/api/resources/${id}/download`, {
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

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const filteredResources = resources.filter(r => {
        const matchSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSearch;
    });

    if (loading) {
        return (
            <DashboardLayout role="student">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading resources...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="student">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen size={24} className="text-blue-600" />
                        Learning Resources
                    </h1>
                    <p className="text-gray-500">Access learning materials shared by your teachers</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-gray-500 text-sm">Total Resources</p>
                        <h2 className="text-2xl font-bold text-gray-800">{resources.length}</h2>
                    </div>
                    <div className="bg-blue-50 rounded-xl shadow-sm p-4 border border-blue-200">
                        <p className="text-blue-600 text-sm">Subjects</p>
                        <h2 className="text-2xl font-bold text-blue-700">
                            {new Set(resources.map(r => r.subject)).size}
                        </h2>
                    </div>
                    <div className="bg-green-50 rounded-xl shadow-sm p-4 border border-green-200">
                        <p className="text-green-600 text-sm">Downloaded</p>
                        <h2 className="text-2xl font-bold text-green-700">0</h2>
                    </div>
                    <div className="bg-purple-50 rounded-xl shadow-sm p-4 border border-purple-200">
                        <p className="text-purple-600 text-sm">New This Week</p>
                        <h2 className="text-2xl font-bold text-purple-700">
                            {resources.filter(r => {
                                const weekAgo = new Date();
                                weekAgo.setDate(weekAgo.getDate() - 7);
                                return new Date(r.createdAt) > weekAgo;
                            }).length}
                        </h2>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, subject, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={filterSubject}
                                onChange={(e) => setFilterSubject(e.target.value)}
                                className="border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">All Subjects</option>
                                {SUBJECTS.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                            <select
                                value={filterClassLevel}
                                onChange={(e) => setFilterClassLevel(e.target.value)}
                                className="border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="">All Levels</option>
                                {CLASS_LEVELS.map(level => (
                                    <option key={level} value={level}>
                                        {getClassLevelLabel(level)}
                                    </option>
                                ))}
                            </select>
                            <div className="flex border rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`px-3 py-2.5 transition ${
                                        viewMode === "grid" 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                    title="Grid View"
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`px-3 py-2.5 transition ${
                                        viewMode === "list" 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                    title="List View"
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {filteredResources.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">No resources available</h3>
                        <p className="text-gray-500">Your teachers haven't uploaded any resources yet.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredResources.map((resource) => {
                            const fileInfo = getFileIcon(resource.fileType);
                            return (
                                <div 
                                    key={resource._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden group"
                                >
                                    <div className={`p-4 flex items-center justify-center ${fileInfo.color.replace('text-', 'bg-').replace('700', '50')}`}>
                                        <span className="text-4xl">{fileInfo.icon}</span>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 line-clamp-1">{resource.title}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{resource.description || 'No description'}</p>
                                        
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                {resource.subject}
                                            </span>
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs">
                                                {getClassLevelLabel(resource.classLevel)}
                                            </span>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                                {resource.readableSize}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <User size={12} />
                                                <span>{resource.uploadedBy?.name || 'Unknown'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock size={12} />
                                                <span>{getTimeAgo(resource.createdAt)}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDownload(resource._id, resource.fileName)}
                                            className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                        >
                                            <Download size={16} />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">File</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Title</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Subject</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Level</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Size</th>
                                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredResources.map((resource) => {
                                        const fileInfo = getFileIcon(resource.fileType);
                                        return (
                                            <tr key={resource._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <span className="text-2xl">{fileInfo.icon}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{resource.title}</p>
                                                        <p className="text-xs text-gray-500">{resource.uploadedBy?.name || 'Unknown'} • {getTimeAgo(resource.createdAt)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">{resource.subject}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                        {getClassLevelLabel(resource.classLevel)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{resource.readableSize}</td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleDownload(resource._id, resource.fileName)}
                                                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                                        title="Download"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="text-center text-sm text-gray-400">
                    {filteredResources.length} resource{filteredResources.length !== 1 ? 's' : ''} available
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentResources;