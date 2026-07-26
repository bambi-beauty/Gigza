// src/services/djService.js
const API_BASE_URL = `${'https://gigza-testing-11.onrender.com'}/api`;

const getAuthToken = () => {
    return localStorage.getItem('token');
};

/**
 * API call function with optional authentication
 * @param {string} endpoint - API endpoint (e.g., '/djs')
 * @param {object} options - Fetch options (method, body, etc.)
 * @param {boolean} skipAuth - Set to true for public routes that don't need authentication
 * @returns {Promise} - API response
 */
const apiCall = async (endpoint, options = {}, skipAuth = false) => {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    // ✅ Only add auth token if NOT skipping auth AND token exists
    if (token && !skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers,
    };
    
    try {
        // Remove any double slashes
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${API_BASE_URL}${cleanEndpoint}`;
        console.log(`📡 API Call: ${options.method || 'GET'} ${url} ${skipAuth ? '(public)' : '(auth)'}`);
        
        const response = await fetch(url, config);
        
        // Try to parse JSON, but handle empty responses
        let data;
        const text = await response.text();
        try {
            data = text ? JSON.parse(text) : {};
        } catch (e) {
            data = { message: text || 'Invalid response from server' };
        }
        
        if (!response.ok) {
            throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// ============================================
// PUBLIC DJ SERVICES (No authentication required)
// ============================================

/**
 * Get all DJs - PUBLIC
 * @param {object} filters - Filter options
 * @param {boolean} filters.verified_only - Show only verified DJs
 * @param {boolean} filters.available_only - Show only available DJs
 * @returns {Promise} - List of DJs
 */
export const getAllDJs = async (filters = {}) => {
    const { verified_only = false, available_only = false } = filters;
    const queryParams = new URLSearchParams();
    
    if (verified_only) queryParams.append('verified_only', 'true');
    if (available_only) queryParams.append('available_only', 'true');
    
    const queryString = queryParams.toString();
    const endpoint = `/djs${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint, {}, true); // skipAuth = true
};

/**
 * Get available DJs right now - PUBLIC
 * @returns {Promise} - List of available DJs
 */
export const getAvailableDJs = async () => {
    return apiCall('/djs/available', {}, true); // skipAuth = true
};

/**
 * Get verified DJs only - PUBLIC
 * @returns {Promise} - List of verified DJs
 */
export const getVerifiedDJs = async () => {
    return apiCall('/djs/verified', {}, true); // skipAuth = true
};

/**
 * Get DJ by ID - PUBLIC
 * @param {number|string} djId - DJ ID
 * @returns {Promise} - DJ profile
 */
export const getDJById = async (djId) => {
    return apiCall(`/djs/${djId}`, {}, true); // skipAuth = true
};

/**
 * Get nearby DJs based on user location - PUBLIC
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius_km - Search radius in kilometers
 * @returns {Promise} - List of nearby DJs
 */
export const getNearbyDJs = async (latitude, longitude, radius_km = 10) => {
    const queryParams = new URLSearchParams({ 
        latitude: latitude.toString(), 
        longitude: longitude.toString(), 
        radius_km: radius_km.toString() 
    });
    return apiCall(`/djs/nearby?${queryParams}`, {}, true); // skipAuth = true
};

/**
 * Get DJ's availability schedule - PUBLIC
 * @param {number|string} djId - DJ ID
 * @returns {Promise} - Availability schedule
 */
export const getDJAvailability = async (djId) => {
    return apiCall(`/djs/${djId}/availability`, {}, true); // skipAuth = true
};

// ============================================
// PROTECTED DJ SERVICES (Authentication required)
// ============================================

/**
 * Get current user's DJ profile - PROTECTED
 * @returns {Promise} - User's DJ profile
 */
export const getMyDJProfile = async () => {
    return apiCall('/dj/my-profile', {}, false); // skipAuth = false
};

/**
 * Create DJ profile - PROTECTED
 * @param {object} profileData - DJ profile data
 * @param {string} profileData.dj_name - DJ name
 * @param {string} profileData.dj_experience - Years of experience
 * @param {string} profileData.dj_skills - DJ skills (comma separated)
 * @param {string} profileData.primary_genre - Primary genre
 * @param {number} profileData.price_per_hour - Price per hour
 * @param {number} profileData.latitude - Location latitude
 * @param {number} profileData.longitude - Location longitude
 * @returns {Promise} - Created DJ profile
 */
export const createDJProfile = async (profileData) => {
    return apiCall('/dj/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
    }, false); // skipAuth = false
};

/**
 * Update DJ profile - PROTECTED
 * @param {object} profileData - Updated DJ profile data
 * @returns {Promise} - Updated DJ profile
 */
export const updateDJProfile = async (profileData) => {
    return apiCall('/dj/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    }, false); // skipAuth = false
};

/**
 * Update DJ location - PROTECTED
 * @param {number} latitude - New latitude
 * @param {number} longitude - New longitude
 * @returns {Promise} - Updated DJ profile
 */
export const updateDJLocation = async (latitude, longitude) => {
    return apiCall('/dj/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude, longitude }),
    }, false); // skipAuth = false
};

/**
 * Toggle DJ online/offline status - PROTECTED
 * @param {boolean} is_online - Online status
 * @returns {Promise} - Updated status
 */
export const toggleDJOnline = async (is_online) => {
    return apiCall('/dj/toggle-online', {
        method: 'PATCH',
        body: JSON.stringify({ is_online }),
    }, false); // skipAuth = false
};

/**
 * Delete DJ profile - PROTECTED
 * @returns {Promise} - Deletion confirmation
 */
export const deleteDJProfile = async () => {
    return apiCall('/dj/profile', {
        method: 'DELETE',
    }, false); // skipAuth = false
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================
export default {
    getAllDJs,
    getAvailableDJs,
    getVerifiedDJs,
    getDJById,
    getNearbyDJs,
    getDJAvailability,
    getMyDJProfile,
    createDJProfile,
    updateDJProfile,
    updateDJLocation,
    toggleDJOnline,
    deleteDJProfile
};