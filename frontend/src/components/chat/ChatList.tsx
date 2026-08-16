// src/components/chat/ChatList.tsx - FIXED: Per-user unread count

import React, { useState, useEffect } from 'react';
import { Search, Users, MessageCircle, Bell } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import type { User } from '../../context/ChatContext';
import axios from 'axios';

interface UnreadCounts {
    [userId: string]: number;
}

const ChatList: React.FC = () => {
    const { users, selectedUser, setSelectedUser, onlineUsers, loading } = useChat();
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});

    // ✅ Fetch unread counts per user
    const fetchUnreadCounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<{ success: boolean; data: { unreadCounts: UnreadCounts } }>(
                'http://localhost:7000/api/messages/unread/per-user',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUnreadCounts(response.data.data?.unreadCounts || {});
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCounts();

        // ✅ Listen for unread count updates
        const socket = (window as any).socket;
        if (socket) {
            socket.on('message:unread', (data: { count: number; userId?: string }) => {
                const userId = data.userId;
                if (userId) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [userId]: data.count
                    }));
                } else {
                    fetchUnreadCounts();
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('message:unread');
            }
        };
    }, []);

    const getRoleColor = (role: string): string => {
        const colors: Record<string, string> = {
            admin: 'bg-purple-100 text-purple-700',
            teacher: 'bg-blue-100 text-blue-700',
            parent: 'bg-green-100 text-green-700',
            student: 'bg-yellow-100 text-yellow-700',
        };
        return colors[role] || 'bg-gray-100 text-gray-700';
    };

    const filteredUsers: User[] = users.filter((user: User) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="border-r border-gray-200 dark:border-gray-700 h-full bg-gray-50 dark:bg-gray-900 p-4">
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="border-r border-gray-200 dark:border-gray-700 h-full flex flex-col bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <MessageCircle size={20} className="text-blue-600" />
                        Messages
                    </h2>
                    {/* Show total unread count */}
                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                        <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-medium animate-pulse flex items-center gap-1.5">
                            <Bell size={14} />
                            {Object.values(unreadCounts).reduce((a, b) => a + b, 0)} new
                        </span>
                    )}
                </div>
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-gray-100"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                        <Users size={40} className="mb-3" />
                        <p className="text-sm">No users available to chat</p>
                    </div>
                ) : (
                    filteredUsers.map((user: User) => {
                        const isOnline = onlineUsers.includes(user._id);
                        const isSelected = selectedUser?._id === user._id;
                        const unreadForUser = unreadCounts[user._id] || 0;

                        return (
                            <button
                                key={user._id}
                                onClick={() => setSelectedUser(user)}
                                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border-b border-gray-100 dark:border-gray-700 ${isSelected ? 'bg-blue-50 dark:bg-gray-700 border-l-4 border-l-blue-500' : ''
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${getRoleColor(user.role)}`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    {isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800 dark:text-gray-100 truncate">
                                            {user.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                        {isOnline && (
                                            <span className="text-xs text-green-600 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                Online
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ✅ Per-User Unread Badge */}
                                {unreadForUser > 0 && (
                                    <span className="flex-shrink-0 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-medium animate-pulse">
                                        {unreadForUser > 9 ? '9+' : unreadForUser}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                        <Users size={14} />
                        {users.length} users
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {onlineUsers.length} online
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChatList;
