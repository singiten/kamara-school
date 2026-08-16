// src/pages/Chat.tsx
import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { ChatProvider } from '../context/ChatContext';

const Chat: React.FC = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'student';

  return (
    <DashboardLayout role={role}>
      <div className="h-[calc(100vh-120px)]">
        <ChatProvider>
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full bg-white rounded-xl shadow-sm overflow-hidden relative">
            <ChatList />
            <ChatWindow />
          </div>
        </ChatProvider>
      </div>
    </DashboardLayout>
  );
};

export default Chat;