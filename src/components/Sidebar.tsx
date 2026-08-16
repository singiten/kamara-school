// src/components/Sidebar.tsx

import React from "react";
import {
    Users,
    BookOpen,
    Calendar,
    Award,
    FileText,
    Settings,
    MessageCircle,
    DollarSign,
    ClipboardList,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Home,
    UserPlus,
    School,
    CreditCard,
    BarChart,
    Megaphone,
    Clock,
    UserCog,
    BookMarked,
    FolderOpen,
    FileCheck,
    PieChart,
    UserCheck,
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import schoolLogo from "../assets/logo.png";

const SCHOOL_NAME = "Kamara School";
const SCHOOL_SHORT_NAME = "KS";

interface SidebarProps {
    role:
    | "admin"
    | "registrar"
    | "finance_officer"
    | "teacher"
    | "student"
    | "parent";
    isOpen: boolean;
    toggleSidebar: () => void;
    onClose?: () => void;
}

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}

const Sidebar: React.FC<SidebarProps> = ({
    role,
    isOpen,
    toggleSidebar,
    onClose,
}) => {
    const location = useLocation();
    const navigate = useNavigate();

    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    const displayName = user?.name || "User";
    const displayRole = user?.role || role;

    const getNavItems = (): NavItem[] => {
        const commonItems: NavItem[] = [
            {
                path: `/${role}`,
                label: "Dashboard",
                icon: <Home size={20} />,
            },
            {
                path: `/${role}/announcements`,
                label: "Announcements",
                icon: <Megaphone size={20} />,
            },
            {
                path: `/${role}/chat`,
                label: "Chat",
                icon: <MessageCircle size={20} />,
            },
        ];

        switch (role) {
            case "admin":
                return [
                    ...commonItems,
                    { path: "/admin/students", label: "Students", icon: <Users size={20} /> },
                    { path: "/admin/teachers", label: "Teachers", icon: <UserPlus size={20} /> },
                   
                    { path: "/admin/attendance", label: "Attendance", icon: <Clock size={20} /> },
                    { path: "/admin/grades", label: "Grades", icon: <Award size={20} /> },
                    { path: "/admin/payments", label: "Payments", icon: <CreditCard size={20} /> },
                    { path: "/finance/reports", label: "Reports", icon: <PieChart size={20} /> },
                    { path: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
                ];

            case "registrar":
                return [
                     {path:"/registrar/", label:"Dashboard", icon:<Home size={20} />},
                    { path: "/registrar/students", label: "Students", icon: <Users size={20} /> },
                    { path: "/registrar/teachers", label: "Teachers", icon: <UserPlus size={20} /> },
                    { path: "/registrar/classes", label: "Classes", icon: <School size={20} /> },
                    { path: "/registrar/parents", label: "Parents", icon: <UserCog size={20} /> },
                    { path: "/registrar/password-reset", label: "Password Reset", icon: <UserCheck size={20} /> },
                ];

            case "finance_officer":
                return [
                   {path:"/finance/", label:"Dashboard", icon:<Home size={20} />},
                    { path: "/finance/fees", label: "Fee Structures", icon: <DollarSign size={20} /> },
                    { path: "/finance/payments", label: "Payments", icon: <CreditCard size={20} /> },
                    { path: "/finance/reports", label: "Reports", icon: <BarChart size={20} /> },
                    
                ];

            case "teacher":
                return [
                    ...commonItems,
                    { path: "/teacher/attendance", label: "Attendance", icon: <ClipboardList size={20} /> },
                    { path: "/teacher/grades", label: "Grades", icon: <Award size={20} /> },
                    { path: "/teacher/resources", label: "Resources", icon: <FolderOpen size={20} /> },
                    { path: "/teacher/report-cards", label: "Report Cards", icon: <FileCheck size={20} /> },
                    { path: "/teacher/worksheets", label: "Worksheets", icon: <BookMarked size={20} /> },
                ];

            case "student":
                return [
                    {path:"/student/", label:"Dashboard", icon:<Home size={20} />},
                    { path: "/student/attendance", label: "Attendance", icon: <Calendar size={20} /> },
                    { path: "/student/grades", label: "Grades", icon: <Award size={20} /> },
                    { path: "/student/fees", label: "Fees", icon: <DollarSign size={20} /> },
                    { path: "/student/resources", label: "Resources", icon: <BookOpen size={20} /> },
                    { path: "/student/report-cards", label: "Report Cards", icon: <FileText size={20} /> },
                    { path: "/student/worksheets", label: "Worksheets", icon: <BookMarked size={20} /> },
                    
                    {path:"/student/announcements", label:"Announcement", icon:<Megaphone size={20} />},
                ];

            case "parent":
                return [
                    ...commonItems,
                    { path: "/parent/children", label: "Children", icon: <Users size={20} /> },
                    { path: "/parent/attendance", label: "Attendance", icon: <Calendar size={20} /> },
                    { path: "/parent/grades", label: "Grades", icon: <Award size={20} /> },
                    { path: "/parent/payments", label: "Payments", icon: <DollarSign size={20} /> },
                    { path: "/parent/resources", label: "Resources", icon: <BookOpen size={20} /> },
                    { path: "/parent/report-cards", label: "Report Cards", icon: <FileText size={20} /> },
                ];

            default:
                return commonItems;
        }
    };

    const navItems = getNavItems();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <aside
            className={`bg-linear-to-b from-blue-900 to-indigo-900 text-white flex flex-col h-screen transition-all duration-300 shadow-2xl ${isOpen ? 'w-64' : 'w-20'
                }`}
        >
            {/* School Logo & Branding */}
            <div className={`flex items-center gap-3 p-4 border-b border-blue-800/30 ${isOpen ? 'justify-start' : 'justify-center'}`}>
                <div className="shrink-0">
                    <img
                        src={schoolLogo}
                        alt={SCHOOL_NAME}
                        className={`${isOpen ? 'w-14 h-14' : 'w-12 h-12'} rounded-xl object-cover bg-white/10 p-1 border border-blue-400/30 shadow-lg`}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = `${isOpen ? 'w-14 h-14' : 'w-12 h-12'} rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold shadow-lg`;
                                fallback.textContent = SCHOOL_SHORT_NAME;
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                </div>
                {isOpen && (
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-white truncate leading-tight">
                            {SCHOOL_NAME}
                        </h1>
                        <p className="text-xs text-blue-300 truncate capitalize">
                            {displayRole.replace('_', ' ')} Portal
                        </p>
                    </div>
                )}
            </div>

            {/* User Profile */}
            <div className={`flex items-center gap-3 p-4 border-b border-blue-800/30 ${isOpen ? 'justify-start' : 'justify-center'}`}>
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                </div>
                {isOpen && (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                        <p className="text-xs text-blue-300 truncate capitalize">{displayRole.replace('_', ' ')}</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-blue-600/30">
                <ul className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive =
                            location.pathname === item.path ||
                            location.pathname.startsWith(item.path + "/");

                        return (
                            <li key={item.path} className="relative">
                                <Link
                                    to={item.path}
                                    onClick={onClose}
                                    className={`relative flex items-center ${isOpen ? "justify-start" : "justify-center"
                                        } gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                            ? "bg-white/20 text-white shadow-lg shadow-blue-900/20"
                                            : "text-blue-200 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    {/* Icon */}
                                    <span
                                        className={`shrink-0 ${isActive
                                            ? "text-yellow-400"
                                            : "text-blue-300 group-hover:text-white"
                                            }`}
                                    >
                                        {item.icon}
                                    </span>

                                    {/* Expanded label */}
                                    {isOpen && (
                                        <span className="text-sm font-medium">
                                            {item.label}
                                        </span>
                                    )}

                                    {/* Badge */}
                                    {item.badge && isOpen && (
                                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Tooltip */}
                                    {!isOpen && (
                                        <div
                                            className="
                                    fixed
                                    left-20
                                    opacity-0 invisible
                                    group-hover:opacity-100
                                    group-hover:visible
                                    transition-all duration-150
                                    scale-95
                                    group-hover:scale-100
                                    pointer-events-none
                                    z-9999
                                "
                                            style={{
                                                transform: "translateY(-50%)",
                                            }}
                                        >
                                            <div className="relative">
                                                <div
                                                    className="
                                            absolute left-0 top-1/2
                                            -translate-x-1/2 -translate-y-1/2
                                            w-2 h-2
                                            bg-[#252526]
                                            rotate-45
                                            border-l border-t border-[#3c3c3c]
                                        "
                                                />

                                                <div
                                                    className="
                                            bg-[#252526]
                                            border border-[#3c3c3c]
                                            text-[#cccccc]
                                            text-[13px]
                                            px-3 py-1.5
                                            rounded
                                            shadow-[0_4px_14px_rgba(0,0,0,0.45)]
                                            whitespace-nowrap
                                        "
                                                >
                                                    {item.label}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            {/* Footer */}
            <div className="p-4 border-t border-blue-800/30">
                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-300 hover:bg-white/10 hover:text-white transition-all duration-200 ${isOpen ? 'justify-start' : 'justify-center'
                        }`}
                >
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    {isOpen && <span className="text-sm">Collapse</span>}
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200 mt-2 ${isOpen ? 'justify-start' : 'justify-center'
                        }`}
                >
                    <LogOut size={20} />
                    {isOpen && <span className="text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;