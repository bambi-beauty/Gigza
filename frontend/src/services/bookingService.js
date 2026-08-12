// src/services/bookingService.js
const API_BASE_URL = 'https://gigza-testing-11.onrender.com/api';

const getAuthToken = () => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token exists:', !!token);
    if (token) {
        console.log('🔑 Token preview:', token.substring(0, 30) + '...');
    }
    return token;
};

/**
 * API call function with authentication for bookings
 */
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
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${API_BASE_URL}${cleanEndpoint}`;
        console.log(`📡 Booking API Call: ${options.method || 'GET'} ${url}`);
        console.log('📡 Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : undefined });
        
        const response = await fetch(url, config);
        
        // Log raw response for debugging
        const text = await response.text();
        console.log('📡 Raw response:', text);
        
        let data;
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
        console.error('❌ Booking API Error:', error);
        throw error;
    }
};

/**
 * Get user's bookings
 * @returns {Promise} - List of bookings
 */
export const getUserBookings = async () => {
    return apiCall('/bookings');
};

/**
 * Get booking details by ID
 * @param {number} bookingId - Booking ID
 * @returns {Promise} - Booking details
 */
export const getBookingDetails = async (bookingId) => {
    return apiCall(`/bookings/${bookingId}`);
};

/**
 * Create a new booking
 * @param {object} bookingData - Booking data
 * @returns {Promise} - Created booking
 */
export const createBooking = async (bookingData) => {
    return apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
    });
};

/**
 * Cancel a booking
 * @param {number} bookingId - Booking ID
 * @returns {Promise} - Cancellation confirmation
 */
export const cancelBooking = async (bookingId) => {
    return apiCall(`/bookings/${bookingId}`, {
        method: 'DELETE',
    });
};

/**
 * Update booking status (Admin only)
 * @param {number} bookingId - Booking ID
 * @param {string} status - New status (confirmed, cancelled, completed)
 * @returns {Promise} - Updated booking
 */
export const updateBookingStatus = async (bookingId, status) => {
    return apiCall(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ booking_status: status }),
    });
};

/**
 * Check DJ availability
 * @param {number} djId - DJ ID
 * @param {string} eventDate - Event date (YYYY-MM-DD)
 * @param {string} eventTime - Event time (HH:MM)
 * @returns {Promise} - Availability check result
 */
export const checkDJAvailability = async (djId, eventDate, eventTime) => {
    return apiCall(`/bookings/check-availability/${djId}`, {
        method: 'POST',
        body: JSON.stringify({ event_date: eventDate, event_time: eventTime }),
    });
};

/**
 * Submit a review for a booking
 * @param {number} bookingId - Booking ID
 * @param {number} rating - Rating (1-5)
 * @param {string} reviewText - Review text
 * @returns {Promise} - Submitted review
 */
export const submitReview = async (bookingId, rating, reviewText) => {
    return apiCall(`/bookings/${bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, review_text: reviewText }),
    });
};

export default {
    getUserBookings,
    getBookingDetails,
    createBooking,
    cancelBooking,
    updateBookingStatus,
    checkDJAvailability,
    submitReview
};