// src/services/bookingService.js
const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'https://gigza-testing-11.onrender.com'}/api`;

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
        console.log(`📡 Booking API Call: ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API call failed');
        }
        
        return data;
    } catch (error) {
        console.error(`Booking API Error (${endpoint}):`, error);
        throw error;
    }
};

// ========== BOOKING SERVICES ==========

// Get user's bookings
export const getUserBookings = async () => {
    return apiCall('/bookings');
};

// Get booking by ID
export const getBookingById = async (bookingId) => {
    return apiCall(`/bookings/${bookingId}`);
};

// Create a new booking
export const createBooking = async (bookingData) => {
    return apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
    });
};

// Cancel a booking (using DELETE)
export const cancelBooking = async (bookingId) => {
    return apiCall(`/bookings/${bookingId}`, {
        method: 'DELETE',
    });
};

// Update booking status (for DJs/admins)
export const updateBookingStatus = async (bookingId, status) => {
    return apiCall(`/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ booking_status: status }),
    });
};

// Submit a review for a booking
export const submitReview = async (bookingId, rating, reviewText) => {
    return apiCall(`/bookings/${bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, review_text: reviewText }),
    });
};

// Check DJ availability
export const checkDJAvailability = async (djId, eventDate, eventTime) => {
    return apiCall(`/bookings/check-availability/${djId}`, {
        method: 'POST',
        body: JSON.stringify({ event_date: eventDate, event_time: eventTime }),
    });
};

// Get available DJs for a specific time
export const getAvailableDJsForTime = async (eventDate, eventTime) => {
    const queryParams = new URLSearchParams({ event_date: eventDate, event_time: eventTime });
    return apiCall(`/djs/available?${queryParams}`);
};