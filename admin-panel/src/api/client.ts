import axios from 'axios';

// Configure Axios instance
// TODO: Use environment variable for API URL in production
export const api = axios.create({
    baseURL: 'http://localhost:3000',
    // withCredentials: true, // simplified for local dev, enable if using cookies/sessions
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
