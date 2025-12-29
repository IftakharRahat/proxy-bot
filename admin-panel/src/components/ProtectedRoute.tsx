import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    // Simple check for token existence. 
    // In a real app, you might want to decode/validate it or check expiry.
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
