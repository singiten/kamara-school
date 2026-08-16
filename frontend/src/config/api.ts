// frontend/src/config/api.ts

import axios from 'axios';

// ✅ Get API URL from environment
const getApiUrl = (): string => {
    // Production (Render)
    if (window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
        return 'https://kamara-school-backend.onrender.com';
    }
    // Development
    return 'http://localhost:7000';
};

export const API_URL = getApiUrl();

// ✅ Create a configured axios instance
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ✅ Add token to every request automatically
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ✅ Handle response errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired - redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;