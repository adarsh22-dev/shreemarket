const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8082/api";

export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');

/**
 * Helper function to handle API responses.
 */
const handleResponse = async (response) => {
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("user");
        window.location.replace("/");
        throw new Error("Session expired or unauthorized");
    }

    // Check if the response has content before trying to parse it as JSON
    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        if (text) {
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("JSON parsing error:", e, "Source text:", text);
                throw new Error("Invalid server response format");
            }
        }
    }

    if (!response.ok) {
        throw new Error((data && data.error) || data?.message || `HTTP Error ${response.status}`);
    }
    return data;
};

/**
 * Registers a new user.
 * @param {Object} userData - User registration data (fullName, email, phone, password, etc.)
 */
export const registerUser = async (userData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

/**
 * Authenticates a user.
 * @param {string} email
 * @param {string} password
 * @param {boolean} isVendorLogin
 */
export const loginUser = async (email, password, isVendorLogin = false) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password, isVendorLogin }),
    });
    return handleResponse(response);
};

/**
 * Authenticates a user via Google.
 * @param {string} token - Google credential token
 * @param {boolean} isVendorLogin
 */
export const googleLogin = async (token, isVendorLogin = false) => {
    const response = await fetch(`${API_BASE_URL}/google`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token, isVendorLogin }),
    });
    return handleResponse(response);
};

/**
 * Requests a password reset link.
 * @param {string} email
 */
export const forgotPassword = async (email) => {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
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
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token, password: newPassword }),
    });
    return handleResponse(response);
};
/**
 * Logs out the user.
 */
export const logoutUser = async () => {
    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
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
export const getVendors = async (
    search = "",
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "desc",
) => {
    const params = new URLSearchParams({
        page,
        size,
        sortBy,
        sortDir,
    });
    if (search) {
        params.append("search", search);
    }

    const response = await fetch(`${API_BASE_URL}/vendors?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            // Add Authorization header if needed in future
        },
        credentials: "include",
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
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};

/**
 * Registers a new vendor.
 * @param {Object} vendorData - Vendor registration data
 */
export const registerVendor = async (vendorData) => {
    const response = await fetch(`${API_BASE_URL}/register/vendor`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(vendorData),
    });
    return handleResponse(response);
};

/**
 * Fetches vendor details by vendorId.
 * @param {number|string} vendorId
 */
export const getVendorById = async (vendorId) => {
    const response = await fetch(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Uploads a store logo file.
 * @param {File} file - The logo file to upload
 */
export const uploadStoreLogo = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload/logo`, {
        method: "POST",
        credentials: "include",
        body: formData, // the browser sets correct multipart/form-data headers
    });
    return handleResponse(response);
};
/**
 * Saves or updates vendor store details including logo upload.
 * @param {number} vendorId - Vendor ID
 * @param {FormData} formData - FormData object containing store details and logo
 */
export const saveStoreDetails = async (vendorId, formData) => {
    const response = await fetch(
        `${API_BASE_URL}/vendors/${vendorId}/store-details`,
        {
            method: "PUT",
            credentials: "include",
            body: formData, // the browser will automatically set the correct Content-Type (multipart/form-data with boundary)
        },
    );
    return handleResponse(response);
};
/**
 * Fetches all products.
 */
export const getAllProducts = async () => {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Searches for products by name.
 * @param {string} query - Search query
 */
export const searchProducts = async (query) => {
    const response = await fetch(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches products for a specific vendor.
 * @param {number} vendorId - Vendor ID
 * @param {Object} query - Query parameters (search, category, status, page, size, sort, etc.)
 */
export const getVendorProducts = async (vendorId, queryParams) => {
    const params = new URLSearchParams(queryParams);
    const response = await fetch(
        `${API_BASE_URL}/products/vendor/${vendorId}?${params.toString()}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        },
    );
    return handleResponse(response);
};
/**
 * Adds a new product.
 * @param {FormData} formData - FormData object containing product details and media
 */
export const addProduct = async (formData) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

/**
 * Deletes a product by ID.
 * @param {number} productId - Product ID
 */
export const deleteProduct = async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches a single product by ID.
 * @param {number} productId - Product ID
 */
export const getProduct = async (productId) => {
    const response = await fetch(`${API_BASE_URL}/products/single/${productId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates an existing product.
 * @param {number} productId - Product ID
 * @param {FormData} formData - FormData containing modified product details and media
 */
export const updateProduct = async (productId, formData) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

/**
 * Fetches user details by userId.
 * @param {number|string} userId - The ID of the user
 */
export const getUserDetails = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            // Add Authorization header if needed in future
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates user details by userId.
 * @param {number|string} userId - The ID of the user
 * @param {Object} userData - User data to update (fullName, email, phone)
 */
export const updateUserDetails = async (userId, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            // Add Authorization header if needed in future
        },
        credentials: "include",
        body: JSON.stringify(userData),
    });
    return handleResponse(response);
};

// --- ADDRESS API METHODS ---

/**
 * Fetches all addresses for a specific user.
 * @param {number|string} userId
 */
export const fetchUserAddresses = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/addresses/user/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Adds a new address for a specific user.
 * @param {Object} addressData
 */
export const addUserAddress = async (addressData) => {
    const response = await fetch(`${API_BASE_URL}/addresses`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(addressData),
    });
    return handleResponse(response);
};

/**
 * Updates an existing address.
 * @param {number|string} addressId
 * @param {number|string} userId
 * @param {Object} addressData
 */
export const updateUserAddress = async (addressId, userId, addressData) => {
    const response = await fetch(
        `${API_BASE_URL}/addresses/${addressId}/user/${userId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(addressData),
        },
    );
    return handleResponse(response);
};

/**
 * Deletes an address.
 * @param {number|string} addressId
 * @param {number|string} userId
 */
export const deleteUserAddress = async (addressId, userId) => {
    const response = await fetch(
        `${API_BASE_URL}/addresses/${addressId}/user/${userId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        },
    );
    // For 204 No Content, don't try to parse JSON
    if (response.status === 204) return null;
    return handleResponse(response);
};

/**
 * Sets an address as the default for a user.
 * @param {number|string} addressId
 * @param {number|string} userId
 */
export const setAddressAsDefault = async (addressId, userId) => {
    const response = await fetch(
        `${API_BASE_URL}/addresses/${addressId}/default/user/${userId}`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        },
    );
    return handleResponse(response);
};

// --- ORDERS API METHODS ---

/**
 * Fetches all orders for a specific vendor.
 * @param {number|string} vendorId
 */
export const fetchVendorOrders = async (vendorId) => {
    const response = await fetch(`${API_BASE_URL}/orders/vendor/${vendorId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates the status of a specific order.
 * @param {number|string} orderId
 * @param {string} status
 */
export const updateOrderStatus = async (orderId, status) => {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status })
    });
    return handleResponse(response);
};

/**
 * Fetches all orders for a specific user.
 * @param {number|string} userId
 */
export const fetchUserOrders = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Creates a new order.
 * @param {Object} orderData
 */
export const createOrder = async (orderData) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(orderData),
    });
    return handleResponse(response);
};

/**
 * Creates mock orders for a specific user to easily populate the UI.
 * @param {number|string} userId
 */
export const createMockOrder = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/orders/mock/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

// --- REVIEWS API METHODS ---

/**
 * Fetches all reviews for a specific product.
 * @param {number|string} productId
 */
export const getProductReviews = async (productId) => {
    const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Submits a new review for a product.
 * @param {Object} reviewData - { productId, reviewerName, rating, title, text }
 */
export const submitProductReview = async (reviewData) => {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
};
