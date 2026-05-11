// src/services/djService.js
const API_BASE_URL = 'https://gigza-testing-11.onrender.com/api';

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
        const url = `${API_BASE_URL}${endpoint}`;
        console.log("📡 Fetching:", url);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Response error:", response.status, errorText.substring(0, 200));
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("📡 Response:", data);
        
        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};

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

// ✅ FIXED: Get nearby DJs - this is the important one!
export const getNearbyDJs = async (latitude, longitude, radius_km = 10) => {
    const queryParams = new URLSearchParams({ 
        latitude: latitude.toString(), 
        longitude: longitude.toString(), 
        radius_km: radius_km.toString() 
    });
    return apiCall(`/djs/nearby?${queryParams}`);
};