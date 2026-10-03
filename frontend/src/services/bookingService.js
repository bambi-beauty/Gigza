// src/services/bookingService.js

const API_BASE_URL =
    import.meta.env?.VITE_API_BASE_URL ||
    process.env.REACT_APP_API_BASE_URL ||
    'https://gigza-testing-11.onrender.com/api';

const DEBUG = process.env.NODE_ENV !== 'production';

const log = (...args) => {
    if (DEBUG) console.log(...args);
};

/**
 * Error with the HTTP status attached, so callers can branch on it
 * (e.g. 401 -> redirect to login, 404 -> wrong endpoint).
 */
export class ApiError extends Error {
    constructor(message, status, body) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.body = body;
    }
}

const getAuthToken = () => localStorage.getItem('token');

/**
 * Backends are inconsistent about whether they return a bare array or
 * wrap it. Normalize so callers always get an array.
 */
const toArray = (data) => {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];
    const wrapped =
        data.bookings ?? data.data ?? data.results ?? data.items ?? null;
    return Array.isArray(wrapped) ? wrapped : [];
};

/**
 * Same idea for single objects: unwrap { booking: {...} } / { data: {...} }.
 */
const toObject = (data) => {
    if (!data || typeof data !== 'object') return null;
    return data.booking ?? data.data ?? data.result ?? data;
};

const apiCall = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE_URL}${cleanEndpoint}`;
    const method = options.method || 'GET';

    log(`📡 ${method} ${url}`);

    let response;
    try {
        response = await fetch(url, { ...options, headers });
    } catch (networkError) {
        // fetch only rejects on network/CORS failure, never on 4xx/5xx
        console.error('❌ Network error:', networkError);
        throw new ApiError(
            'Could not reach the server. Check your connection.',
            0,
            null
        );
    }

    const text = await response.text();
    log(`📡 ${response.status} raw:`, text);

    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text || 'Invalid response from server' };
    }

    if (!response.ok) {
        const message =
            data.message ||
            data.error ||
            `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, data);
    }

    return data;
};

/**
 * Get the logged-in user's bookings.
 * @returns {Promise<Array>} always an array, never undefined
 */
export const getUserBookings = async () => {
    const data = await apiCall('/profile/bookings');
    return toArray(data);
};

/**
 * Get booking details by ID.
 * @param {number|string} bookingId
 * @returns {Promise<object|null>}
 */
export const getBookingDetails = async (bookingId) => {
    const data = await apiCall(`/profile/bookings/${bookingId}`);
    return toObject(data);
};

/**
 * Create a new booking.
 *
 * Tries POST /bookings first (the usual creation route), and falls back to
 * POST /profile/bookings if the server says that route doesn't exist.
 * Once you confirm which one your backend uses, delete the other.
 *
 * @param {object} bookingData
 * @returns {Promise<object|null>} the created booking
 */
export const createBooking = async (bookingData) => {
    const body = JSON.stringify(bookingData);

    try {
        const data = await apiCall('/bookings', { method: 'POST', body });
        return toObject(data);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            log('↩️ /bookings returned 404, retrying /profile/bookings');
            const data = await apiCall('/profile/bookings', {
                method: 'POST',
                body,
            });
            return toObject(data);
        }
        throw error;
    }
};

/**
 * Cancel a booking.
 * @param {number|string} bookingId
 */
export const cancelBooking = async (bookingId) =>
    updateBookingStatus(bookingId, 'cancelled');

/**
 * Update booking status (confirmed, cancelled, completed).
 * @param {number|string} bookingId
 * @param {string} status
 * @returns {Promise<object|null>} the updated booking
 */
export const updateBookingStatus = async (bookingId, status) => {
    const data = await apiCall(`/profile/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
    return toObject(data);
};

/**
 * Check DJ availability.
 * @param {number|string} djId
 * @param {string} eventDate - YYYY-MM-DD
 * @param {string} eventTime - HH:MM
 * @returns {Promise<object|null>}
 */
export const checkDJAvailability = async (djId, eventDate, eventTime) => {
    const data = await apiCall(`/bookings/check-availability/${djId}`, {
        method: 'POST',
        body: JSON.stringify({ event_date: eventDate, event_time: eventTime }),
    });
    return toObject(data);
};

/**
 * Submit a review for a booking.
 * @param {number|string} bookingId
 * @param {number} rating - 1-5
 * @param {string} reviewText
 */
export const submitReview = async (bookingId, rating, reviewText) => {
    const data = await apiCall(`/profile/bookings/${bookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, review_text: reviewText }),
    });
    return toObject(data);
};

export default {
    getUserBookings,
    getBookingDetails,
    createBooking,
    cancelBooking,
    updateBookingStatus,
    checkDJAvailability,
    submitReview,
    ApiError,
};