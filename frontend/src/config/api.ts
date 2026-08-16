// frontend/src/config/api.ts

import axios from 'axios';

// ✅ Simple and works everywhere
const API_URL = (() => {
    // In production (Render), use the deployed backend URL
    if (window.location.hostname === 'kamara-school-frontend.onrender.com') {
        return 'https://kamara-school-backend.onrender.com';
    }
    // In development, use localhost
    return 'http://localhost:7000';
})();

export { API_URL };

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default apiClient;