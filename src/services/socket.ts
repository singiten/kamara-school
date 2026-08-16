// src/services/socket.ts

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (): Socket | null => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No token found, cannot connect to socket');
    return null;
  }

  if (socket && socket.connected) {
    console.log('ℹ️ Socket already connected');
    return socket;
  }

  socket = io('http://localhost:7000', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected!');
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected');
  });

  socket.on('connect_error', (error: Error) => {
    console.error('❌ Socket connection error:', error);
  });

  return socket;
};

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