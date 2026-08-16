// src/pages/admin/AdminChat.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Shield } from 'lucide-react';
import DashboardLayout from '../../layout/DashboardLayout';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import { ChatProvider } from '../../context/ChatContext';
import { getSocket } from '../../services/socket';

const AdminChat: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const socket = getSocket();
        if (socket) {
            console.log('✅ Admin chat socket connected');
        }
        return () => {
            console.log('🔌 Admin chat socket disconnected');
        };
    }, []);

    const goBack = (): void => {
        navigate('/admin');
    };

    return (
        <DashboardLayout role="admin">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={goBack}
                            className="p-2 rounded-lg hover:bg-gray-100 transition"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <MessageCircle size={22} className="text-blue-600" />
                                Messages
                            </h1>
                            <p className="text-sm text-gray-500">Chat with all users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl border border-purple-200">
                        <Shield size={16} className="text-purple-600" />
                        <span className="text-sm text-purple-700 font-medium">Admin Access</span>
                    </div>
                </div>

                <div className="h-[calc(100vh-200px)]">
                    <ChatProvider>
                        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] h-full bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                            <ChatList />
                            <ChatWindow />
                        </div>
                    </ChatProvider>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminChat;