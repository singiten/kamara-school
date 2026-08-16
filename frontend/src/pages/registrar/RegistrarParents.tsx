import { useState, useEffect } from "react";
import { UserPlus, Search, Link2, X } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { apiClient } from "../../config/api";

interface Parent {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    children: { _id: string; name: string; email: string; class: string; age: number }[];
    createdAt: string;
}

interface Student {
    _id: string;
    name: string;
    email: string;
    class: string;
    age: number;
    parentId?: string;
}

const RegistrarParents = () => {
    const [parents, setParents] = useState<Parent[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "parent123",
        phone: "",
        address: "",
    });

    useEffect(() => {
        fetchParents();
        fetchStudents();
    }, []);

    const fetchParents = async () => {
        try {
            const response = await apiClient.get('/api/registrar/parents');
            setParents(response.data.data || []);
            setLoading(false);
        } catch (error: any) {
            console.error("Error fetching parents:", error);
            setError(error.response?.data?.error || "Failed to load parents");
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await apiClient.get('/api/registrar/students');
            setStudents(response.data.data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/api/registrar/parents', formData);
            setShowModal(false);
            fetchParents();
            alert('Parent created successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to create parent");
        }
    };

    const handleLinkStudent = async () => {
        if (!selectedParent || !selectedStudentId) {
            alert("Please select a parent and a student");
            return;
        }
        try {
            await apiClient.put(`/api/registrar/parents/${selectedParent._id}/link/${selectedStudentId}`, {});
            setShowLinkModal(false);
            setSelectedStudentId("");
            fetchParents();
            alert('Student linked to parent successfully!');
        } catch (error: any) {
            alert(error.response?.data?.error || "Failed to link student");
        }
    };

    const openLinkModal = (parent: Parent) => {
        setSelectedParent(parent);
        setShowLinkModal(true);
    };

    const filteredParents = parents.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <DashboardLayout role="registrar">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading parents...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="registrar">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Parent Management</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage parents and link them to their children</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <UserPlus size={18} />
                        Add Parent
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Parents</p>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{parents.length}</h2>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Children</p>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {parents.reduce((sum, p) => sum + (p.children?.length || 0), 0)}
                        </h2>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Unlinked Students</p>
                        <h2 className="text-2xl font-bold text-yellow-600">
                            {students.filter(s => !s.parentId).length}
                        </h2>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search parents by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
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
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Phone</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Children</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredParents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                            {parents.length === 0 ? "No parents registered yet." : "No parents match your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredParents.map((parent) => (
                                        <tr key={parent._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{parent.name}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{parent.email}</td>
                                            <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{parent.phone || 'N/A'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {parent.children && parent.children.length > 0 ? (
                                                        parent.children.map(child => (
                                                            <span key={child._id} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs">
                                                                {child.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                            <span className="text-gray-400 dark:text-gray-500 text-sm">No children</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => openLinkModal(parent)}
                                                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center gap-1"
                                                >
                                                    <Link2 size={14} /> Link Student
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
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Add New Parent</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password (default: parent123)"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100"
                                />
                                <input
                                    type="text"
                                    placeholder="Address (optional)"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 dark:text-gray-100"
                                />
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Add Parent</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showLinkModal && selectedParent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Link Student to {selectedParent.name}</h2>
                                <button onClick={() => setShowLinkModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a student to link to this parent</p>
                            <select
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 bg-white dark:bg-gray-700 dark:text-gray-100"
                            >
                                <option value="">Select a student...</option>
                                {students
                                    .filter(s => !selectedParent.children?.some(c => c._id === s._id))
                                    .map((student) => (
                                        <option key={student._id} value={student._id}>
                                            {student.name} ({student.class})
                                        </option>
                                    ))}
                            </select>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowLinkModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button onClick={handleLinkStudent} className="px-4 py-2 bg-green-600 text-white rounded-lg">Link Student</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RegistrarParents;