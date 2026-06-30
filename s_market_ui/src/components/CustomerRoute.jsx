import { Navigate, useSearchParams } from 'react-router-dom';

const CustomerRoute = ({ children }) => {
    const [searchParams] = useSearchParams();
    const userStr = localStorage.getItem('user');

    if (searchParams.get('preview') === '1' || searchParams.get('preview') === 'true') {
        return children;
    }

    if (userStr) {
        let user;
        try {
            user = JSON.parse(userStr);
        } catch {
            return children;
        }
        if (user.roleId === 1) {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (user.roleId === 3) {
            return <Navigate to="/vendor/dashboard" replace />;
        }
    }

    return children;
};

export default CustomerRoute;
