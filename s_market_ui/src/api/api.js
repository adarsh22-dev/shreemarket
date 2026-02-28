const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/api';

/**
 * Helper function to handle API responses.
 */
const handleResponse = async (response) => {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('user');
        window.location.replace('/');
        throw new Error('Session expired or unauthorized');
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
};

/**
 * Registers a new user.
 * @param {Object} userData - User registration data (fullName, email, phone, password, etc.)
 */
export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

/**
 * Authenticates a user.
 * @param {string} email 
 * @param {string} password 
 */
export const loginUser = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
};

/**
 * Authenticates a user via Google.
 * @param {string} token - Google credential token
 */
export const googleLogin = async (token) => {
    const response = await fetch(`${API_BASE_URL}/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token }),
    });
    return handleResponse(response);
};

/**
 * Requests a password reset link.
 * @param {string} email 
 */
export const forgotPassword = async (email) => {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
    });
    return handleResponse(response);
};

/**
 * Resets the user's password using a token.
 * @param {string} token 
 * @param {string} newPassword 
 */
export const resetPassword = async (token, newPassword) => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token, password: newPassword }),
    });
    return handleResponse(response);
};
/**
 * Logs out the user.
 */
export const logoutUser = async () => {
    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    return handleResponse(response);
};

/**
 * Fetches the list of vendors.
 * @param {string} search - Search term (optional)
 * @param {number} page - Page number (zero-indexed)
 * @param {number} size - Page size
 * @param {string} sortBy - Sort field
 * @param {string} sortDir - Sort direction (asc/desc)
 */
export const getVendors = async (search = '', page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc') => {
    const params = new URLSearchParams({
        page,
        size,
        sortBy,
        sortDir
    });
    if (search) {
        params.append('search', search);
    }

    const response = await fetch(`${API_BASE_URL}/vendors?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Add Authorization header if needed in future
        },
        credentials: 'include',
    });
    return handleResponse(response);
};

/**
 * Updates the status of a user/vendor.
 * @param {number} userId - The ID of the user
 * @param {string} status - New status (e.g., 'Active', 'Inactive')
 */
export const updateVendorStatus = async (userId, status) => {
    const response = await fetch(`${API_BASE_URL}/vendors/${userId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status })
    });
    return handleResponse(response);
};

/**
 * Registers a new vendor.
 * @param {Object} vendorData - Vendor registration data
 */
export const registerVendor = async (vendorData) => {
    const response = await fetch(`${API_BASE_URL}/register/vendor`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(vendorData),
    });
    return handleResponse(response);
};
