import { useState, useRef } from "react";
import { School, Save, Bell, Lock, ShieldCheck, Upload, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import { useAppContext } from "../../context/AppContext";

interface SystemSettingsData {
    notifications: boolean;
    studentRegistration: boolean;
    attendance: boolean;
    grades: boolean;
    maintenance: boolean;
}

interface PasswordData {
    current: string;
    newPassword: string;
    confirm: string;
}

const Settings = () => {
    const { schoolInfo, setSchoolInfo } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string>(schoolInfo.logo);
    const [schoolFields, setSchoolFields] = useState({
        name: schoolInfo.name,
        email: schoolInfo.email,
        phone: schoolInfo.phone,
        address: schoolInfo.address,
        principal: schoolInfo.principal,
    });

    const [systemSettings, setSystemSettings] = useState<SystemSettingsData>({
        notifications: true,
        studentRegistration: true,
        attendance: true,
        grades: true,
        maintenance: false,
    });

    const [password, setPassword] = useState<PasswordData>({
        current: "",
        newPassword: "",
        confirm: "",
    });

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setLogoPreview(base64);
                setSchoolInfo({ ...schoolFields, logo: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const updateSchoolField = (key: string, value: string) => {
        setSchoolFields((prev) => ({ ...prev, [key]: value }));
    };

    const toggleSetting = (key: keyof SystemSettingsData) => {
        setSystemSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const saveSchoolInfo = () => {
        setSchoolInfo({
            ...schoolFields,
            logo: logoPreview || "",
        });
        alert("School information saved successfully!");
    };

    const updatePassword = () => {
        if (password.newPassword !== password.confirm) {
            alert("Passwords do not match");
            return;
        }
        if (password.newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }
        alert("Password updated successfully!");
        setPassword({ current: "", newPassword: "", confirm: "" });
    };

    const fieldList = [
        { label: "School Name", key: "name" },
        { label: "Principal Name", key: "principal" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone" },
    ] as const;

    const systemOptionList = [
        { label: "Enable Notifications", key: "notifications" as const, icon: Bell },
        { label: "Allow Student Registration", key: "studentRegistration" as const, icon: ShieldCheck },
        { label: "Enable Attendance Module", key: "attendance" as const, icon: ShieldCheck },
        { label: "Enable Grade Module", key: "grades" as const, icon: ShieldCheck },
        { label: "Maintenance Mode", key: "maintenance" as const, icon: ShieldCheck },
    ];

    return (
        <DashboardLayout role="admin">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage school and system preferences</p>
                </div>

                {/* Logo Upload Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-600 dark:text-gray-300">
                            <ImageIcon size={24} />
                        </div>
                        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">School Logo</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-700">
                            {logoPreview ? (
                                <img src={logoPreview} alt="School Logo" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400 dark:text-gray-500">
                                    <ImageIcon size={32} className="mx-auto mb-1" />
                                    <p className="text-xs">No logo</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition"
                            >
                                <Upload size={18} />
                                Upload Logo
                            </button>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Recommended: 200x200px PNG or JPG</p>
                        </div>
                    </div>
                </section>

                {/* School Information */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-600 dark:text-gray-300">
                            <School size={24} />
                        </div>
                        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">School Information</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        {fieldList.map((field) => (
                            <div key={field.key}>
                                <label className="text-sm text-gray-600 dark:text-gray-400">{field.label}</label>
                                <input
                                    type="text"
                                    value={schoolFields[field.key]}
                                    onChange={(e) => updateSchoolField(field.key, e.target.value)}
                                    className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        ))}

                        <div className="md:col-span-2">
                            <label className="text-sm text-gray-600 dark:text-gray-400">Address</label>
                            <textarea
                                value={schoolFields.address}
                                onChange={(e) => updateSchoolField("address", e.target.value)}
                                className="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                                rows={3}
                            />
                        </div>
                    </div>

                    <button
                        onClick={saveSchoolInfo}
                        className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </section>

                {/* System Settings */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-600 dark:text-gray-300">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">System Settings</h2>
                    </div>

                    <div className="space-y-4">
                        {systemOptionList.map((option) => {
                            const Icon = option.icon;
                            return (
                                <div key={option.key} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <Icon size={20} className="text-gray-500 dark:text-gray-400" />
                                        <span className="text-gray-700 dark:text-gray-200">{option.label}</span>
                                    </div>
                                    <button
                                        onClick={() => toggleSetting(option.key)}
                                        className={`w-12 h-6 rounded-full transition relative p-1 ${systemSettings[option.key] ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                                            }`}
                                    >
                                        <div
                                            className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${systemSettings[option.key] ? "translate-x-6" : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Password Section */}
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-gray-600 dark:text-gray-300">
                            <Lock size={24} />
                        </div>
                        <h2 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Change Password</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={password.current}
                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password.newPassword}
                            onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={password.confirm}
                            onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                        />
                    </div>

                    <button
                        onClick={updatePassword}
                        className="mt-5 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Update Password
                    </button>
                </section>

                {/* System Info */}
                <section className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
                    <h2 className="font-semibold text-lg mb-3 text-gray-800 dark:text-gray-100">School Portal</h2>
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p>Version: 1.0.0</p>
                        <p>Frontend: React + Tailwind</p>
                        <p>Backend: Express + MongoDB</p>
                    </div>
                </section>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
