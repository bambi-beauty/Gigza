// src/services/djService.js
const API_BASE_URL = 'https://gigza-testing-11.onrender.com/api';

const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * API call function with optional authentication
 */
const apiCall = async (endpoint, options = {}, skipAuth = false) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (!skipAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    const config = {
        ...options,
        headers,
    };
    
    try {
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${API_BASE_URL}${cleanEndpoint}`;
        console.log(`📡 API Call: ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(url, config);
        
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
// DJ SERVICES - Named Exports
// ============================================

export const getAllDJs = async (filters = {}) => {
    const { verified_only = false, available_only = false } = filters;
    const queryParams = new URLSearchParams();
    
    if (verified_only) queryParams.append('verified_only', 'true');
    if (available_only) queryParams.append('available_only', 'true');
    
    const queryString = queryParams.toString();
    const endpoint = `/djs${queryString ? `?${queryString}` : ''}`;
    
    try {
        const data = await apiCall(endpoint, {}, false);
        console.log('🔍 getAllDJs response:', data);
        
        let djs = [];
        
        if (data.djs && Array.isArray(data.djs)) {
            djs = data.djs;
        } else if (data.data && Array.isArray(data.data)) {
            djs = data.data;
        } else if (data.rows && Array.isArray(data.rows)) {
            djs = data.rows;
        } else if (Array.isArray(data)) {
            djs = data;
        } else if (data.dj_profile && Array.isArray(data.dj_profile)) {
            djs = data.dj_profile;
        } else if (data.djs_list && Array.isArray(data.djs_list)) {
            djs = data.djs_list;
        } else {
            for (const key in data) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    djs = data[key];
                    break;
                }
            }
        }
        
        console.log(`✅ Found ${djs.length} DJs`);
        
        const normalizedDJs = djs.map(dj => ({
            id: dj.dj_id || dj.id,
            dj_id: dj.dj_id || dj.id,
            userid: dj.userid,
            name: dj.dj_name || dj.name || 'DJ',
            dj_name: dj.dj_name || dj.name || 'DJ',
            experience: dj.dj_experience || dj.experience || '',
            skills: dj.dj_skills || dj.skills || '',
            genre: dj.primary_genre || dj.genre || 'Electronic',
            primary_genre: dj.primary_genre || dj.genre || 'Electronic',
            price: dj.price_per_hour || dj.price || 150,
            price_per_hour: dj.price_per_hour || dj.price || 150,
            latitude: dj.latitude,
            longitude: dj.longitude,
            verified: dj.is_verified || false,
            is_verified: dj.is_verified || false,
            is_online: dj.is_online || false,
            online: dj.is_online || false,
            rating: parseFloat(dj.rating) || 0,
            review_count: dj.total_reviews || 0,
            total_reviews: dj.total_reviews || 0,
            image: dj.profile_image || dj.image || `/api/placeholder/150/150`,
            profile_image: dj.profile_image || dj.image || `/api/placeholder/150/150`,
            created_at: dj.created_at,
            updated_at: dj.updated_at,
            ...dj
        }));
        
        return {
            success: true,
            djs: normalizedDJs,
            total: normalizedDJs.length,
            raw: data
        };
        
    } catch (error) {
        console.error('❌ Error fetching DJs:', error);
        throw error;
    }
};

export const getAvailableDJs = async () => {
    try {
        const data = await apiCall('/djs/available', {}, false);
        console.log('🔍 getAvailableDJs response:', data);
        
        let djs = [];
        if (data.available_djs && Array.isArray(data.available_djs)) {
            djs = data.available_djs;
        } else if (data.djs && Array.isArray(data.djs)) {
            djs = data.djs;
        } else if (data.data && Array.isArray(data.data)) {
            djs = data.data;
        } else if (Array.isArray(data)) {
            djs = data;
        }
        
        return {
            success: true,
            available_djs: djs,
            total: djs.length
        };
    } catch (error) {
        console.error('❌ Error fetching available DJs:', error);
        throw error;
    }
};

export const getVerifiedDJs = async () => {
    try {
        const data = await apiCall('/djs/verified', {}, false);
        console.log('🔍 getVerifiedDJs response:', data);
        
        let djs = [];
        if (data.verified_djs && Array.isArray(data.verified_djs)) {
            djs = data.verified_djs;
        } else if (data.djs && Array.isArray(data.djs)) {
            djs = data.djs;
        } else if (data.data && Array.isArray(data.data)) {
            djs = data.data;
        } else if (Array.isArray(data)) {
            djs = data;
        }
        
        return {
            success: true,
            verified_djs: djs,
            total: djs.length
        };
    } catch (error) {
        console.error('❌ Error fetching verified DJs:', error);
        throw error;
    }
};

export const getDJById = async (djId) => {
    try {
        const data = await apiCall(`/djs/${djId}`, {}, false);
        console.log('🔍 getDJById response:', data);
        
        let dj = null;
        if (data.dj) {
            dj = data.dj;
        } else if (data.data) {
            dj = data.data;
        } else if (data.profile) {
            dj = data.profile;
        } else {
            dj = data;
        }
        
        return {
            success: true,
            dj: dj,
            raw: data
        };
    } catch (error) {
        console.error('❌ Error fetching DJ:', error);
        throw error;
    }
};

export const getNearbyDJs = async (latitude, longitude, radius_km = 10) => {
    try {
        const queryParams = new URLSearchParams({ 
            latitude: latitude.toString(), 
            longitude: longitude.toString(), 
            radius_km: radius_km.toString() 
        });
        const data = await apiCall(`/djs/nearby?${queryParams}`, {}, false);
        console.log('🔍 getNearbyDJs response:', data);
        
        let djs = [];
        if (data.djs && Array.isArray(data.djs)) {
            djs = data.djs;
        } else if (data.nearby_djs && Array.isArray(data.nearby_djs)) {
            djs = data.nearby_djs;
        } else if (data.data && Array.isArray(data.data)) {
            djs = data.data;
        } else if (Array.isArray(data)) {
            djs = data;
        }
        
        return {
            success: true,
            djs: djs,
            total: djs.length
        };
    } catch (error) {
        console.error('❌ Error fetching nearby DJs:', error);
        throw error;
    }
};

export const getDJAvailability = async (djId) => {
    try {
        const data = await apiCall(`/djs/${djId}/availability`, {}, false);
        return data;
    } catch (error) {
        console.error('❌ Error fetching DJ availability:', error);
        throw error;
    }
};

// ============================================
// PROTECTED DJ SERVICES (Authentication required)
// ============================================

export const getMyDJProfile = async () => {
    return apiCall('/dj/my-profile', {}, false);
};

export const createDJProfile = async (profileData) => {
    return apiCall('/dj/profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
    }, false);
};

export const updateDJProfile = async (profileData) => {
    return apiCall('/dj/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
    }, false);
};

export const updateDJLocation = async (latitude, longitude) => {
    return apiCall('/dj/location', {
        method: 'PATCH',
        body: JSON.stringify({ latitude, longitude }),
    }, false);
};

export const toggleDJOnline = async (is_online) => {
    return apiCall('/dj/toggle-online', {
        method: 'PATCH',
        body: JSON.stringify({ is_online }),
    }, false);
};

export const deleteDJProfile = async () => {
    return apiCall('/dj/profile', {
        method: 'DELETE',
    }, false);
};

// ============================================
// OPTIONAL: DEFAULT EXPORT (if you want it)
// ============================================
// const djService = {
//     getAllDJs,
//     getAvailableDJs,
//     getVerifiedDJs,
//     getDJById,
//     getNearbyDJs,
//     getDJAvailability,
//     getMyDJProfile,
//     createDJProfile,
//     updateDJProfile,
//     updateDJLocation,
//     toggleDJOnline,
//     deleteDJProfile
// };
// export default djService;