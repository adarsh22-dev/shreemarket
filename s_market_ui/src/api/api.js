const DEBUG = import.meta.env.VITE_DEBUG === 'true' || false;
export const log = (label, ...args) => {
    if (DEBUG) console.log(`[${label}]`, ...args);
};
export const logError = (label, ...args) => {
    console.error(`[${label}]`, ...args);
};

export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ? import.meta.env.VITE_API_BASE_URL : "http://localhost:8082/api";

export const BACKEND_URL = API_BASE_URL.replace(/\/api$/, '');

/** Local placeholder image (inline SVG, works offline) */
export const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23f1f5f9' width='400' height='400'/%3E%3Cpath fill='%2394a3b8' d='M200 140c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm60 100l-60-50-60 50v30h120v-30z' transform='translate(0,10)'/%3E%3Ctext fill='%2394a3b8' font-family='sans-serif' font-size='16' x='200' y='290' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

/** Placeholder for failed image loads (checks current src to avoid loop) */
export const PLACEHOLDER_FAILED = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect fill='%23fef2f2' width='400' height='400'/%3E%3Cpath fill='%23ef4444' d='M200 140c-22 0-40 18-40 40s18 40 40 40 40-18 40-40-18-40-40-40zm60 100l-60-50-60 50v30h120v-30z' transform='translate(0,10)'/%3E%3Ctext fill='%23ef4444' font-family='sans-serif' font-size='14' x='200' y='290' text-anchor='middle'%3ELoad Failed%3C/text%3E%3C/svg%3E";

/** Helper: check if a file name is valid (not null, undefined, or the literal strings "null" / "undefined") */
export const isValidFileName = (name) => name && name !== 'null' && name !== 'undefined';

export const handleImageError = (e) => { e.target.src = PLACEHOLDER_FAILED; e.target.onerror = null; };

/**
 * Build a safe product image URL, returning null for invalid file names.
 */
export const getProductImageUrl = (fileName) => {
  if (!isValidFileName(fileName)) return null;
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName;
  return `${BACKEND_URL}/uploads/products/${fileName}`;
};

/**
 * Get the primary gallery image URL from a product's media array,
 * filtering out "manufacturer" type images.
 * Returns null if no gallery image is found.
 */
export const getGalleryImageUrl = (product, index = 0) => {
  if (!product?.media) return null;
  const gallery = product.media.filter(m => m.mediaType !== 'manufacturer' && isValidFileName(m.fileName));
  if (gallery.length <= index) return null;
  return getProductImageUrl(gallery[index].fileName);
};

/**
 * Get the primary (first non-manufacturer) image, preferring isPrimary.
 */
export const getPrimaryGalleryImage = (product) => {
  if (!product?.media) return null;
  const gallery = product.media.filter(m => m.mediaType !== 'manufacturer' && isValidFileName(m.fileName));
  if (gallery.length === 0) return null;
  const primary = gallery.find(m => m.isPrimary) || gallery[0];
  return getProductImageUrl(primary.fileName);
};

/**
 * Wrapper around fetch that aborts after 30 seconds.
 */
const fetchWithTimeout = (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  options.signal = controller.signal;
  return fetch(url, options).finally(() => clearTimeout(id));
};

/**
 * Helper function to handle API responses.
 */
const handleResponse = async (response) => {
    if (response.status === 401 || response.status === 403) {
        const url = response.url || 'unknown';
        logError('AUTH_REDIRECT', `${response.status} on ${url}`, { status: response.status, url });
        localStorage.removeItem("user");
        localStorage.removeItem("rememberedEmail");
        window.location.href = '/login';
        throw new Error("Session expired or unauthorized");
    }

    if (response.status >= 400) {
        logError('API_ERROR', `${response.status} on ${response.url}`);
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
        throw new Error(data?.message || (data && data.error) || `HTTP Error ${response.status}`);
    }
    return data;
};

/**
 * Registers a new user.
 * @param {Object} userData - User registration data (fullName, email, phone, password, etc.)
 */
export const registerUser = async (userData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/register`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/login`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/google`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/forgot-password`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/reset-password`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/logout`, {
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

    const response = await fetchWithTimeout(`${API_BASE_URL}/vendors?${params.toString()}`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendors/${userId}/status`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/register/vendor`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

export const registerWholesaler = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/register/wholesaler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const loginWholesaler = async (email, password) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/login/wholesaler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
};

export const getWholesalerDashboard = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesaler/dashboard`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getWholesalerOrders = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesaler/orders`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getWholesaleProducts = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/wholesale${query ? '?' + query : ''}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getWholesalerSettings = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesaler/settings`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const updateWholesalerSettings = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesaler/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const submitBulkInquiry = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesaler/orders/bulk-inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

/**
 * Updates vendor details.
 * @param {number} vendorId
 * @param {Object} vendorData - Updated vendor fields
 */
export const updateVendor = async (vendorId, vendorData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(vendorData),
    });
    return handleResponse(response);
};

/**
 * Fetches vendor KYC records.
 */
export const getVendorKyc = async (search) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/kyc${params}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates a vendor KYC record.
 */
export const updateVendorKyc = async (kycData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/kyc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(kycData),
    });
    return handleResponse(response);
};

/**
 * Fetches commission categories.
 */
export const getCommissionCategories = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/commission-categories`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Creates or updates a commission category.
 */
export const saveCommissionCategory = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/commission-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

/**
 * Updates a commission category by id.
 */
export const updateCommissionCategory = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/commission-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

/**
 * Deletes a commission category.
 */
export const deleteCommissionCategory = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/commission-categories/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches tier definitions.
 */
export const getTiers = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/tiers`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates a tier definition.
 */
export const updateTier = async (tierData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/tiers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(tierData),
    });
    return handleResponse(response);
};

export const createTier = async (tierData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(tierData),
    });
    return handleResponse(response);
};

export const deleteTier = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/tiers/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Recalculates tiers for all vendors based on sales and rating thresholds.
 */
export const recalculateAllTiers = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/tiers/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches payout records.
 */
export const getPayouts = async (status, search) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const qs = params.toString();
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/payouts${qs ? '?' + qs : ''}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Safe response handler that does NOT redirect to login on 401/403.
 * Lets the component handle auth errors gracefully instead.
 */
const handleResponseSafe = async (response) => {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
        }
        return data;
    }
    const text = await response.text();
    if (!response.ok) {
        throw new Error(text || `Request failed with status ${response.status}`);
    }
    return text;
};

/**
 * Fetches payout records for the authenticated vendor.
 */
export const getVendorOwnPayouts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/payouts`, {
        method: "GET", credentials: "include",
    });
    return handleResponseSafe(response);
};

/** Safe vendor shipping API functions (no redirect on 401/403) */
export const getVendorShipmentsListSafe = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/shipments`, {
        method: "GET", credentials: "include",
    });
    return handleResponseSafe(response);
};

export const getVendorShippingLabelsSafe = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/labels`, {
        method: "GET", credentials: "include",
    });
    return handleResponseSafe(response);
};

export const getShippingCarriersSafe = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/carriers`, {
        method: "GET", credentials: "include",
    });
    return handleResponseSafe(response);
};

export const createVendorShipmentSafe = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/shipments/create`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponseSafe(response);
};

export const generateShippingLabelSafe = async (labelId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/labels/${labelId}/generate`, {
        method: "POST", credentials: "include",
    });
    return handleResponseSafe(response);
};

export const schedulePickupSafe = async (labelId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/labels/${labelId}/pickup`, {
        method: "POST", credentials: "include",
    });
    return handleResponseSafe(response);
};

export const trackVendorShipmentSafe = async (awbNumber) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/track/${awbNumber}`, {
        method: "GET", credentials: "include",
    });
    return handleResponseSafe(response);
};

/**
 * Updates a payout record.
 */
export const updatePayout = async (payoutData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/payouts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payoutData),
    });
    return handleResponse(response);
};

/**
 * Creates a new payout/withdrawal request.
 * @param {Object} payoutData - Payout request data
 */
export const createPayout = async (payoutData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payoutData),
    });
    return handleResponse(response);
};

/**
 * Fetches eligible delivered orders (90+ days old) for vendor withdrawal.
 */
export const getVendorEligibleOrders = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/eligible-orders`, {
        method: "GET", credentials: "include",
    });
    return handleResponseSafe(response);
};

/**
 * Submits a vendor withdrawal request for selected orders.
 * @param {number[]} orderIds - Array of order IDs
 */
export const submitVendorWithdrawalRequest = async (orderIds) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/withdrawal-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderIds }),
    });
    return handleResponseSafe(response);
};

/**
 * Fetches onboarding steps.
 */
export const getOnboardingSteps = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/onboarding-steps`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Creates a new onboarding step.
 */
export const createOnboardingStep = async (stepData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/onboarding-steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(stepData),
    });
    return handleResponse(response);
};

/**
 * Fetches vendor performance records.
 */
export const getVendorPerformance = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/performance`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates a vendor performance record.
 */
export const updateVendorPerformance = async (perfData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/performance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(perfData),
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

    const response = await fetchWithTimeout(`${API_BASE_URL}/upload/logo`, {
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
export const saveStoreSettings = async (settings) => {
    const response = await fetchWithTimeout(
        `${API_BASE_URL}/vendor/store-settings`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ settings }),
        },
    );
    return handleResponse(response);
};

export const getStoreSettings = async () => {
    const response = await fetchWithTimeout(
        `${API_BASE_URL}/vendor/store-settings`,
        {
            method: "GET",
            credentials: "include",
        },
    );
    return handleResponse(response);
};

export const getVendorProfile = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/profile`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};
/**
 * Fetches featured products from the backend — products with isFeatured=true,
 * filtered to only those with valid images, meaningful price, and in stock,
 * limited to 4 in a randomized order.
 */
export const getFeaturedProducts = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/products/featured`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });
        // Gracefully handle 401/403 — this is a public endpoint, don't logout user
        if (response.status === 401 || response.status === 403) {
            console.warn("Unauthorized access to featured products endpoint, returning empty array");
            return [];
        }
        const products = await handleResponse(response);
        return Array.isArray(products) ? products.filter(isValidProduct) : [];
    } catch (error) {
        console.warn("Failed to fetch featured products, using empty array:", error);
        return [];
    }
};

/**
 * Check if a product has a valid image, meaningful price (≥ ₹1), and is in stock.
 */
export const isValidProduct = (p) => {
  if (!p) return false;
  const hasImage = p.media && p.media.length > 0 && p.media.some(m => isValidFileName(m.fileName));
  const hasPrice = (p.regularPrice && p.regularPrice >= 1) || (p.discountPrice && p.discountPrice >= 1);
  const inStock = p.status !== 'out' && (p.initialStock === null || p.initialStock === undefined || p.initialStock > 0);
  return hasImage && hasPrice && inStock;
};

/**
 * Fetches all products (filters out invalid ones for customer-facing display).
 */
export const getAllProducts = async (category) => {
    try {
        const url = category
            ? `${API_BASE_URL}/products?category=${encodeURIComponent(category)}`
            : `${API_BASE_URL}/products`;
        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        });
        
        // For public homepage access, don't redirect on 401/403 - return empty array instead
        if (response.status === 401 || response.status === 403) {
            console.warn("Unauthorized access to products endpoint, returning empty array for homepage");
            return [];
        }
        
        const products = await handleResponse(response);
        // Filter out invalid products for customer-facing display
        if (Array.isArray(products)) {
            return products.filter(isValidProduct);
        }
        return products;
    } catch (error) {
        // If there's a network error or other issue, return empty array for fallback
        console.warn("Failed to fetch products, using empty array:", error);
        return [];
    }
};

/**
 * Searches for products by name.
 * @param {string} query - Search query
 */
export const searchProducts = async (query) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}`, {
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
    const response = await fetchWithTimeout(
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
export const uploadManufacturerMedia = async (productId, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append("manufacturerMedia", file));
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/manufacturer-media`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

export const addProduct = async (formData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Deletes multiple products by their IDs.
 * @param {Array<number>} productIds - Array of product IDs to delete
 */
export const deleteProductsBulk = async (productIds) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/bulk`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(productIds),
    });
    return handleResponse(response);
};

/**
 * Updates stock of multiple products by their IDs.
 * @param {Array<number>} productIds - Array of product IDs to update
 * @param {number} stock - New stock value
 */
export const updateProductsStockBulk = async (productIds, stock) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/bulk/stock?stock=${stock}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(productIds),
    });
    return handleResponse(response);
};

/**
 * Bulk edit multiple products - partial update of specified fields.
 * @param {Array<number>} productIds - Array of product IDs to update
 * @param {Object} fields - Object with field names and new values
 */
export const bulkEditProducts = async (productIds, fields) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/bulk-edit`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ ids: productIds, fields }),
    });
    return handleResponse(response);
};

/**
 * Uploads products in bulk via CSV file.
 * @param {File} file - CSV file
 * @param {number|string} vendorId - Vendor ID
 */
export const bulkUploadProducts = async (file, vendorId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", vendorId);

    const response = await fetchWithTimeout(`${API_BASE_URL}/products/bulk-upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

/**
 * Fetches a single product by ID.
 * @param {number} productId - Product ID
 */
export const getProduct = async (productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/single/${productId}`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}`, {
        method: "POST",
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/${userId}`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/${userId}`, {
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

/**
 * Updates user password.
 * @param {number|string} userId
 * @param {Object} passwordData - {currentPassword, newPassword}
 */
export const updateUserPassword = async (userId, passwordData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/${userId}/password`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
};

/**
 * Updates vendor password.
 * @param {number|string} vendorId
 * @param {Object} passwordData - {currentPassword, newPassword}
 */
export const updateVendorPassword = async (vendorId, passwordData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendors/${vendorId}/password`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
};

/**
 * Deletes a user account.
 * @param {number|string} userId
 * @param {string} password
 */
export const deleteUser = async (userId, password) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
    });
    return handleResponse(response);
};

/**
 * Deletes a vendor account.
 * @param {number|string} vendorId
 * @param {string} password
 */
export const deleteVendor = async (vendorId, password) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendors/${vendorId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password }),
    });
    return handleResponse(response);
};

// --- ADDRESS API METHODS ---

/**
 * Fetches all addresses for a specific user.
 * @param {number|string} userId
 */
export const fetchUserAddresses = async (userId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/addresses/user/${userId}`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/addresses`, {
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
    const response = await fetchWithTimeout(
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
    const response = await fetchWithTimeout(
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
    const response = await fetchWithTimeout(
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/vendor/${vendorId}`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/${orderId}/status`, {
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
 * Bulk updates the status of multiple orders.
 * @param {number[]} orderIds - Array of order IDs
 * @param {string} status - Target status (e.g., "ACCEPTED", "SHIPPED", "DELIVERED")
 */
export const bulkUpdateOrderStatus = async (orderIds, status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/bulk-status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ orderIds, status })
    });
    return handleResponse(response);
};

/**
 * Cancels an order by the customer (only allowed for PROCESSING orders).
 * @param {number|string} orderId
 */
export const cancelOrder = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Submits a return request for an order.
 * @param {number|string} orderId
 * @param {FormData} formData
 */
export const submitReturnAPI = async (orderId, formData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/${orderId}/return`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

/* ── Vendor Invoice API ── */
export const getVendorInvoices = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/invoices`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const downloadVendorInvoice = (orderId) => {
    window.open(`${API_BASE_URL}/vendor/orders/${orderId}/invoice`, '_blank');
};

/* ── Customer Loyalty API ── */
export const getMyLoyalty = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loyalty/me`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getLoyaltyTransactions = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loyalty/transactions`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const calculateLoyaltyDiscount = async (points) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loyalty/calculate-discount`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ points }),
    });
    return handleResponse(response);
};

export const redeemLoyaltyPoints = async (points, orderNumber) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loyalty/redeem`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ points, orderNumber }),
    });
    return handleResponse(response);
};

export const earnLoyaltyPoints = async (points, reason, reference) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/loyalty/earn`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ points, reason, reference }),
    });
    return handleResponse(response);
};

/* ── Product Q&A ── */
export const getProductQuestions = async (productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/questions`, {
        method: "GET", credentials: "include"
    });
    return handleResponse(response);
};
export const askProductQuestion = async (productId, question, customerName) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/questions`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ question, customerName }),
    });
    return handleResponse(response);
};

/* ── Invoice Download ── */
export const downloadOrderInvoice = (orderId) => {
    window.open(`${API_BASE_URL}/orders/${orderId}/invoice`, '_blank');
};

/**
 * Fetches all orders for a specific user.
 * @param {number|string} userId
 */
export const fetchUserOrders = async (userId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/user/${userId}`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/mock/${userId}`, {
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
    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews/product/${productId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches all reviews by a user.
 * @param {number|string} userId
 */
export const getUserReviews = async (userId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews/user/${userId}`, {
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
 * @param {Object|FormData} reviewData - Review data or FormData if images are included
 */
export const submitProductReview = async (reviewData) => {
    const isFormData = reviewData instanceof FormData;

    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: isFormData ? {} : {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: isFormData ? reviewData : JSON.stringify(reviewData),
    });
    return handleResponse(response);
};

/**
 * Fetches reviews for a specific vendor with filtering and pagination.
 * @param {number|string} vendorId
 * @param {Object} queryParams - Filters (rating, status, search, page, size, sortBy, sortDir)
 */
export const getVendorReviews = async (vendorId, queryParams) => {
    const params = new URLSearchParams();
    Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
            params.append(key, queryParams[key]);
        }
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews/vendor/${vendorId}?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

/**
 * Fetches review statistics for a specific vendor.
 * @param {number|string} vendorId
 */
export const getVendorReviewStats = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews/vendor/${vendorId}/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

/**
 * Submits a vendor reply to a review.
 * @param {number|string} reviewId
 * @param {string} replyText
 */
export const replyToReview = async (reviewId, replyText) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reply: replyText })
    });
    return handleResponse(response);
};

// --- VENDOR STAFF API METHODS ---

/**
 * Fetches vendor staff by vendorId
 * @param {number|string} vendorId
 */
export const getVendorStaffByVendorId = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-staff/vendor/${vendorId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

/**
 * Creates a new vendor staff
 * @param {Object} staffData
 */
export const createVendorStaff = async (staffData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(staffData)
    });
    return handleResponse(response);
};

/**
 * Updates a vendor staff
 * @param {number|string} staffId
 * @param {Object} staffData
 */
export const updateVendorStaff = async (staffId, staffData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(staffData)
    });
    return handleResponse(response);
};

/**
 * Deletes a vendor staff
 * @param {number|string} staffId
 */
export const deleteVendorStaff = async (staffId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-staff/${staffId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    if (response.status === 204) return null;
    return handleResponse(response);
};

/**
 * Fetches analytics data for a specific vendor.
 * @param {number|string} vendorId
 */
export const getVendorAnalytics = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/analytics/vendor/${vendorId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

/**
 * Fetches enriched customer demographics for a vendor, including location,
 * device breakdown, and customer insights.
 * @param {number|string} vendorId
 */
export const getVendorDemographics = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/analytics/vendor/${vendorId}/demographics`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

/**
 * Fetches detailed product-level analytics for a single product.
 * @param {number|string} vendorId
 * @param {number|string} productId
 */
export const getVendorProductAnalytics = async (vendorId, productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/analytics/vendor/${vendorId}/products/${productId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

// --- NOTIFICATIONS API METHODS ---

/**
 * Fetches notifications for a specific vendor.
 * @param {number|string} vendorId
 * @param {string} type - Optional filter type (ORDER, PAYMENT, DELIVERY, PLATFORM)
 */
export const fetchVendorNotifications = async (vendorId, type = "All") => {
    const url = type === "All"
        ? `${API_BASE_URL}/notifications/vendor/${vendorId}`
        : `${API_BASE_URL}/notifications/vendor/${vendorId}?type=${type}`;
    const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

/**
 * Marks a single notification as read.
 * @param {number|string} id
 */
export const markNotificationAsRead = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

/**
 * Marks all notifications as read for a vendor.
 * @param {number|string} vendorId
 */
export const markAllNotificationsAsRead = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/notifications/vendor/${vendorId}/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
    });
    return handleResponse(response);
};

// --- DEVICE MANAGEMENT API METHODS ---

/**
 * Fetch all active devices for a user.
 * @param {number|string} userId 
 * @param {number|string} roleId 
 * @returns {Promise<Array>} Array of device objects
 */
export const getUserDevices = async (userId, roleId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/devices/${userId}/${roleId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Log out a specific device session.
 * @param {number|string} deviceId 
 * @param {number|string} userId 
 * @param {number|string} roleId 
 */
export const logoutDevice = async (deviceId, userId, roleId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/devices/${deviceId}?userId=${userId}&roleId=${roleId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
    });
    return handleResponse(response);
};

// --- CART API METHODS ---

/**
 * Fetches the cart for a user.
 * @param {number|string} userId
 */
export const fetchUserCart = async (userId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Adds an item to the user's cart.
 * @param {number|string} userId
 * @param {Object} itemData - {productId, quantity, variant}
 */
export const addToUserCart = async (userId, itemData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(itemData),
    });
    return handleResponse(response);
};

/**
 * Updates the quantity of a cart item.
 * @param {number|string} userId
 * @param {number|string} itemId - The ID of the CartItem
 * @param {number} quantity
 */
export const updateUserCartItem = async (userId, itemId, quantity) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}/update/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
    });
    return handleResponse(response);
};

/**
 * Removes an item from the cart.
 * @param {number|string} userId
 * @param {number|string} itemId - The ID of the CartItem
 */
export const removeUserCartItem = async (userId, itemId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}/remove/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Clears all items in the user's cart.
 * @param {number|string} userId
 */
export const clearUserCart = async (userId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}/clear`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Merges a list of guest cart items into the user's cart.
 * @param {number|string} userId
 * @param {Array} items - Array of itemData objects
 */
export const mergeUserCart = async (userId, items) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(items),
    });
    return handleResponse(response);
};

/**
 * Moves a cart item to the saved for later list.
 * @param {number|string} userId
 * @param {number|string} itemId
 */
export const moveToSavedAPI = async (userId, itemId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}/save/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Moves a saved item back to the cart.
 * @param {number|string} userId
 * @param {number|string} itemId
 */
export const moveToCartFromSavedAPI = async (userId, itemId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cart/${userId}/move-to-cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// --- WISHLIST API METHODS ---

/**
 * Fetches the wishlist for a user.
 * @param {number|string} userId
 */
export const fetchUserWishlist = async (userId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wishlist/${userId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Adds a product to the user's wishlist.
 * @param {number|string} userId
 * @param {number|string} productId
 */
export const addToUserWishlist = async (userId, productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wishlist/${userId}/add/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Removes a product from the user's wishlist.
 * @param {number|string} userId
 * @param {number|string} productId
 */
export const removeUserWishlist = async (userId, productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wishlist/${userId}/remove/${productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Checks if a product is in the user's wishlist.
 * @param {number|string} userId
 * @param {number|string} productId
 */
export const checkInWishlist = async (userId, productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wishlist/${userId}/check/${productId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// --- ADMIN API METHODS ---

/**
 * Fetches admin dashboard statistics.
 */
export const getAdminDashboardStats = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/dashboard`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches all orders for admin with pagination and filtering.
 */
export const getAdminOrders = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/orders?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches all customers for admin with pagination and filtering.
 */
export const getAdminCustomers = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customers?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates a customer's status.
 */
export const updateCustomerStatus = async (customerId, status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customers/${customerId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};

/**
 * Fetches all products for admin with pagination and filtering.
 */
export const getAdminProducts = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/products?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates a product's status (approve/reject/flag).
 */
export const updateProductStatus = async (productId, status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/products/${productId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};

/**
 * Fetches all reviews for admin with pagination.
 */
export const getAdminReviews = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/reviews?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Deletes a review (admin).
 */
export const deleteAdminReview = async (reviewId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ── TESTIMONIALS API METHODS ──

/**
 * Fetches active testimonials for public display (homepage).
 */
export const getActiveTestimonials = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/testimonials/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches all testimonials for admin management.
 */
export const getAdminTestimonials = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/testimonials`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Adds a new testimonial from an existing review.
 * @param {number} reviewId
 */
export const addTestimonial = async (reviewId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/testimonials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reviewId }),
    });
    return handleResponse(response);
};

/**
 * Toggles testimonial active status.
 * @param {number} id
 */
export const toggleTestimonial = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/testimonials/${id}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Updates testimonial sort order.
 * @param {number} id
 * @param {number} sortOrder
 */
export const updateTestimonialOrder = async (id, sortOrder) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/testimonials/${id}/sort-order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sortOrder }),
    });
    return handleResponse(response);
};

/**
 * Deletes a testimonial.
 * @param {number} id
 */
export const deleteTestimonial = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/testimonials/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ── HOMEPAGE SECTIONS API ──

export const getHomepageSections = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/homepage-sections?_=${Date.now()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
    });
    if (response.status === 401) return [];
    return handleResponse(response);
};

export const getAdminHomepageSections = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/homepage-sections`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createHomepageSection = async (section) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/homepage-sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(section),
    });
    return handleResponse(response);
};

export const updateHomepageSection = async (id, section) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/homepage-sections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(section),
    });
    return handleResponse(response);
};

export const deleteHomepageSection = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/homepage-sections/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const saveAllHomepageSections = async (sections) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/homepage-sections/batch`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(sections),
    });
    return handleResponse(response);
};

// ── Category Image Upload ──

export const uploadCategoryImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetchWithTimeout(`${API_BASE_URL}/upload/category-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

// ── Category Management ──

export const getCategories = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });
        
        // For public homepage access, don't redirect on 401 - return empty array instead
        if (response.status === 401) {
            return [];
        }
        
        return handleResponse(response);
    } catch (error) {
        // If there's a network error or other issue, return empty array for fallback
        console.warn("Failed to fetch categories, using empty array:", error);
        return [];
    }
};

export const createCategory = async (category) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(category),
    });
    return handleResponse(response);
};

export const updateCategory = async (id, category) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(category),
    });
    return handleResponse(response);
};

export const deleteCategory = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getSubCategories = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories/subcategories`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createSubCategory = async (categoryId, subCategory) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories/${categoryId}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(subCategory),
    });
    return handleResponse(response);
};

export const updateSubCategory = async (id, categoryId, subCategory) => {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories/subcategories/${id}${params}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(subCategory),
    });
    return handleResponse(response);
};

export const deleteProductMedia = async (productId, mediaId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/media/${mediaId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const addProductInstagramUrl = async (productId, url) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/instagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url }),
    });
    return handleResponse(response);
};

export const updateProductMedia = async (mediaId, url) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/media/${mediaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url }),
    });
    return handleResponse(response);
};

export const uploadCustomThumbnail = async (mediaId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetchWithTimeout(`${API_BASE_URL}/instagram/media/${mediaId}/thumbnail`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

export const deleteSubCategory = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/categories/subcategories/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ── Platform Settings ──
export const getPlatformSettings = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/settings`, {
            credentials: "include",
        });
        
        // For public homepage access, don't redirect on 401 - return empty object instead
        if (response.status === 401) {
            return {};
        }
        
        return handleResponse(response);
    } catch (error) {
        // If there's a network error or other issue, return empty object for fallback
        console.warn("Failed to fetch platform settings, using empty object:", error);
        return {};
    }
};

export const updatePlatformSettings = async (settings) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
    });
    return handleResponse(response);
};

// ── Admin Audit Logs ──
export const getAuditLogs = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/audit-logs?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// --- WOOAI API METHODS ---

/**
 * Create a new WooAI chat session
 * @param {number} userId - The ID of the user
 * @param {string} userName - The name of the user
 * @param {string} intent - The intent of the chat
 */
export const createWooAIChatSession = async (userId, userName, intent) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, userName, intent }),
    });
    return handleResponse(response);
};

/**
 * Get a WooAI chat session by ID
 * @param {number} sessionId - The ID of the chat session
 */
export const getWooAIChatSession = async (sessionId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/session/${sessionId}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Add a message to a WooAI chat session
 * @param {number} sessionId - The ID of the chat session
 * @param {string} content - The message content
 * @param {string} role - The role (USER or BOT)
 */
export const addWooAIMessage = async (sessionId, content, role) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, role }),
    });
    return handleResponse(response);
};

/**
 * Update the status of a WooAI chat session
 * @param {number} sessionId - The ID of the chat session
 * @param {string} status - The new status
 */
export const updateWooAISessionStatus = async (sessionId, status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/session/${sessionId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};

/**
 * Update the agent of a WooAI chat session
 * @param {number} sessionId - The ID of the chat session
 * @param {string} agent - The new agent
 */
export const updateWooAISessionAgent = async (sessionId, agent) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/session/${sessionId}/agent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ agent }),
    });
    return handleResponse(response);
};

/**
 * End a WooAI chat session
 * @param {number} sessionId - The ID of the chat session
 */
export const endWooAISession = async (sessionId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/session/${sessionId}/end`, {
        method: "PUT",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Delete a WooAI chat session
 * @param {number} sessionId - The ID of the chat session
 */
export const deleteWooAIChatSession = async (sessionId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/session/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - total chats today
 */
export const getWooAIAnalyticsToday = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/total-chats-today`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - total chats this week
 */
export const getWooAIAnalyticsWeek = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/total-chats-week`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - total chats this month
 */
export const getWooAIAnalyticsMonth = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/total-chats-month`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - AI resolution rate
 */
export const getWooAIResolutionRate = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/ai-resolution-rate`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - pending callbacks count
 */
export const getWooAIPendingCallbacks = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/pending-callbacks`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - average response time
 */
export const getWooAIAverageResponseTime = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/average-response-time`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - active agents count
 */
export const getWooAIActiveAgents = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/active-agents`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - escalations count
 */
export const getWooAIEscalations = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/escalations`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Get WooAI analytics - top intents
 */
export const getWooAITopIntents = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/analytics/top-intents`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Chat Sessions Search ═══════════════

export const getWooAISessions = async (limit = 50) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/sessions?limit=${limit}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const searchWooAIChatSessions = async (query) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/sessions/search?query=${encodeURIComponent(query)}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Agents ═══════════════

export const getWooAIAgents = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/agents`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getWooAIAgent = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/agents/${id}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const createWooAIAgent = async (agent) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(agent),
    });
    return handleResponse(response);
};

export const updateWooAIAgent = async (id, agent) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(agent),
    });
    return handleResponse(response);
};

export const deleteWooAIAgent = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/agents/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Routing Rules ═══════════════

export const getWooAIRoutingRules = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/routing-rules`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const createWooAIRoutingRule = async (rule) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/routing-rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rule),
    });
    return handleResponse(response);
};

export const updateWooAIRoutingRule = async (id, rule) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/routing-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rule),
    });
    return handleResponse(response);
};

export const deleteWooAIRoutingRule = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/routing-rules/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Product Assignments ═══════════════

export const getWooAIProductAssignments = async (sectionKey) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/product-assignments/${sectionKey}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const addWooAIProductAssignment = async (assignment) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/product-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(assignment),
    });
    return handleResponse(response);
};

export const removeWooAIProductAssignment = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/product-assignments/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

export const removeWooAIProductAssignmentByKey = async (sectionKey, productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/product-assignments/${sectionKey}/${productId}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Policies ═══════════════

export const getWooAIPolicies = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/policies`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getWooAIPolicy = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/policies/${id}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const createWooAIPolicy = async (policy) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(policy),
    });
    return handleResponse(response);
};

export const updateWooAIPolicy = async (id, policy) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/policies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(policy),
    });
    return handleResponse(response);
};

export const deleteWooAIPolicy = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/policies/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Quick Actions ═══════════════

export const getWooAIQuickActions = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/quick-actions`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const createWooAIQuickAction = async (action) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/quick-actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(action),
    });
    return handleResponse(response);
};

export const updateWooAIQuickAction = async (id, action) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/quick-actions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(action),
    });
    return handleResponse(response);
};

export const deleteWooAIQuickAction = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/quick-actions/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

export const incrementWooAIQuickActionClick = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/quick-actions/${id}/click`, {
        method: "POST",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Callbacks ═══════════════

export const getWooAICallbacks = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/callbacks`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getWooAICallback = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/callbacks/${id}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const createWooAICallback = async (callback) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/callbacks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(callback),
    });
    return handleResponse(response);
};

export const updateWooAICallback = async (id, callback) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/callbacks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(callback),
    });
    return handleResponse(response);
};

export const deleteWooAICallback = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/callbacks/${id}`, {
        method: "DELETE",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getWooAICallbackCounts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/callbacks/counts`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ WooAI Settings ═══════════════

export const getWooAISettings = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/settings`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const saveWooAISettings = async (settings) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
    });
    return handleResponse(response);
};

export const resetWooAISettings = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wooai/settings/reset`, {
        method: "POST",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Contact ═══════════════

export const submitContact = async (contactData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(contactData),
    });
    return handleResponse(response);
};

export const getContacts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/contact`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const getContactCount = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/contact/count`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Order Tracking (public) ═══════════════

export const trackOrderByNumber = async (orderNumber) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/track/${encodeURIComponent(orderNumber)}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

export const lookupOrderById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/orders/lookup/${id}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Delivery Partners API ═══════════════

export const getDeliveryPartners = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/delivery-partners`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getDeliveryPartnerById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/delivery-partners/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createDeliveryPartner = async (partner) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/delivery-partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(partner),
    });
    return handleResponse(response);
};

export const updateDeliveryPartner = async (id, partner) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/delivery-partners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(partner),
    });
    return handleResponse(response);
};

export const deleteDeliveryPartner = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/delivery-partners/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Tax Rate API ═══════════════

export const getTaxRates = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-rates`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveTaxRates = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-rates/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getTaxRateById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-rates/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createTaxRate = async (taxRate) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(taxRate),
    });
    return handleResponse(response);
};

export const updateTaxRate = async (id, taxRate) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-rates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(taxRate),
    });
    return handleResponse(response);
};

export const toggleTaxRateStatus = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-rates/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveTaxRatesPublic = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/tax-rates/public`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
};

export const deleteTaxRate = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-rates/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Currency API ═══════════════

export const getCurrencies = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/currencies`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveCurrencies = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/currencies/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getCurrencyById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/currencies/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createCurrency = async (currency) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/currencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currency),
    });
    return handleResponse(response);
};

export const updateCurrency = async (id, currency) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/currencies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(currency),
    });
    return handleResponse(response);
};

export const toggleCurrencyStatus = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/currencies/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const deleteCurrency = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/currencies/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getPublicCurrencies = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/currencies/public`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
};

export const getDefaultCurrency = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/currencies/public/default`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
};

export const convertCurrency = async (amount, from, to) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/currencies/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, from, to }),
    });
    return handleResponse(response);
};

// ═══════════════ GST Invoice API ═══════════════

export const getGSTInvoices = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gst-invoices`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getGSTInvoicesByStatus = async (status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gst-invoices/status/${status}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createGSTInvoice = async (invoice) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gst-invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(invoice),
    });
    return handleResponse(response);
};

export const updateGSTInvoice = async (id, invoice) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gst-invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(invoice),
    });
    return handleResponse(response);
};

export const updateGSTInvoiceStatus = async (id, status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gst-invoices/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};

export const deleteGSTInvoice = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gst-invoices/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ── Vendor Activities ──
export const getVendorActivities = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/activities?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getSingleVendorActivities = async (vendorId, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/vendors/${vendorId}/activities?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ── Product Approval Status ──
export const updateProductApprovalStatus = async (productId, approvalStatus) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/products/${productId}/approval-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ approvalStatus }),
    });
    return handleResponse(response);
};

// ═══════════════ Ticket API ═══════════════

export const getTickets = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tickets?${searchParams.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getTicketsByRole = async (role, params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tickets/role/${role}?${searchParams.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorTickets = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/tickets`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getTicketById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tickets/${id}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const createTicket = async (ticket) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tickets`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(ticket),
    });
    return handleResponse(response);
};

export const updateTicketStatus = async (id, status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tickets/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
};

export const updateTicket = async (id, ticket) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tickets/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(ticket),
    });
    return handleResponse(response);
};

export const deleteTicket = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tickets/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Payout Schedule API ═══════════════

export const getPayoutSchedules = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const qs = searchParams.toString();
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-schedules${qs ? '?' + qs : ''}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const createPayoutSchedule = async (schedule) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-schedules`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(schedule),
    });
    return handleResponse(response);
};

export const updatePayoutSchedule = async (id, schedule) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-schedules/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(schedule),
    });
    return handleResponse(response);
};

export const deletePayoutSchedule = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-schedules/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Razorpay Payment Gateway API ═══════════════

/**
 * Creates a Razorpay order by calling the backend.
 * @param {Object} params - { amount (in paise), currency, receipt, notes }
 */
export const createRazorpayOrder = async (params) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
    });
    return handleResponse(response);
};

/**
 * Verifies the Razorpay payment signature on the backend.
 * @param {Object} paymentData - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyRazorpayPayment = async (paymentData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
};

/**
 * Gets the Razorpay key ID for frontend initialization.
 */
export const getRazorpayConfig = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment/config`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Fetches payment details by Razorpay payment ID.
 * @param {string} paymentId
 */
export const getRazorpayPaymentDetails = async (paymentId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment/payment/${paymentId}`, {
        method: "GET",
        credentials: "include",
    });
    return handleResponse(response);
};

/**
 * Loads the Razorpay checkout script dynamically.
 * Returns a promise that resolves when the script is loaded.
 */
export const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve(window.Razorpay);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(window.Razorpay);
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
    });
};

// ═══════════════ Payment Gateway Log API ═══════════════

export const getPaymentGatewayLogs = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payment-gateway-logs?${searchParams.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/* ─── CMS / Marketing API ─── */

export const getBlogPosts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/blog-posts`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createBlogPost = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/blog-posts`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateBlogPost = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/blog-posts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteBlogPost = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/blog-posts/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getCmsPages = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/pages`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createCmsPage = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/pages`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateCmsPage = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/pages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteCmsPage = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/pages/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getFaqs = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/faqs`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createFaq = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/faqs`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateFaq = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/faqs/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteFaq = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/faqs/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getCoupons = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/coupons`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createCoupon = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/coupons`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateCoupon = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/coupons/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteCoupon = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/coupons/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

/* ── Vendor Coupons ── */
export const getVendorCoupons = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/coupons`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createVendorCoupon = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/coupons`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateVendorCoupon = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/coupons/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteVendorCoupon = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/coupons/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

/* ── Vendor Return Management ── */
export const getVendorReturns = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const approveVendorReturn = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/approve`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};
export const rejectVendorReturn = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/reject`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};
export const processVendorReturn = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/process`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};
export const refundVendorReturn = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/refund`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};
export const approveVendorReplacement = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/replacement/approve`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};
export const rejectVendorReplacement = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/replacement/reject`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};
export const shipVendorReplacement = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/replacement/ship`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};
export const completeVendorReplacement = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/returns/${orderId}/replacement/complete`, { method: "POST", credentials: "include" });
    return handleResponse(response);
};




/* ── Vendor Inventory History API ── */
export const getVendorInventoryMovements = async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== null && val !== undefined && val !== '') searchParams.append(key, val);
    });
    const qs = searchParams.toString();
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/inventory-history${qs ? '?' + qs : ''}`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorInventoryStats = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/inventory-history/stats`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorProductMovements = async (productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/inventory-history/products/${productId}`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

/* ── Vendor Wholesale Portal API ── *//* ── Vendor Wholesale Portal API ── */
export const getVendorWholesaleDashboard = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/dashboard`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorWholesaleProducts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/products`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const updateVendorWholesaleProduct = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/products/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const getVendorWholesaleOrders = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/orders`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorWholesaleRfqs = async (status) => {
    const params = status ? `?status=${status}` : '';
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/rfqs${params}`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const respondToWholesaleRfq = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/rfqs/${id}/respond`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const getWholesalerRfqs = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesaler/rfqs`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const createWholesalerRfq = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wholesaler/rfqs`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const getVendorWholesaleOverrides = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/overrides`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const setVendorWholesaleOverride = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/overrides`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const deleteVendorWholesaleOverride = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/wholesale/overrides/${id}`, {
        method: "DELETE", credentials: "include",
    });
    return handleResponse(response);
};
/* ── Vendor Shipping Labels API ── */
export const getVendorShipmentsList = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/shipments`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorShippingLabels = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/labels`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const createVendorShipment = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/shipments/create`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const generateShippingLabel = async (labelId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/labels/${labelId}/generate`, {
        method: "POST", credentials: "include",
    });
    return handleResponse(response);
};

export const schedulePickup = async (labelId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/labels/${labelId}/pickup`, {
        method: "POST", credentials: "include",
    });
    return handleResponse(response);
};

export const trackVendorShipment = async (awbNumber) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/track/${awbNumber}`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getShippingCarriers = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping/carriers`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

/* ── Automated Payout Processing API ── */
export const getPayoutProcessingStats = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/stats`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getPayoutBatches = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/batches`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const getPayoutBatchById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/batches/${id}`, {
        method: "GET", credentials: "include",
    });
    return handleResponse(response);
};

export const calculatePayoutBreakdown = async (vendorId, grossAmount) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/calculate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ vendorId, grossAmount }),
    });
    return handleResponse(response);
};

export const processSinglePayout = async (payoutId, adminUser) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/process-single`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ payoutId, adminUser }),
    });
    return handleResponse(response);
};

export const processBatchPayouts = async (payoutIds, method, adminUser, adminUserId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/process-batch`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ payoutIds, method, adminUser, adminUserId }),
    });
    return handleResponse(response);
};

export const executeScheduledPayouts = async (adminUser, adminUserId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/execute-schedules`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ adminUser, adminUserId }),
    });
    return handleResponse(response);
};

export const runScheduleNow = async (scheduleId, adminUser, adminUserId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/payout-processing/schedules/${scheduleId}/run-now`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ adminUser, adminUserId }),
    });
    return handleResponse(response);
};

/* ── Shipping Rules ── *//* ── Shipping Rules ── */
export const getVendorShippingRules = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-rules`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createVendorShippingRule = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-rules`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};
export const updateVendorShippingRule = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-rules/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};
export const deleteVendorShippingRule = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-rules/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const toggleVendorShippingRule = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-rules/${id}/toggle`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
/* ── Vendor Shipping Zones ── */
export const getVendorShippingZones = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-zones`, {
        method: "GET", credentials: "include",
    });
    return handleResponseSafe(response);
};

export const createVendorShippingZone = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-zones`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponseSafe(response);
};

export const updateVendorShippingZone = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-zones/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponseSafe(response);
};

export const deleteVendorShippingZone = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-zones/${id}`, {
        method: "DELETE", credentials: "include",
    });
    return handleResponseSafe(response);
};

export const getPublicShippingOptions = async (vendorId, params) => {
    const searchParams = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) searchParams.append(k, v); });
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-rules/public/${vendorId}?${searchParams.toString()}`, { method: "GET", credentials: "include" });
    return handleResponse(response);
};
export const calculateShippingCost = async (vendorId, params) => {
    const searchParams = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v != null) searchParams.append(k, v); });
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/shipping-rules/public/${vendorId}/calculate?${searchParams.toString()}`, { method: "GET", credentials: "include" });
    return handleResponse(response);
};

// ── Pincode / Shipping Validation ──

export const quickPincodeCheck = async (pincode) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/shipping/quick-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pincode }),
    });
    return handleResponse(response);
};

export const validateVendorShipping = async (vendorId, pincode) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/shipping/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ vendorId, pincode }),
    });
    return handleResponse(response);
};

export const validateCartShipping = async (productIds, pincode) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/shipping/validate/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productIds, pincode }),
    });
    return handleResponse(response);
};

/* ── Bulk/Tiered Pricing ── */
export const getPricingTiers = async (productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/products/${productId}/pricing-tiers`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const savePricingTiers = async (productId, tiers) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/products/${productId}/pricing-tiers`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(tiers),
    });
    return handleResponse(response);
};
export const getPriceForQuantity = async (productId, quantity) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/products/${productId}/price-for-quantity?quantity=${quantity}`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getFlashSales = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/flash-sales`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createFlashSale = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/flash-sales`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateFlashSale = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/flash-sales/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteFlashSale = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/flash-sales/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getBanners = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/banners`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createBanner = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/banners`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteBanner = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/banners/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getPushNotifications = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/push-notifications`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createPushNotification = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/push-notifications`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updatePushNotification = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/push-notifications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deletePushNotification = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/push-notifications/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getNewsletterCampaigns = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/newsletter-campaigns`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createNewsletterCampaign = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/newsletter-campaigns`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteNewsletterCampaign = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/newsletter-campaigns/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getSubscriberLists = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/subscriber-lists`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createSubscriberList = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/subscriber-lists`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const subscribeNewsletter = async (email) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/newsletter/subscribe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    return handleResponse(response);
};
export const deleteSubscriberList = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/subscriber-lists/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getReferrers = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/referrers`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createReferrer = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/referrers`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteReferrer = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/referrers/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getLoyaltyCustomers = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/loyalty-customers`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createLoyaltyCustomer = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/loyalty-customers`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};

export const getRefunds = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/refunds`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createRefund = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/refunds`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteRefund = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/refunds/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
/**
 * Processes a refund through Razorpay payment gateway.
 * Called when an admin approves a refund request.
 * @param {Object} params - { paymentId, amount (paise, optional), reason, refundId }
 */
export const processRefundPayment = async (params) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/refunds/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
    });
    return handleResponse(response);
};


export const getVendorShipments = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/vendor-shipments`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const adminCreateVendorShipment = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/vendor-shipments`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};

export const getHelpArticles = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/help-articles`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createHelpArticle = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/help-articles`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};

export const getCmsPageBySlug = async (slug) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cms/pages/${slug}`, { method: "GET", headers: { "Content-Type": "application/json" } });
    return handleResponse(response);
};

export const getPublicFaqs = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cms/faqs`, { method: "GET", headers: { "Content-Type": "application/json" } });
    return handleResponse(response);
};

export const getPublicHelpArticles = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/cms/help-articles`, { method: "GET", headers: { "Content-Type": "application/json" } });
    return handleResponse(response);
};

export const getSeoPages = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/seo-pages`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createSeoPage = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/seo-pages`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateSeoPage = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/seo-pages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteSeoPage = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/seo-pages/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getCustomSnippets = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/custom-snippets`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createCustomSnippet = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/custom-snippets`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateCustomSnippet = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/custom-snippets/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteCustomSnippet = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/custom-snippets/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getUrlRedirects = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/url-redirects`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createUrlRedirect = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/url-redirects`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateUrlRedirect = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/url-redirects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteUrlRedirect = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/cms/url-redirects/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

// ═══════════════ Brand API ═══════════════

export const getBrands = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/brands`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const getBrandById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/brands/${id}`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createBrand = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/brands`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateBrand = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/brands/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteBrand = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/brands/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

export const getAdminRoles = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/roles`, { method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};
export const createAdminRole = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/roles`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const updateAdminRole = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/roles/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
    return handleResponse(response);
};
export const deleteAdminRole = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/roles/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include" });
    return handleResponse(response);
};

// ═══════════════ Customer Segment API ═══════════════

export const getCustomerSegments = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveCustomerSegments = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getSegmentStats = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getCustomerSegmentById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getSegmentCustomers = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/${id}/customers`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createCustomerSegment = async (segment) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(segment),
    });
    return handleResponse(response);
};

export const updateCustomerSegment = async (id, segment) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(segment),
    });
    return handleResponse(response);
};

export const toggleCustomerSegmentStatus = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const recalculateSegmentCounts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const deleteCustomerSegment = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/customer-segments/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Abandoned Cart Recovery API ═══════════════

export const getAbandonedCarts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getAbandonedCartsByStatus = async (status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts/status/${status}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getAbandonedCartStats = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getAbandonedCartById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const sendRecoveryEmail = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts/${id}/send-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const sendBulkRecoveryEmails = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts/send-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const dismissAbandonedCart = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts/${id}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const scanAbandonedCarts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/abandoned-carts/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════ Marketplace Fee API ═══════════════

export const getMarketplaceFees = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveMarketplaceFees = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getMarketplaceFeeById = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createMarketplaceFee = async (fee) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fee),
    });
    return handleResponse(response);
};

export const updateMarketplaceFee = async (id, fee) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(fee),
    });
    return handleResponse(response);
};

export const deleteMarketplaceFee = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getMarketplaceFeeStats = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const calculateMarketplaceFee = async (orderTotal, category) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/marketplace-fees/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderTotal, category }),
    });
    return handleResponse(response);
};

// ═══════════════ Inventory Alert API ═══════════════

export const getInventoryAlerts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getInventoryAlertsByStatus = async (status) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/status/${status}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getInventoryAlertsByVendor = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/vendor/${vendorId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getInventoryAlertsBySeverity = async (severity) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/severity/${severity}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const acknowledgeInventoryAlert = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/${id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const resolveInventoryAlert = async (id, notes) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
};

export const dismissInventoryAlert = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/${id}/dismiss`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const updateInventoryAlertNotes = async (id, notes) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/${id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes }),
    });
    return handleResponse(response);
};

export const scanInventoryAlerts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getLowStockProducts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/low-stock-products`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getInventoryAlertStats = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getInventoryAlertThresholds = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/thresholds`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const updateInventoryAlertThresholds = async (thresholds) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/inventory-alerts/thresholds`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(thresholds),
    });
    return handleResponse(response);
};

// ========== Saved Payment Methods ==========

export const getSavedPaymentMethods = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment-methods`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const savePaymentMethod = async (methodData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(methodData),
    });
    return handleResponse(response);
};

export const deletePaymentMethod = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment-methods/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const setDefaultPaymentMethod = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/payment-methods/${id}/default`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ========== Recently Viewed ==========

export const getRecentlyViewed = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/recently-viewed`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const trackProductView = async (productId, productName, productImage, productPrice) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/recently-viewed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, productName, productImage, productPrice }),
    });
    return handleResponse(response);
};

export const clearRecentlyViewed = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/recently-viewed`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ========== Back in Stock Alerts ==========

export const getBackInStockAlerts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/back-in-stock`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createBackInStockAlert = async (productId, email) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/back-in-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, email }),
    });
    return handleResponse(response);
};

export const cancelBackInStockAlert = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/back-in-stock/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ========== Price Drop Alerts ==========

export const getPriceDropAlerts = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/price-drop-alerts`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createPriceDropAlert = async (productId, targetPrice, email) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/price-drop-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, targetPrice, email }),
    });
    return handleResponse(response);
};

export const cancelPriceDropAlert = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/price-drop-alerts/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ========== Product Bundles ==========

export const getActiveBundles = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/product-bundles/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getAllBundles = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/product-bundles`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getBundle = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/product-bundles/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createBundle = async (bundleData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/product-bundles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bundleData),
    });
    return handleResponse(response);
};

export const updateBundle = async (id, bundleData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/product-bundles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bundleData),
    });
    return handleResponse(response);
};

export const deleteBundle = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/product-bundles/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ========== Shipping Zones (Admin) ==========

export const getShippingZones = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/shipping-zones`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveShippingZones = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/shipping-zones/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createShippingZone = async (zoneData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/shipping-zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(zoneData),
    });
    return handleResponse(response);
};

export const updateShippingZone = async (id, zoneData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/shipping-zones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(zoneData),
    });
    return handleResponse(response);
};

export const deleteShippingZone = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/shipping-zones/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ========== Announcements (Admin) ==========

export const getAnnouncements = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/announcements`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveAnnouncements = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/announcements/active`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createAnnouncement = async (announcementData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(announcementData),
    });
    return handleResponse(response);
};

export const updateAnnouncement = async (id, announcementData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(announcementData),
    });
    return handleResponse(response);
};

export const deleteAnnouncement = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

// ========== Gift Cards ==========

export const getGiftCards = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/gift-cards/admin`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const createGiftCard = async (giftCardData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/gift-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(giftCardData),
    });
    return handleResponse(response);
};

export const redeemGiftCard = async (code, amount) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/gift-cards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, amount }),
    });
    return handleResponse(response);
};

// ========== Bulk Stock Import/Export ==========

export const exportStockCsv = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/bulk-stock/export/csv`, {
        method: "GET",
        credentials: "include",
    });
    return response.blob();
};

export const exportStockExcel = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/bulk-stock/export/excel`, {
        method: "GET",
        credentials: "include",
    });
    return response.blob();
};

export const importStockFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/bulk-stock/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

export const vendorExportStockCsv = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/bulk-stock/export/csv`, {
        method: "GET",
        credentials: "include",
    });
    return response.blob();
};

export const vendorExportStockExcel = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/bulk-stock/export/excel`, {
        method: "GET",
        credentials: "include",
    });
    return response.blob();
};

export const vendorImportStockFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/bulk-stock/import`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    return handleResponse(response);
};

// ========== Maintenance Mode ==========

export const getMaintenanceStatus = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/maintenance/status`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    });
    return handleResponse(response);
};

export const toggleMaintenanceMode = async (enabled) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/maintenance/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
    });
    return handleResponse(response);
};

// ═══════════════════════════════════════════════
// NEW FEATURES API METHODS
// ═══════════════════════════════════════════════

// ── Tax/Fiscal Reports ──
export const getTaxReportDashboard = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-reports/dashboard`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getGSTR1 = async (periodStart, periodEnd) => {
    const params = new URLSearchParams();
    if (periodStart) params.append('periodStart', periodStart);
    if (periodEnd) params.append('periodEnd', periodEnd);
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-reports/gstr1?${params.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getGSTR3B = async (periodStart, periodEnd) => {
    const params = new URLSearchParams();
    if (periodStart) params.append('periodStart', periodStart);
    if (periodEnd) params.append('periodEnd', periodEnd);
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/tax-reports/gstr3b?${params.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const downloadTaxReportCsv = (type, periodStart, periodEnd) => {
    const params = new URLSearchParams({ type });
    if (periodStart) params.append('periodStart', periodStart);
    if (periodEnd) params.append('periodEnd', periodEnd);
    window.open(`${API_BASE_URL}/admin/tax-reports/export/csv?${params.toString()}`, '_blank');
};

// ── Advanced Report Builder ──
export const getSalesReport = async (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/reports/sales?${params.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getAdminProductsReport = async (category, status) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/reports/products?${params.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorReport = async (sortBy, sortDir) => {
    const params = new URLSearchParams();
    if (sortBy) params.append('sortBy', sortBy);
    if (sortDir) params.append('sortDir', sortDir);
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/reports/vendors?${params.toString()}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const downloadReportCsv = async (reportData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/reports/export/csv`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(reportData),
    });
    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'report.csv';
        a.click();
        URL.revokeObjectURL(url);
    }
    return response;
};

// ── Newsletter Sending ──
export const sendNewsletterCampaign = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/newsletter/send/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

// ── Size Guide API ──
export const getSizeGuides = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/size-guides`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getActiveSizeGuides = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/size-guides/active`, {
        method: "GET", headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
};

export const createSizeGuide = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/size-guides`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const updateSizeGuide = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/size-guides/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(data),
    });
    return handleResponse(response);
};

export const deleteSizeGuide = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/size-guides/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

// ── Vendor Following API ──
export const followVendor = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-follows/follow/${vendorId}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const unfollowVendor = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-follows/unfollow/${vendorId}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getMyFollowedVendors = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-follows/my-follows`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const checkFollowingVendor = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-follows/check/${vendorId}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getVendorFollowerCount = async (vendorId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor-follows/count/${vendorId}`, {
        method: "GET", headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
};

// ── Wishlist Sharing ──
export const shareWishlist = async (shareData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/wishlist/share`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(shareData),
    });
    return handleResponse(response);
};

// ═══════════════════════════════════════════════
// GIFT WRAPPING API METHODS
// ═══════════════════════════════════════════════
export const getGiftWrappingOptions = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/gift-wrapping/options`, {
        method: "GET", headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
};

export const addGiftWrappingToOrder = async (orderData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/gift-wrapping/add`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(orderData),
    });
    return handleResponse(response);
};

// ═══════════════════════════════════════════════
// COMPETITOR PRICE ANALYSIS API METHODS
// ═══════════════════════════════════════════════
export const getCompetitorPrices = async (productId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/competitor-prices/product/${productId}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const getPriceComparison = async (productId, ourPrice) => {
    const params = ourPrice ? `?ourPrice=${ourPrice}` : '';
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/competitor-prices/product/${productId}/comparison${params}`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const addCompetitorPrice = async (priceData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/competitor-prices`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(priceData),
    });
    return handleResponse(response);
};

export const updateCompetitorPrice = async (id, priceData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/competitor-prices/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(priceData),
    });
    return handleResponse(response);
};

export const deleteCompetitorPrice = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/competitor-prices/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════════════════════════════════════
// MULTI-STORE MANAGEMENT API METHODS
// ═══════════════════════════════════════════════
export const getVendorStores = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/stores`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const createVendorStore = async (storeData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/stores`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(storeData),
    });
    return handleResponse(response);
};

export const updateVendorStore = async (storeId, storeData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/stores/${storeId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(storeData),
    });
    return handleResponse(response);
};

export const deleteVendorStore = async (storeId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/stores/${storeId}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

// ═══════════════════════════════════════════════
// GIFT WRAPPING MANAGEMENT (ADMIN)
// ═══════════════════════════════════════════════
export const getAdminGiftWrappingOptions = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gift-wrapping`, {
        method: "GET", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

export const createGiftWrappingOption = async (optionData) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gift-wrapping`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(optionData),
    });
    return handleResponse(response);
};

export const deleteGiftWrappingOption = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/admin/gift-wrapping/${id}`, {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
    });
    return handleResponse(response);
};

/* ── Vendor Product Schedules ── */
export const getVendorProductSchedules = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/product-schedules`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};
export const createVendorProductSchedule = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/product-schedules`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(data)
    });
    return handleResponseSafe(response);
};
export const deleteVendorProductSchedule = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/product-schedules/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};

/* ── Vendor Subscription Plans ── */
export const getVendorPlans = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/plans`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};
export const getMySubscription = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/plans/my-subscription`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};
export const subscribeToPlan = async (planId, billingCycle) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/plans/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ planId, billingCycle })
    });
    return handleResponseSafe(response);
};

/* ── Vendor Abandoned Orders ── */
export const getVendorAbandonedOrders = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/abandoned-orders`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};
export const sendFollowUpAbandonedOrder = async (orderId) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/abandoned-orders/${orderId}/follow-up`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};
export const sendBulkFollowUpAbandonedOrders = async (orderIds) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/abandoned-orders/bulk-follow-up`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ orderIds })
    });
    return handleResponseSafe(response);
};

/* ── Vendor Fulfillments ── */
export const getVendorFulfillments = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/fulfillments`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};
export const createVendorFulfillment = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/fulfillments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(data)
    });
    return handleResponseSafe(response);
};

/* ── Vendor Review Templates ── */
export const getVendorReviewTemplates = async () => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/review-templates`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};
export const createVendorReviewTemplate = async (data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/review-templates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(data)
    });
    return handleResponseSafe(response);
};
export const updateVendorReviewTemplate = async (id, data) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/review-templates/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(data)
    });
    return handleResponseSafe(response);
};
export const deleteVendorReviewTemplate = async (id) => {
    const response = await fetchWithTimeout(`${API_BASE_URL}/vendor/review-templates/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include'
    });
    return handleResponseSafe(response);
};

export const getPublicCategories = async () => {
    try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/categories`, {
            method: 'GET', headers: { 'Content-Type': 'application/json' }
        });
        if (response.status === 401) return [];
        return handleResponse(response);
    } catch (error) {
        console.warn("Failed to fetch categories, using empty array:", error);
        return [];
    }
};
