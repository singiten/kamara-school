import { useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import { Search, Send, Paperclip, Smile, MessageCircle } from "lucide-react";

type ChatRole = "admin" | "parent";

interface Conversation {
    id: number;
    name: string;
    lastMessage: string;
    unread: number;
    online: boolean;
}

interface Message {
    id: number;
    sender: "admin" | "parent";
    text: string;
    time: string;
}

interface ChatPageProps {
    role: ChatRole;
}

const ChatPage = ({ role }: ChatPageProps) => {
    const isAdmin = role === "admin";

    const conversations: Conversation[] = [
        {
            id: 1,
            name: isAdmin ? "Parents Committee" : "School Administration",
            lastMessage: isAdmin
                ? "Please review the attendance summary before the afternoon briefing."
                : "Please remember tomorrow's parent meeting.",
            unread: isAdmin ? 4 : 2,
            online: true,
        },
    ];

    const initialMessages: Message[] = [
        {
            id: 1,
            sender: "admin",
            text: isAdmin
                ? "Hello admin, you have new parent messages waiting."
                : "Hello! Welcome to the School Portal.",
            time: "09:00 AM",
        },
        {
            id: 2,
            sender: "parent",
            text: isAdmin ? "I’m reviewing the updates now." : "Thank you.",
            time: "09:02 AM",
        },
        {
            id: 3,
            sender: "admin",
            text: isAdmin
                ? "The parent meeting notes are ready for your review."
                : "Please remember tomorrow's parent meeting.",
            time: "09:05 AM",
        },
    ];

    const [selectedChat] = useState(conversations[0]);
    const [messages, setMessages] = useState(initialMessages);
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim()) return;

        const newMessage: Message = {
            id: messages.length + 1,
            sender: role,
            text: message,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        setMessages([...messages, newMessage]);
        setMessage("");
    };

    return (
        <DashboardLayout role={role}>
            <div className="h-[calc(100vh-110px)] flex flex-col lg:flex-row bg-white rounded-2xl shadow overflow-hidden">
                <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col">
                    <div className="p-5 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                        <div className="mt-4 relative">
                            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {conversations.map((chat) => (
                            <div
                                key={chat.id}
                                className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 p-4 transition"
                            >
                                <div className="flex justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-gray-800">{chat.name}</h3>
                                        <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        {chat.online && <span className="text-green-500 text-xs">● Online</span>}
                                        {chat.unread > 0 && (
                                            <div className="mt-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs ml-auto">
                                                {chat.unread}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="border-b border-gray-200 p-5 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-lg text-gray-800">{selectedChat.name}</h2>
                            <p className="text-green-500 text-sm">Online</p>
                        </div>
                        <MessageCircle className="text-blue-600" size={28} />
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === role ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === role
                                        ? "bg-blue-700 text-white rounded-br-md"
                                        : "bg-white border border-gray-200 rounded-bl-md"
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <p className={`text-xs mt-2 ${msg.sender === role ? "text-blue-100" : "text-gray-400"}`}>
                                        {msg.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <button className="text-gray-500 hover:text-blue-600 transition" type="button">
                                <Paperclip size={22} />
                            </button>
                            <button className="text-gray-500 hover:text-yellow-500 transition" type="button">
                                <Smile size={22} />
                            </button>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSend();
                                    }
                                }}
                                className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSend}
                                type="button"
                                className="bg-blue-700 hover:bg-blue-800 text-white p-3 rounded-full transition"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ChatPage;
