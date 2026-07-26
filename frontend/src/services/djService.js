// src/services/djService.js
// Make sure NO trailing slash at the end
const API_BASE_URL = `${'https://gigza-testing-11.onrender.com'}/api`;

const getAuthToken = () => {
    return localStorage.getItem('token');
};

const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
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
        console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }
        
        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

// ========== DJ SERVICES ==========

// Get all DJs
export const getAllDJs = async (filters = {}) => {
    const { verified_only = false, available_only = false } = filters;
    const queryParams = new URLSearchParams();
    
    if (verified_only) queryParams.append('verified_only', 'true');
    if (available_only) queryParams.append('available_only', 'true');
    
    const queryString = queryParams.toString();
    const endpoint = `/djs${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
};

// Get available DJs right now
export const getAvailableDJs = async () => {
    return apiCall('/djs/available');
};

// Get verified DJs only
export const getVerifiedDJs = async () => {
    return apiCall('/djs/verified');
};

// Get DJ by ID
export const getDJById = async (djId) => {
    return apiCall(`/djs/${djId}`);
};

// Get nearby DJs based on user location
export const getNearbyDJs = async (latitude, longitude, radius_km = 10) => {
    const queryParams = new URLSearchParams({ 
        latitude: latitude.toString(), 
        longitude: longitude.toString(), 
        radius_km: radius_km.toString() 
    });
    return apiCall(`/djs/nearby?${queryParams}`);
};

// Get DJ's availability schedule
export const getDJAvailability = async (djId) => {
    return apiCall(`/djs/${djId}/availability`);
};

// Get current user's DJ profile (protected)
export const getMyDJProfile = async () => {
    return apiCall('/dj/my-profile');
};

// Create DJ profile (protected)
export const createDJProfile = async (profileData) => {
    return apiCall('/dj/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
    });
};

// Update DJ profile (protected)
export const updateDJProfile = async (profileData) => {
    return apiCall('/dj/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    });
};

// Update DJ location (protected)
export const updateDJLocation = async (latitude, longitude) => {
    return apiCall('/dj/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude, longitude }),
    });
};

// Toggle DJ online/offline (protected)
export const toggleDJOnline = async (is_online) => {
    return apiCall('/dj/toggle-online', {
        method: 'PATCH',
        body: JSON.stringify({ is_online }),
    });
};

// Delete DJ profile (protected)
export const deleteDJProfile = async () => {
    return apiCall('/dj/profile', {
        method: 'DELETE',
    });
};