// src/context/ChatContext.tsx - COMPLETE FIXED

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { getSocket } from '../services/socket';
import axios from 'axios';
import { Socket } from 'socket.io-client';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

export interface Message {
    _id: string;
    senderId: User;
    receiverId: User;
    content: string;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}

interface ChatContextType {
    users: User[];
    selectedUser: User | null;
    messages: Message[];
    unreadCounts: Record<string, number>;
    unreadCount: number;
    setUnreadCounts: (counts: Record<string, number>) => void;

    onlineUsers: string[];
    setSelectedUser: (user: User) => void;
    sendMessage: (content: string) => void;
    markAsRead: (senderId: string) => void;
    markAllAsRead: () => void;
    loading: boolean;
    error: string;
    isTyping: boolean;
    startTyping: () => void;
    stopTyping: () => void;
    refreshMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const isMounted = useRef<boolean>(true);

    // ============================================
    // 📡 INITIALIZE SOCKET
    // ============================================

    useEffect(() => {
        isMounted.current = true;
        
        const socket = getSocket();
        socketRef.current = socket;

        if (socket) {
            // Listen for new messages
            socket.on('message:received', (message: Message) => {
                if (!isMounted.current) return;
                
                console.log('📥 Message received:', message);
                
                if (selectedUser && message.senderId._id === selectedUser._id) {
                    setMessages((prev) => [...prev, message]);
                }
                fetchUnreadCount();
            });

            socket.on('message:sent', (message: Message) => {
                if (!isMounted.current) return;
                
                console.log('📤 Message sent:', message);
                
                if (selectedUser && message.receiverId._id === selectedUser._id) {
                    setMessages((prev) => [...prev, message]);
                }
            });

            // Listen for unread count updates
            socket.on('message:unread', (data: { count: number; userId?: string }) => {
    if (data.userId) {
        setUnreadCounts(prev => ({
            ...prev,
            [data.userId]: data.count
        }));
    }
    // Also update total unread count
    fetchUnreadCount();
});

            // Listen for online users
            socket.on('users:online', (usersList: string[]) => {
                if (!isMounted.current) return;
                setOnlineUsers(usersList);
            });

            // Listen for typing indicators
            socket.on('typing:start', (data: { userId: string }) => {
                if (!isMounted.current) return;
                if (selectedUser && data.userId === selectedUser._id) {
                    setIsTyping(true);
                }
            });

            socket.on('typing:stop', () => {
                if (!isMounted.current) return;
                setIsTyping(false);
            });

            // Listen for read receipts
            socket.on('message:read', (data: { userId: string }) => {
                if (!isMounted.current) return;
                if (selectedUser && data.userId === selectedUser._id) {
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.senderId._id === selectedUser._id
                                ? { ...msg, isRead: true }
                                : msg
                        )
                    );
                }
            });
        }

        fetchUsers();
        fetchUnreadCount();

        return () => {
            isMounted.current = false;
            if (socket) {
                socket.off('message:received');
                socket.off('message:sent');
                socket.off('message:unread');
                socket.off('users:online');
                socket.off('typing:start');
                socket.off('typing:stop');
                socket.off('message:read');
            }
        };
    }, []);

    // ============================================
    // 📡 FETCH MESSAGES WHEN USER SELECTED
    // ============================================

    useEffect(() => {
        if (selectedUser) {
            refreshMessages();
        }
    }, [selectedUser]);

    // ============================================
    // 📡 API CALLS
    // ============================================

    const fetchUsers = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<{ success: boolean; data: User[] }>(
                'http://localhost:7000/api/messages/users/available',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (isMounted.current) {
                setUsers(response.data.data || []);
                setLoading(false);
            }
        } catch (error: any) {
            console.error('Error fetching users:', error);
            if (isMounted.current) {
                setError(error.response?.data?.error || 'Failed to load users');
                setLoading(false);
            }
        }
    };

    const refreshMessages = async (): Promise<void> => {
        if (!selectedUser) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<{ success: boolean; data: Message[] }>(
                `http://localhost:7000/api/messages/${selectedUser._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (isMounted.current) {
                setMessages(response.data.data || []);
                // After fetching, mark as read
                markAsRead(selectedUser._id);
            }
        } catch (error: any) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchUnreadCount = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<{ success: boolean; data: { unread: number } }>(
                'http://localhost:7000/api/messages/unread/count',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (isMounted.current) {
                setUnreadCount(response.data.data?.unread || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // ============================================
    // 📨 CHAT ACTIONS
    // ============================================

    const sendMessage = (content: string): void => {
        if (!selectedUser || !content.trim()) return;

        const socket = socketRef.current;
        if (socket) {
            console.log('📤 Sending message to:', selectedUser._id, 'content:', content);
            socket.emit('message:send', {
                receiverId: selectedUser._id,
                content: content.trim(),
            });
        }
    };

    const markAsRead = async (senderId: string): Promise<void> => {
        const socket = socketRef.current;
        if (socket) {
            socket.emit('message:read', { senderId });
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                'http://localhost:7000/api/messages/read-all',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (isMounted.current) {
                setUnreadCount(0);
            }

            const socket = socketRef.current;
            if (socket) {
                socket.emit('message:read-all');
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const startTyping = (): void => {
        const socket = socketRef.current;
        if (socket && selectedUser) {
            socket.emit('typing:start', { receiverId: selectedUser._id });
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping();
            }, 3000);
        }
    };

    const stopTyping = (): void => {
        const socket = socketRef.current;
        if (socket && selectedUser) {
            socket.emit('typing:stop', { receiverId: selectedUser._id });
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    };

    // ============================================
    // 📤 CONTEXT PROVIDER
    // ============================================

    return (
        <ChatContext.Provider
            value={{
                users,
                selectedUser,
                messages,
                unreadCounts,
                unreadCount,
                setUnreadCounts,
                onlineUsers,
                setSelectedUser,
                sendMessage,
                markAsRead,
                markAllAsRead,
                loading,
                error,
                isTyping,
                startTyping,
                stopTyping,
                refreshMessages,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};