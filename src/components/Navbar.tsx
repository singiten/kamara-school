// src/components/Navbar.tsx - COMPLETE WITH CHAT & NOTIFICATIONS

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Bell,
    Menu,
    LogOut,
    MessageCircle,
    User as UserIcon,
    Settings,
    ChevronDown,
    Check,
    X,
    Sun,
    Moon
} from "lucide-react";
import axios from "axios";
import { getSocket } from "../services/socket";
import { useTheme } from "../hooks/useTheme";

type Role = "admin" | "registrar" | "finance_officer" | "teacher" | "student" | "parent";

interface NavbarProps {
    role: Role;
    toggleSidebar: () => void;
}

interface Notification {
    _id: string;
    senderId: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    content: string;
    isRead: boolean;
    createdAt: string;
}

const roleInfo = {
    admin: {
        title: "Admin Dashboard",
        subtitle: "Manage students, teachers, and school operations",
        userName: "Admin User",
        userRole: "Administrator",
        chatPath: "/admin/chat",
    },
    registrar: {
        title: "Registrar Dashboard",
        subtitle: "Manage student enrollment, teachers, and class records",
        userName: "Registrar User",
        userRole: "Registrar",
        chatPath: "/registrar/chat",
    },
    finance_officer: {
        title: "Finance Dashboard",
        subtitle: "Manage school fees, payments, and financial reports",
        userName: "Finance Officer",
        userRole: "Finance Officer",
        chatPath: "/finance/chat",
    },
    teacher: {
        title: "Teacher Dashboard",
        subtitle: "Manage attendance, grades, and class activities",
        userName: "Teacher Samuel",
        userRole: "Teacher",
        chatPath: "/teacher/chat",
    },
    student: {
        title: "Student Dashboard",
        subtitle: "View grades, attendance, and announcements",
        userName: "Student User",
        userRole: "Student",
        chatPath: "/student/chat",
    },
    parent: {
        title: "Parent Dashboard",
        subtitle: "Monitor your children's progress",
        userName: "Parent User",
        userRole: "Parent",
        chatPath: "/parent/chat",
    },
};

const Navbar = ({ role, toggleSidebar }: NavbarProps) => {
    const navigate = useNavigate();
    const info = roleInfo[role];
    const { theme, toggleTheme } = useTheme();

    // User info from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const displayName = user?.name || info.userName;
    const displayRole = user?.role || info.userRole;

    // State
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
    const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // ============================================
    // 📡 FETCH UNREAD COUNT
    // ============================================

    const fetchUnreadCount = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<{ success: boolean; data: { unread: number } }>(
                'http://localhost:7000/api/messages/unread/count',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUnreadCount(response.data.data?.unread || 0);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    // ============================================
    // 📡 FETCH RECENT NOTIFICATIONS
    // ============================================

    const fetchNotifications = async (): Promise<void> => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get<{ success: boolean; data: Notification[] }>(
                'http://localhost:7000/api/messages/recent?limit=5',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotifications(response.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        }
    };

    // ============================================
    // 📌 MARK ALL AS READ
    // ============================================

    const markAllAsRead = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                'http://localhost:7000/api/messages/read-all',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUnreadCount(0);
            setNotifications([]);

            const socket = getSocket();
            if (socket) {
                socket.emit('message:read-all');
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    // ============================================
    // 📌 GO TO CHAT
    // ============================================

    const goToChat = (): void => {
        setShowNotificationDropdown(false);
        navigate(info.chatPath);
    };

    // ============================================
    // 📌 HANDLE LOGOUT
    // ============================================

    const handleLogout = (): void => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate("/");
    };

    // ============================================
    // 📌 FORMAT TIME
    // ============================================

    const formatTime = (date: string): string => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // ============================================
    // 📡 SOCKET LISTENERS
    // ============================================

    useEffect(() => {
        fetchUnreadCount();
        fetchNotifications();

        const socket = getSocket();
        if (socket) {
            socket.on('message:unread', (data: { count: number }) => {
                setUnreadCount(data.count);
                if (data.count > 0) {
                    fetchNotifications();
                }
            });

            socket.on('message:received', () => {
                fetchUnreadCount();
                fetchNotifications();
            });
        }

        // Poll every 30 seconds as fallback
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.off('message:unread');
                socket.off('message:received');
            }
        };
    }, []);

    // ============================================
    // 📌 GET ROLE COLOR
    // ============================================

    const getRoleColor = (role: string): string => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700',
            teacher: 'bg-blue-100 text-blue-700',
            parent: 'bg-green-100 text-green-700',
            student: 'bg-yellow-100 text-yellow-700',
            registrar: 'bg-indigo-100 text-indigo-700',
            finance_officer: 'bg-cyan-100 text-cyan-700',
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    const getRoleEmoji = (role: string): string => {
        const emojis: Record<string, string> = {
            admin: '👑',
            teacher: '👨‍🏫',
            parent: '👨‍👩‍👧',
            student: '🎓',
            registrar: '📋',
            finance_officer: '💰',
        };
        return emojis[role] || '👤';
    };

    // ============================================
    // 🎨 RENDER
    // ============================================

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* ============================================
                LEFT SECTION - Title & Hamburger
                ============================================ */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition md:hidden flex-shrink-0"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={22} className="text-gray-600 dark:text-gray-300" />
                </button>

                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">
                        {info.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block truncate">
                        {info.subtitle}
                    </p>
                </div>
            </div>

            {/* ============================================
                RIGHT SECTION - Actions & User
                ============================================ */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">

                {/* 🌙 Dark Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    aria-label="Toggle dark mode"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {theme === 'dark' ? (
                        <Sun size={20} className="text-yellow-400" />
                    ) : (
                        <Moon size={20} className="text-gray-600" />
                    )}
                </button>

                {/* 🔔 Chat Button */}
                <Link
                    to={info.chatPath}
                    className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    aria-label="Messages"
                >
                    <MessageCircle size={20} className="text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>

                {/* 🔔 Notifications Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotificationDropdown(!showNotificationDropdown);
                            if (!showNotificationDropdown) {
                                fetchNotifications();
                            }
                            setShowUserDropdown(false);
                        }}
                        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        aria-label="Notifications"
                    >
                        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotificationDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowNotificationDropdown(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                                    <div className="flex items-center gap-2">
                                        <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                            >
                                                <Check size={14} />
                                                Mark all read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowNotificationDropdown(false)}
                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                        >
                                            <X size={14} className="text-gray-400 dark:text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                {/* Notification List */}
                                <div className="max-h-80 overflow-y-auto">
                                    {loading ? (
                                        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                            <p className="text-sm">Loading...</p>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                            <Bell size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                            <p className="text-sm">No new notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif._id}
                                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 transition cursor-pointer flex items-start gap-3 ${!notif.isRead ? 'bg-blue-50 dark:bg-gray-700' : ''
                                                    }`}
                                                onClick={goToChat}
                                            >
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRoleColor(notif.senderId?.role || '')}`}>
                                                    {notif.senderId?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-800 dark:text-gray-100">
                                                        <span className="font-medium">{notif.senderId?.name || 'Unknown'}</span>
                                                        <span className="text-gray-600 dark:text-gray-300"> sent you a message</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {notif.content}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                                                        {formatTime(notif.createdAt)}
                                                    </p>
                                                </div>
                                                {!notif.isRead && (
                                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    <button
                                        onClick={goToChat}
                                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={16} />
                                        View All Messages
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 👤 User Profile Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowUserDropdown(!showUserDropdown);
                            setShowNotificationDropdown(false);
                        }}
                        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 transition"
                        aria-label="User menu"
                    >
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md bg-gradient-to-br from-blue-600 to-indigo-600`}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 hidden sm:block" />
                    </button>

                    {/* User Dropdown */}
                    {showUserDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowUserDropdown(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                                {/* User Info */}
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                                            {displayName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{displayName}</p>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">
                                                    {displayRole.replace('_', ' ')}
                                                </span>
                                                <span className="text-sm">{getRoleEmoji(role)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <Link
                                        to={`/${role}/profile`}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm text-gray-700 dark:text-gray-200"
                                        onClick={() => setShowUserDropdown(false)}
                                    >
                                        <UserIcon size={16} className="text-gray-400 dark:text-gray-500" />
                                        Profile
                                    </Link>
                                    <Link
                                        to={`/${role}/settings`}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm text-gray-700 dark:text-gray-200"
                                        onClick={() => setShowUserDropdown(false)}
                                    >
                                        <Settings size={16} className="text-gray-400 dark:text-gray-500" />
                                        Settings
                                    </Link>
                                    <Link
                                        to={`/${role}/chat`}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm text-gray-700 dark:text-gray-200"
                                        onClick={() => setShowUserDropdown(false)}
                                    >
                                        <MessageCircle size={16} className="text-gray-400 dark:text-gray-500" />
                                        Messages
                                        {unreadCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                    <button
                                        onClick={() => {
                                            setShowUserDropdown(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm text-red-600 dark:text-red-400 w-full"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;