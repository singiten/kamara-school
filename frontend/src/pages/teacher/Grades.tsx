import { useState, useEffect } from "react";
import { Plus, X, Edit2, BarChart3 } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import axios from "axios";

interface Assessment {
    score: number;
    maxScore: number;
    weight: number;
}

interface GradeRecord {
    _id: string;
    studentId: {
        _id: string;
        name: string;
    };
    subject: string;
    score: number;
    grade: string;
    type: string;
    semester: string;
    academicYear: string;
    date: string;
    totalScore?: number;
    letterGrade?: string;
    gradePoints?: number;
     classId?: {          
        _id: string;
        name: string;
    };
    assessments?: {
        quiz: Assessment;
        homework: Assessment;
        classTest: Assessment;
        finalTest: Assessment;
        groupWork: Assessment;
    };
    feedback?: string;
    isComplete?: boolean;
    pendingAssessments?: string[];
}

interface GradeForm {
    studentId: string;
    subject: string;
    score: number;
    grade: string;
    type: string;
    semester: string;
    academicYear: string;
    classId: string;
    feedback: string;
    assessments: {
        quiz: Assessment;
        homework: Assessment;
        classTest: Assessment;
        finalTest: Assessment;
        groupWork: Assessment;
    };
}

interface ClassData {
    _id: string;
    name: string;
}

interface Student {
    _id: string;
    name: string;
    email: string;
}

const Grades = () => {
    const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
    const [formData, setFormData] = useState<GradeForm>({
        studentId: "",
        subject: "",
        score: 0,
        grade: "",
        type: "Exam",
        semester: "Semester 1",
        academicYear: "2024/25",
        classId: "",
        feedback: "",
        assessments: {
            quiz: { score: 0, maxScore: 20, weight: 15 },
            homework: { score: 0, maxScore: 15, weight: 10 },
            classTest: { score: 0, maxScore: 20, weight: 20 },
            finalTest: { score: 0, maxScore: 50, weight: 35 },
            groupWork: { score: 0, maxScore: 20, weight: 20 },
        },
    });

    useEffect(() => {
        fetchGradeData();
        fetchStudentsAndClasses();
    }, []);

    const fetchGradeData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            let classId = formData.classId;
            if (!classId) {
                const classesRes = await axios.get('http://localhost:7000/api/classes', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const classList = classesRes.data.data || [];
                setClasses(classList);
                if (classList.length > 0) {
                    classId = classList[0]._id;
                    setFormData(prev => ({ ...prev, classId }));
                }
            }
            
            if (!classId) {
                console.log("❌ No class found");
                setLoading(false);
                return;
            }
            
            const academicYear = formData.academicYear || "2024/25";
            
            const gradesRes = await axios.get(
                `http://localhost:7000/api/grades/class/${classId}?semester=Semester%201&academicYear=${academicYear}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setGradeRecords(gradesRes.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error("❌ Error fetching grades:", error);
            setLoading(false);
        }
    };

    const fetchStudentsAndClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const studentsRes = await axios.get('http://localhost:7000/api/users?role=student', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudents(studentsRes.data.data || []);

            const classesRes = await axios.get('http://localhost:7000/api/classes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(classesRes.data.data || []);
            
            if (classesRes.data.data && classesRes.data.data.length > 0) {
                setFormData(prev => ({ ...prev, classId: classesRes.data.data[0]._id }));
            }
        } catch (error) {
            console.error("Error fetching students/classes:", error);
        }
    };

    const forceRefreshGrades = async () => {
        try {
            const token = localStorage.getItem('token');
            let classId = formData.classId;
            
            if (!classId) {
                if (classes.length > 0) {
                    classId = classes[0]._id;
                } else {
                    console.log("❌ No classes available");
                    return;
                }
            }
            
            const academicYear = formData.academicYear || "2024/25";
            
            const gradesRes = await axios.get(
                `http://localhost:7000/api/grades/class/${classId}?semester=Semester%201&academicYear=${academicYear}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setGradeRecords(gradesRes.data.data || []);
        } catch (error) {
            console.error("❌ Error refreshing grades:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            const allFilled = formData.assessments.quiz.score > 0 &&
                              formData.assessments.homework.score > 0 &&
                              formData.assessments.classTest.score > 0 &&
                              formData.assessments.finalTest.score > 0 &&
                              formData.assessments.groupWork.score > 0;
            
            const gradeData = {
                studentId: formData.studentId,
                subject: formData.subject,
                classId: formData.classId,
                type: formData.type,
                semester: formData.semester,
                academicYear: formData.academicYear,
                feedback: formData.feedback,
                assessments: {
                    quiz: { score: formData.assessments.quiz.score, maxScore: 20, weight: 15 },
                    homework: { score: formData.assessments.homework.score, maxScore: 15, weight: 10 },
                    classTest: { score: formData.assessments.classTest.score, maxScore: 20, weight: 20 },
                    finalTest: { score: formData.assessments.finalTest.score, maxScore: 50, weight: 35 },
                    groupWork: { score: formData.assessments.groupWork.score, maxScore: 20, weight: 20 },
                }
            };

            await axios.post('http://localhost:7000/api/grades', gradeData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowModal(false);
            resetForm();
            await forceRefreshGrades();
            
            alert(allFilled 
                ? '✅ Grade saved successfully! The student can now see their complete grade.' 
                : '⏳ Grade saved as incomplete. The final grade will be calculated when all assessments are filled.');
            
        } catch (error: any) {
            console.error("❌ Error adding grade:", error);
            alert(error.response?.data?.error || "Failed to add grade");
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editingGrade) return;
        
        try {
            const token = localStorage.getItem('token');
            
            const allFilled = formData.assessments.quiz.score > 0 &&
                              formData.assessments.homework.score > 0 &&
                              formData.assessments.classTest.score > 0 &&
                              formData.assessments.finalTest.score > 0 &&
                              formData.assessments.groupWork.score > 0;
            
            const gradeData = {
                studentId: formData.studentId,
                subject: formData.subject,
                classId: formData.classId,
                type: formData.type,
                semester: formData.semester,
                academicYear: formData.academicYear,
                feedback: formData.feedback,
                assessments: {
                    quiz: { score: formData.assessments.quiz.score, maxScore: 20, weight: 15 },
                    homework: { score: formData.assessments.homework.score, maxScore: 15, weight: 10 },
                    classTest: { score: formData.assessments.classTest.score, maxScore: 20, weight: 20 },
                    finalTest: { score: formData.assessments.finalTest.score, maxScore: 50, weight: 35 },
                    groupWork: { score: formData.assessments.groupWork.score, maxScore: 20, weight: 20 },
                }
            };

            await axios.put(`http://localhost:7000/api/grades/${editingGrade._id}`, gradeData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowEditModal(false);
            setEditingGrade(null);
            resetForm();
            await forceRefreshGrades();
            
            alert(allFilled 
                ? '✅ Grade updated successfully! The student can now see their complete grade.' 
                : '⏳ Grade updated as incomplete. The final grade will be calculated when all assessments are filled.');
            
        } catch (error: any) {
            console.error("❌ Error updating grade:", error);
            alert(error.response?.data?.error || "Failed to update grade");
        }
    };

    const resetForm = () => {
        setFormData({
            studentId: "",
            subject: "",
            score: 0,
            grade: "",
            type: "Exam",
            semester: "Semester 1",
            academicYear: formData.academicYear,
            classId: formData.classId,
            feedback: "",
            assessments: {
                quiz: { score: 0, maxScore: 20, weight: 15 },
                homework: { score: 0, maxScore: 15, weight: 10 },
                classTest: { score: 0, maxScore: 20, weight: 20 },
                finalTest: { score: 0, maxScore: 50, weight: 35 },
                groupWork: { score: 0, maxScore: 20, weight: 20 },
            },
        });
    };

    const openEditModal = (grade: GradeRecord) => {
        setEditingGrade(grade);
        setFormData({
            studentId: grade.studentId?._id || '',
            subject: grade.subject || '',
            score: grade.score || 0,
            grade: grade.grade || '',
            type: grade.type || 'Exam',
            semester: grade.semester || 'Semester 1',
            academicYear: grade.academicYear || '2024/25',
            classId: grade.classId?._id || '',
            feedback: grade.feedback || '',
            assessments: grade.assessments || {
                quiz: { score: 0, maxScore: 20, weight: 15 },
                homework: { score: 0, maxScore: 15, weight: 10 },
                classTest: { score: 0, maxScore: 20, weight: 20 },
                finalTest: { score: 0, maxScore: 50, weight: 35 },
                groupWork: { score: 0, maxScore: 20, weight: 20 },
            },
        });
        setShowEditModal(true);
    };

    const toggleExpand = (id: string) => {
        setExpandedGrade(expandedGrade === id ? null : id);
    };

    const gradeColors: Record<string, string> = {
        'A+': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        'A': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        'A-': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        'B+': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        'B': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        'B-': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        'C+': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        'C': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        'C-': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        'D': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        'F': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        'I': 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
    };

    const getGradeColor = (grade: string) => {
        return gradeColors[grade] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    };

    const getAssessmentIcon = (key: string) => {
        const icons: Record<string, string> = {
            quiz: '📝',
            homework: '📚',
            classTest: '📊',
            finalTest: '🎯',
            groupWork: '👥',
        };
        return icons[key] || '📋';
    };

    const getAssessmentLabel = (key: string) => {
        const labels: Record<string, string> = {
            quiz: 'Quiz',
            homework: 'Homework',
            classTest: 'Class Test',
            finalTest: 'Final Test',
            groupWork: 'Group Work',
        };
        return labels[key] || key;
    };

    const renderAssessmentBreakdown = (grade: GradeRecord) => {
        if (!grade.assessments) return null;

        const assessments = grade.assessments;
        const keys = ['quiz', 'homework', 'classTest', 'finalTest', 'groupWork'];
        const allComplete = keys.every(key => assessments[key as keyof typeof assessments]?.score > 0);
        const pendingAssessments = keys
            .filter(key => assessments[key as keyof typeof assessments]?.score === 0)
            .map(key => getAssessmentLabel(key));

        return (
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">📊 Assessment Breakdown</h4>
                
                {!allComplete && (
                    <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                        ⚠️ <span className="font-medium">Incomplete Grade</span> — Missing: {pendingAssessments.join(', ')}
                        <span className="block text-xs text-yellow-600 dark:text-yellow-500 mt-1">This grade will be calculated once all assessments are entered.</span>
                    </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {keys.map((key) => {
                        const data = assessments[key as keyof typeof assessments];
                        if (!data) return null;
                        const percentage = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
                        const isPending = data.score === 0;
                        return (
                            <div key={key} className={`bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-600 text-center ${isPending ? 'opacity-50' : ''}`}>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{getAssessmentIcon(key)} {getAssessmentLabel(key)}</div>
                                <div className="font-bold text-sm text-gray-800 dark:text-gray-100">
                                    {isPending ? '—' : `${data.score}/${data.maxScore}`}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">{data.weight}% weight</div>
                                <div className={`text-xs font-medium ${isPending ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {isPending ? '⏳ Pending' : `${percentage}%`}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {allComplete ? (
                    <div className="mt-2 flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Total Score: <strong className="text-gray-800 dark:text-gray-100">{grade.totalScore || grade.score}%</strong></span>
                        <span className="text-gray-600 dark:text-gray-300">Grade: <strong className={getGradeColor(grade.letterGrade || grade.grade || '')}>{grade.letterGrade || grade.grade}</strong></span>
                        <span className="text-gray-600 dark:text-gray-300">GPA: <strong className="text-gray-800 dark:text-gray-100">{grade.gradePoints?.toFixed(1) || 'N/A'}</strong></span>
                    </div>
                ) : (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
                        ⏳ Waiting for {pendingAssessments.join(', ')} to calculate final grade.
                    </div>
                )}
                
                {grade.feedback && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600 pt-2">
                        💬 <span className="italic">{grade.feedback}</span>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <DashboardLayout role="teacher">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-xl text-gray-500 dark:text-gray-400">Loading grades...</div>
                </div>
            </DashboardLayout>
        );
    }

    // Add Grade Modal
    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Add Grade</h2>
                    <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                        <select
                            required
                            value={formData.classId}
                            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls._id} value={cls._id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
                        <select
                            required
                            value={formData.studentId}
                            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Student</option>
                            {students.map((student) => (
                                <option key={student._id} value={student._id}>{student.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Mathematics"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Exam">Exam</option>
                                <option value="Quiz">Quiz</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Project">Project</option>
                                <option value="Participation">Participation</option>
                                <option value="Homework">Homework</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                            <select
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Semester 1">Semester 1</option>
                                <option value="Semester 2">Semester 2</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                            <input
                                type="text"
                                required
                                value={formData.academicYear}
                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 2024/25"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">📊 Assessment Scores</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                formData.assessments.quiz.score > 0 &&
                                formData.assessments.homework.score > 0 &&
                                formData.assessments.classTest.score > 0 &&
                                formData.assessments.finalTest.score > 0 &&
                                formData.assessments.groupWork.score > 0
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                                {formData.assessments.quiz.score > 0 &&
                                 formData.assessments.homework.score > 0 &&
                                 formData.assessments.classTest.score > 0 &&
                                 formData.assessments.finalTest.score > 0 &&
                                 formData.assessments.groupWork.score > 0
                                    ? '✅ Complete'
                                    : '⏳ Incomplete'}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className={`p-2 rounded-lg border ${formData.assessments.quiz.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quiz (15%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={formData.assessments.quiz.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            quiz: { ...formData.assessments.quiz, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.quiz.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/20"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/20</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.homework.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Homework (10%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    value={formData.assessments.homework.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            homework: { ...formData.assessments.homework, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.homework.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/15"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/15</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.classTest.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Class Test (20%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={formData.assessments.classTest.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            classTest: { ...formData.assessments.classTest, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.classTest.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/20"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/20</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.finalTest.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Final Test (35%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={formData.assessments.finalTest.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            finalTest: { ...formData.assessments.finalTest, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.finalTest.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/50"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/50</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.groupWork.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Group Work (20%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={formData.assessments.groupWork.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            groupWork: { ...formData.assessments.groupWork, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.groupWork.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/20"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/20</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                            {formData.assessments.quiz.score > 0 &&
                             formData.assessments.homework.score > 0 &&
                             formData.assessments.classTest.score > 0 &&
                             formData.assessments.finalTest.score > 0 &&
                             formData.assessments.groupWork.score > 0 ? (
                                    <div className="text-green-700 dark:text-green-400">✅ All assessments complete. Grade will be calculated.</div>
                            ) : (
                                    <div className="text-yellow-700 dark:text-yellow-400">
                                    ⏳ <span className="font-medium">Incomplete Grade</span> — Fill all assessment fields to calculate final grade.
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Missing: {
                                        [
                                            !formData.assessments.quiz.score && 'Quiz',
                                            !formData.assessments.homework.score && 'Homework',
                                            !formData.assessments.classTest.score && 'Class Test',
                                            !formData.assessments.finalTest.score && 'Final Test',
                                            !formData.assessments.groupWork.score && 'Group Work'
                                        ].filter(Boolean).join(', ') || 'All fields filled'
                                    }</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback (optional)</label>
                        <input
                            type="text"
                            value={formData.feedback}
                            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Good work!"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Save Grade
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    // Edit Grade Modal
    const editModalContent = showEditModal && editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowEditModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Edit Grade</h2>
                    <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
                        <input
                            type="text"
                            disabled
                            value={editingGrade.studentId?.name || 'Unknown'}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Mathematics"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Exam">Exam</option>
                                <option value="Quiz">Quiz</option>
                                <option value="Assignment">Assignment</option>
                                <option value="Project">Project</option>
                                <option value="Participation">Participation</option>
                                <option value="Homework">Homework</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                            <select
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Semester 1">Semester 1</option>
                                <option value="Semester 2">Semester 2</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                            <input
                                type="text"
                                required
                                value={formData.academicYear}
                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 2024/25"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">📊 Assessment Scores</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                formData.assessments.quiz.score > 0 &&
                                formData.assessments.homework.score > 0 &&
                                formData.assessments.classTest.score > 0 &&
                                formData.assessments.finalTest.score > 0 &&
                                formData.assessments.groupWork.score > 0
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            }`}>
                                {formData.assessments.quiz.score > 0 &&
                                 formData.assessments.homework.score > 0 &&
                                 formData.assessments.classTest.score > 0 &&
                                 formData.assessments.finalTest.score > 0 &&
                                 formData.assessments.groupWork.score > 0
                                    ? '✅ Complete'
                                    : '⏳ Incomplete'}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className={`p-2 rounded-lg border ${formData.assessments.quiz.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Quiz (15%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={formData.assessments.quiz.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            quiz: { ...formData.assessments.quiz, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.quiz.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/20"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/20</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.homework.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Homework (10%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="15"
                                    value={formData.assessments.homework.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            homework: { ...formData.assessments.homework, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.homework.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/15"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/15</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.classTest.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Class Test (20%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={formData.assessments.classTest.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            classTest: { ...formData.assessments.classTest, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.classTest.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/20"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/20</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.finalTest.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Final Test (35%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="50"
                                    value={formData.assessments.finalTest.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            finalTest: { ...formData.assessments.finalTest, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.finalTest.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/50"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/50</span>
                            </div>
                            
                            <div className={`p-2 rounded-lg border ${formData.assessments.groupWork.score > 0 ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`}>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Group Work (20%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={formData.assessments.groupWork.score}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        assessments: {
                                            ...formData.assessments,
                                            groupWork: { ...formData.assessments.groupWork, score: parseInt(e.target.value) || 0 }
                                        }
                                    })}
                                    className={`w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${formData.assessments.groupWork.score > 0 ? 'border-green-500 dark:border-green-600' : ''}`}
                                    placeholder="/20"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500">/20</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm">
                            {formData.assessments.quiz.score > 0 &&
                             formData.assessments.homework.score > 0 &&
                             formData.assessments.classTest.score > 0 &&
                             formData.assessments.finalTest.score > 0 &&
                             formData.assessments.groupWork.score > 0 ? (
                                    <div className="text-green-700 dark:text-green-400">✅ All assessments complete. Grade will be calculated.</div>
                            ) : (
                                    <div className="text-yellow-700 dark:text-yellow-400">
                                    ⏳ <span className="font-medium">Incomplete Grade</span> — Fill all assessment fields to calculate final grade.
                                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">Missing: {
                                        [
                                            !formData.assessments.quiz.score && 'Quiz',
                                            !formData.assessments.homework.score && 'Homework',
                                            !formData.assessments.classTest.score && 'Class Test',
                                            !formData.assessments.finalTest.score && 'Final Test',
                                            !formData.assessments.groupWork.score && 'Group Work'
                                        ].filter(Boolean).join(', ') || 'All fields filled'
                                    }</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback (optional)</label>
                        <input
                            type="text"
                            value={formData.feedback}
                            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Good work!"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Update Grade
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <DashboardLayout role="teacher">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Grade Management</h1>
                        <p className="text-gray-500 dark:text-gray-400">Record and manage student grades with weighted assessments</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={18} /> Add Grade
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Student</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Subject</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Score</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Grade</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Date</th>
                                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {gradeRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            No grades recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    gradeRecords.map((record) => (
                                        <>
                                            <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{record.studentId?.name || 'Unknown'}</td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{record.subject}</td>
                                                <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">{record.totalScore || record.score}%</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGradeColor(record.letterGrade || record.grade || '')}`}>
                                                        {record.letterGrade || record.grade}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{record.type}</td>
                                                <td className="px-6 py-4">
                                                    {record.isComplete ? (
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                                            ✅ Complete
                                                        </span>
                                                    ) : (
                                                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">
                                                            ⏳ Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => openEditModal(record)}
                                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-1"
                                                        >
                                                            <Edit2 size={14} /> Edit
                                                        </button>
                                                        {record.assessments && (
                                                            <button
                                                                onClick={() => toggleExpand(record._id)}
                                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                                                            >
                                                                <BarChart3 size={16} />
                                                                {expandedGrade === record._id ? 'Hide' : 'View'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedGrade === record._id && (
                                                <tr>
                                                    <td colSpan={8} className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
                                                        {renderAssessmentBreakdown(record)}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && modalContent}
            {editModalContent}
        </DashboardLayout>
    );
};

export default Grades;