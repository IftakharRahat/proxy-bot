import axios from 'axios';

// Configure Axios instance
// TODO: Use environment variable for API URL in production
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL,
});

// Add request interceptor to include token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// User API
export const getUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
};

// Proxy API
export const getActiveSessions = async () => {
    const response = await api.get('/admin/proxies');
    // Map backend response to match frontend expectation if needed
    // or return directly if structure aligns
    return response.data;
};
