import { API_BASE_URL, BACKEND_URL, parseJsonResponse } from './shared';

export { BACKEND_URL };

const handleClientResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user");
      window.location.replace("/login");
    }
    throw new Error("Session expired or unauthorized");
  }
  return parseJsonResponse(response);
};

async function clientFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return handleClientResponse(response);
}

async function clientFetchFormData(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
  });
  return handleClientResponse(response);
}

// --- AUTH ---
export const registerUser = async (userData) => {
  return clientFetch('/register', { method: 'POST', body: JSON.stringify(userData) });
};

export const loginUser = async (email, password, isVendorLogin = false) => {
  return clientFetch('/login', { method: 'POST', body: JSON.stringify({ email, password, isVendorLogin }) });
};

export const googleLogin = async (token, isVendorLogin = false) => {
  return clientFetch('/google', { method: 'POST', body: JSON.stringify({ token, isVendorLogin }) });
};

export const forgotPassword = async (email) => {
  return clientFetch('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
};

export const resetPassword = async (token, newPassword) => {
  return clientFetch('/reset-password', { method: 'POST', body: JSON.stringify({ token, password: newPassword }) });
};

export const logoutUser = async () => {
  return clientFetch('/logout', { method: 'POST' });
};

// --- USERS ---
export const getUserDetails = async (userId) => {
  return clientFetch(`/users/${userId}`);
};

export const updateUserDetails = async (userId, userData) => {
  return clientFetch(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
};

export const updateUserPassword = async (userId, passwordData) => {
  return clientFetch(`/users/${userId}/password`, { method: 'PUT', body: JSON.stringify(passwordData) });
};

export const deleteUser = async (userId, password) => {
  return clientFetch(`/users/${userId}`, { method: 'DELETE', body: JSON.stringify({ password }) });
};

// --- VENDOR ---
export const getVendorById = async (vendorId) => {
  return clientFetch(`/vendors/${vendorId}`);
};

export const registerVendor = async (vendorData) => {
  return clientFetch('/register/vendor', { method: 'POST', body: JSON.stringify(vendorData) });
};

export const updateVendorPassword = async (vendorId, passwordData) => {
  return clientFetch(`/vendors/${vendorId}/password`, { method: 'PUT', body: JSON.stringify(passwordData) });
};

export const deleteVendor = async (vendorId, password) => {
  return clientFetch(`/vendors/${vendorId}`, { method: 'DELETE', body: JSON.stringify({ password }) });
};

// --- PRODUCTS (client-side) ---
export const getAllProducts = async () => {
  return clientFetch('/products');
};

export const searchProducts = async (query) => {
  return clientFetch(`/products/search?q=${encodeURIComponent(query)}`);
};

export const getProduct = async (productId) => {
  return clientFetch(`/products/single/${productId}`);
};

export const getCategories = async () => {
  return clientFetch('/admin/categories');
};

// --- ADDRESSES ---
export const fetchUserAddresses = async (userId) => {
  return clientFetch(`/addresses/user/${userId}`);
};

export const addUserAddress = async (addressData) => {
  return clientFetch('/addresses', { method: 'POST', body: JSON.stringify(addressData) });
};

export const updateUserAddress = async (addressId, userId, addressData) => {
  return clientFetch(`/addresses/${addressId}/user/${userId}`, { method: 'PUT', body: JSON.stringify(addressData) });
};

export const deleteUserAddress = async (addressId, userId) => {
  const response = await fetch(`${API_BASE_URL}/addresses/${addressId}/user/${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (response.status === 204) return null;
  return handleClientResponse(response);
};

export const setAddressAsDefault = async (addressId, userId) => {
  return clientFetch(`/addresses/${addressId}/default/user/${userId}`, { method: 'PATCH' });
};

// --- ORDERS ---
export const fetchUserOrders = async (userId) => {
  return clientFetch(`/orders/user/${userId}`);
};

export const createOrder = async (orderData) => {
  return clientFetch('/orders', { method: 'POST', body: JSON.stringify(orderData) });
};

export const createMockOrder = async (userId) => {
  return clientFetch(`/orders/mock/${userId}`, { method: 'POST' });
};

export const submitReturnAPI = async (orderId, formData) => {
  return clientFetchFormData(`/orders/${orderId}/return`, { method: 'POST', body: formData });
};

// --- REVIEWS ---
export const getProductReviews = async (productId) => {
  return clientFetch(`/reviews/product/${productId}`);
};

export const getUserReviews = async (userId) => {
  return clientFetch(`/reviews/user/${userId}`);
};

export const submitProductReview = async (reviewData) => {
  const isFormData = reviewData instanceof FormData;
  if (isFormData) {
    return clientFetchFormData('/reviews', { method: 'POST', body: reviewData });
  }
  return clientFetch('/reviews', { method: 'POST', body: JSON.stringify(reviewData) });
};

// --- CART ---
export const fetchUserCart = async (userId) => {
  return clientFetch(`/cart/${userId}`);
};

export const addToUserCart = async (userId, itemData) => {
  return clientFetch(`/cart/${userId}/add`, { method: 'POST', body: JSON.stringify(itemData) });
};

export const updateUserCartItem = async (userId, itemId, quantity) => {
  return clientFetch(`/cart/${userId}/update/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
};

export const removeUserCartItem = async (userId, itemId) => {
  return clientFetch(`/cart/${userId}/remove/${itemId}`, { method: 'DELETE' });
};

export const clearUserCart = async (userId) => {
  return clientFetch(`/cart/${userId}/clear`, { method: 'DELETE' });
};

export const mergeUserCart = async (userId, items) => {
  return clientFetch(`/cart/${userId}/merge`, { method: 'POST', body: JSON.stringify(items) });
};

export const moveToSavedAPI = async (userId, itemId) => {
  return clientFetch(`/cart/${userId}/save/${itemId}`, { method: 'PUT' });
};

export const moveToCartFromSavedAPI = async (userId, itemId) => {
  return clientFetch(`/cart/${userId}/move-to-cart/${itemId}`, { method: 'PUT' });
};

// --- WISHLIST ---
export const fetchUserWishlist = async (userId) => {
  return clientFetch(`/wishlist/${userId}`);
};

export const addToUserWishlist = async (userId, productId) => {
  return clientFetch(`/wishlist/${userId}/add/${productId}`, { method: 'POST' });
};

export const removeUserWishlist = async (userId, productId) => {
  return clientFetch(`/wishlist/${userId}/remove/${productId}`, { method: 'DELETE' });
};

export const checkInWishlist = async (userId, productId) => {
  return clientFetch(`/wishlist/${userId}/check/${productId}`);
};

// --- DEVICES ---
export const getUserDevices = async (userId, roleId) => {
  return clientFetch(`/devices/${userId}/${roleId}`);
};

export const logoutDevice = async (deviceId, userId, roleId) => {
  return clientFetch(`/devices/${deviceId}?userId=${userId}&roleId=${roleId}`, { method: 'DELETE' });
};

// --- VENDOR REGISTRATION (used by RegisterPage) ---
export const uploadStoreLogo = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return clientFetchFormData('/upload/logo', { method: 'POST', body: formData });
};

export const saveStoreDetails = async (vendorId, formData) => {
  return clientFetchFormData(`/vendors/${vendorId}/store-details`, { method: 'PUT', body: formData });
};

// --- SETTINGS ---
export const getPlatformSettings = async () => {
  return clientFetch('/settings');
};

// --- WOOAI ---
export const createWooAIChatSession = async (userId, userName, intent) => {
  return clientFetch('/wooai/session', { 
    method: 'POST', 
    body: JSON.stringify({ userId, userName, intent }) 
  });
};

export const getWooAIChatSession = async (sessionId) => {
  return clientFetch(`/wooai/session/${sessionId}`);
};

export const addWooAIMessage = async (sessionId, content, role) => {
  return clientFetch(`/wooai/session/${sessionId}/message`, { 
    method: 'POST', 
    body: JSON.stringify({ content, role }) 
  });
};

export const updateWooAISessionStatus = async (sessionId, status) => {
  return clientFetch(`/wooai/session/${sessionId}/status`, { 
    method: 'PUT', 
    body: JSON.stringify({ status }) 
  });
};

export const updateWooAISessionAgent = async (sessionId, agent) => {
  return clientFetch(`/wooai/session/${sessionId}/agent`, { 
    method: 'PUT', 
    body: JSON.stringify({ agent }) 
  });
};

export const endWooAISession = async (sessionId) => {
  return clientFetch(`/wooai/session/${sessionId}/end`, { 
    method: 'PUT' 
  });
};

export const getWooAIAnalytics = async () => {
  return clientFetch('/wooai/analytics/total-chats-today');
};

export const getWooAIAnalyticsWeek = async () => {
  return clientFetch('/wooai/analytics/total-chats-week');
};

export const getWooAIAnalyticsMonth = async () => {
  return clientFetch('/wooai/analytics/total-chats-month');
};

export const getWooAIResolutionRate = async () => {
  return clientFetch('/wooai/analytics/ai-resolution-rate');
};

export const getWooAIPendingCallbacks = async () => {
  return clientFetch('/wooai/analytics/pending-callbacks');
};

export const getWooAIAverageResponseTime = async () => {
  return clientFetch('/wooai/analytics/average-response-time');
};

export const getWooAIActiveAgents = async () => {
  return clientFetch('/wooai/analytics/active-agents');
};

export const getWooAIEscalations = async () => {
  return clientFetch('/wooai/analytics/escalations');
};

export const getWooAITopIntents = async () => {
  return clientFetch('/wooai/analytics/top-intents');
};

export const searchWooAIProducts = async (query) => {
  return clientFetch(`/wooai/search-products?q=${encodeURIComponent(query)}`);
};

// --- CONTACT ---
export const submitContact = async (contactData) => {
  return clientFetch('/contact', { method: 'POST', body: JSON.stringify(contactData) });
};
