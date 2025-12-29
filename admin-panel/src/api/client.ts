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

// Add response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

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
