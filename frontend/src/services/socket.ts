// frontend/src/services/socket.ts

import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config/api';

let socket: Socket | null = null;

export const initializeSocket = (): Socket | null => {
    const token = localStorage.getItem('token');
    const apiUrl = API_URL;

    if (!token) {
        console.error('❌ No token found, cannot connect to socket');
        return null;
    }

    if (socket && socket.connected) {
        console.log('ℹ️ Socket already connected');
        return socket;
    }

    socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket'],
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected!');
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
    });

    return socket;
};

// ✅ EXPORT getSocket
export const getSocket = (): Socket | null => {
    if (!socket || !socket.connected) {
        return initializeSocket();
    }
    return socket;
};

export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket disconnected manually');
    }
};