import { useState } from "react";

type Role = "student" | "teacher";

interface UserData {
    id: number;
    role: Role;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    gender: string;
    grade?: string;
    age?: number;
    department?: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: Role;
    onSave: (data: UserData) => void;
}

const UserRegistrationModal = ({
    isOpen,
    onClose,
    role,
    onSave,
}: ModalProps) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        gender: "",
        grade: "",
        department: "",
        age: "", // ✅ Keep as string for input binding
    });

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ✅ Convert age to number before sending
        const ageValue = formData.age ? parseInt(formData.age) : undefined;

        onSave({
            id: Date.now(),
            role,
            ...formData,
            age: ageValue, // ✅ Send as number
        });

        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            password: "",
            gender: "",
            grade: "",
            department: "",
            age: "",
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Add New {role === "student" ? "Student" : "Teacher"}
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* ✅ Grid for form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            required
                        />

                        <input
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            required
                        />

                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            required
                        />

                        <input
                            name="phone"
                            placeholder="Phone Number"
                            value={formData.phone}
                            onChange={handleChange}
                            className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                        />

                        <input
                            name="password"
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            required
                        />

                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>

                        {/* ✅ Age Field - Fixed placement */}
                        <div>
                            <input
                                type="number"
                                name="age"
                                placeholder="Age"
                                value={formData.age}
                                onChange={handleChange}
                                min="1"
                                max="120"
                                className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                required
                            />
                        </div>

                        {role === "student" ? (
                            <select
                                name="grade"
                                value={formData.grade}
                                onChange={handleChange}
                                className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                required
                            >
                                <option value="">Select Grade</option>
                                <option value="Grade 9">Grade 9</option>
                                <option value="Grade 10">Grade 10</option>
                                <option value="Grade 11">Grade 11</option>
                                <option value="Grade 12">Grade 12</option>
                            </select>
                        ) : (
                            <input
                                name="department"
                                placeholder="Department / Subject"
                                value={formData.department}
                                onChange={handleChange}
                                className="border border-gray-200 dark:border-gray-600 p-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                required
                            />
                        )}
                    </div>

                    {/* ✅ Buttons - Full width row */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                        >
                            Save {role === "student" ? "Student" : "Teacher"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserRegistrationModal;