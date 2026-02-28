import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    const user = JSON.parse(userStr);

    if (allowedRoles && !allowedRoles.includes(user.roleId)) {
        // Redirect unauthorized users to the home page
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
