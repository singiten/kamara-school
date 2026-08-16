// src/components/chat/ChatWindow.tsx - SCROLLABLE FIX

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Check, CheckCheck, RefreshCw, ArrowDown } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import type { Message } from '../../context/ChatContext';

const ChatWindow: React.FC = () => {
    const {
        selectedUser,
        messages,
        sendMessage,
        isTyping,
        startTyping,
        stopTyping,
        refreshMessages,
        loading
    } = useChat();

    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserId: string = user?._id || '';

    // ✅ Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

            if (isAtBottom) {
                scrollToBottom();
            }
        }
    }, [messages]);

    // ✅ Check if user scrolled up
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setShowScrollButton(!isAtBottom);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false);
    };

    useEffect(() => {
        if (selectedUser) {
            inputRef.current?.focus();
            refreshMessages();
            setTimeout(scrollToBottom, 100);
        }
    }, [selectedUser]);

    const handleSend = (): void => {
        if (input.trim()) {
            sendMessage(input.trim());
            setInput('');
            stopTyping();
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setInput(e.target.value);
        if (e.target.value.trim()) {
            startTyping();
        } else {
            stopTyping();
        }
    };

    const handleRefresh = (): void => {
        setIsLoading(true);
        refreshMessages();
        setTimeout(() => {
            setIsLoading(false);
            scrollToBottom();
        }, 500);
    };

    const formatTime = (date: string): string => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getMessageStatus = (message: Message): React.ReactNode => {
        if (message.isRead) {
            return <CheckCheck size={14} className="text-blue-500" />;
        }
        return <Check size={14} className="text-gray-400" />;
    };

    if (!selectedUser) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle size={40} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">No conversation selected</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">Select a user to start chatting</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-medium shadow-md">
                            {selectedUser.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{selectedUser.name}</h3>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    selectedUser.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                                        selectedUser.role === 'parent' ? 'bg-green-100 text-green-700' :
                                            'bg-yellow-100 text-yellow-700'
                                }`}>
                                {selectedUser.role}
                            </span>
                            {isTyping && (
                                <span className="text-blue-500 flex items-center gap-1">
                                    <span className="animate-pulse">•••</span> typing...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
                    title="Refresh messages"
                >
                    <RefreshCw size={18} className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ✅ Messages - SCROLLABLE */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
                style={{ minHeight: '200px', maxHeight: '100%' }}
            >
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm">Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <MessageCircle size={40} className="mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Say hello to {selectedUser.name}</p>
                    </div>
                ) : (
                    messages.map((message: Message, index: number) => {
                        const isOwn = message.senderId._id === currentUserId;

                        return (
                            <div
                                key={message._id || index}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isOwn
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
                                        }`}>
                                        <span>{formatTime(message.createdAt)}</span>
                                        {isOwn && getMessageStatus(message)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ✅ Scroll to Bottom Button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-24 right-6 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition z-10"
                >
                    <ArrowDown size={18} />
                </button>
            )}

            {/* Input - Fixed at bottom */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={`Message ${selectedUser.name}...`}
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-blue-200"
                    >
                        <Send size={18} />
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;