// src/UserContext/SocketContext.js

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useUser } from './ThisUserContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user, getToken } = useUser();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [nearbyDJs, setNearbyDJs] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [trackedDJ, setTrackedDJ] = useState(null);
    const [djLocation, setDjLocation] = useState(null);
    
    // ✅ NEW: Notification state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        const token = getToken();
        
        if (!token || !user) {
            console.log('🔌 No token or user, skipping socket connection');
            return;
        }

        const isProduction = process.env.NODE_ENV === 'production';
        const socketUrl = isProduction 
            ? 'https://gigza-testing-11.onrender.com'
            : 'http://localhost:5000';

        console.log(`🔌 Connecting to WebSocket at: ${socketUrl}`);
        console.log(`🔌 Environment: ${isProduction ? 'Production' : 'Development'}`);
        
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 15000,
            forceNew: true
        });

        // ✅ Socket event handlers
        newSocket.on('connect', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
        });

        newSocket.on('connect_error', (error) => {
            console.error('⚠️ WebSocket connection error:', error.message);
            console.log('📡 Will retry connection...');
            setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            setIsConnected(false);
            setIsSearching(false);
        });

        newSocket.on('authenticated', (data) => {
            console.log('✅ WebSocket authenticated:', data);
        });

        newSocket.on('auth_error', (data) => {
            console.error('❌ WebSocket auth error:', data.message);
        });

        // ✅ NEW: Handle booking notifications
        newSocket.on('booking_notification', (data) => {
            console.log('📬 Booking notification received:', data);
            
            // Add to notifications list
            const newNotification = {
                id: Date.now(),
                title: data.title || 'Booking Update',
                message: data.message || 'Your booking has been updated',
                type: data.type || 'booking',
                data: data.data || {},
                timestamp: new Date().toISOString(),
                read: false
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
                new Notification(data.title || 'Booking Update', {
                    body: data.message || 'Your booking has been updated',
                    icon: '/favicon.ico'
                });
            }
        });

        // ✅ NEW: Handle specific booking events
        newSocket.on('booking:created', (data) => {
            console.log('📬 Booking created:', data);
            const notification = {
                id: Date.now(),
                title: 'Booking Created! 🎉',
                message: `Your booking with ${data.dj_name || 'DJ'} has been created and is pending confirmation.`,
                type: 'booking_created',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('booking:confirmed', (data) => {
            console.log('📬 Booking confirmed:', data);
            const notification = {
                id: Date.now(),
                title: 'Booking Confirmed! ✅',
                message: `Your booking with ${data.dj_name || 'DJ'} has been confirmed for ${data.event_date || 'your event'}.`,
                type: 'booking_confirmed',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('booking:cancelled', (data) => {
            console.log('📬 Booking cancelled:', data);
            const notification = {
                id: Date.now(),
                title: 'Booking Cancelled ❌',
                message: `Your booking with ${data.dj_name || 'DJ'} has been cancelled.`,
                type: 'booking_cancelled',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('booking:completed', (data) => {
            console.log('📬 Booking completed:', data);
            const notification = {
                id: Date.now(),
                title: 'Booking Completed! ⭐',
                message: `Your booking with ${data.dj_name || 'DJ'} is complete. Please leave a review!`,
                type: 'booking_completed',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // ✅ NEW: DJ booking request notification
        newSocket.on('dj:booking_request', (data) => {
            console.log('📬 DJ booking request:', data);
            const notification = {
                id: Date.now(),
                title: 'New Booking Request! 📅',
                message: `${data.client_name || 'A client'} wants to book you for ${data.event_date || 'an event'}.`,
                type: 'dj_booking_request',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Keep existing handlers
        newSocket.on('user:nearbyDJs', (data) => {
            console.log('📡 Received nearby DJs:', data);
            setIsSearching(false);
            
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            
            if (data.success && data.djs) {
                setNearbyDJs(data.djs);
            } else {
                setNearbyDJs([]);
            }
        });

        newSocket.on('dj:locationUpdate', (data) => {
            console.log('📍 DJ location update:', data);
            if (trackedDJ === data.djId) {
                setDjLocation(data.location);
            }
        });

        newSocket.on('dj:statusChanged', (data) => {
            console.log('🔄 DJ status changed:', data);
            setNearbyDJs(prev => prev.map(dj => 
                dj.dj_id === data.djId 
                    ? { ...dj, is_online: data.isOnline }
                    : dj
            ));
        });

        newSocket.on('new_notification', (notification) => {
            console.log('📬 New notification via WebSocket:', notification);
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        setSocket(newSocket);

        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Cleanup
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            if (newSocket) {
                newSocket.disconnect();
                console.log('🔌 WebSocket disconnected on cleanup');
            }
        };
    }, [user, getToken]);

    // ✅ NEW: Mark all notifications as read
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    // ✅ NEW: Clear all notifications
    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    // ✅ NEW: Mark single notification as read
    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    // ✅ NEW: Send booking notification
    const sendBookingNotification = (type, data) => {
        if (socket && isConnected) {
            socket.emit('booking:notification', { type, data });
        } else {
            console.warn('⚠️ Socket not connected, notification not sent');
        }
    };

    // Keep existing functions
    const searchNearbyDJs = (latitude, longitude, radius_km = 1.5) => {
        if (!socket || !isConnected) {
            console.error('❌ Socket not connected');
            return;
        }
        
        console.log(`🔍 Searching for DJs within ${radius_km}km`);
        setIsSearching(true);
        setNearbyDJs([]);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            if (isSearching) {
                console.log('⏰ Search timeout - no response');
                setIsSearching(false);
                setNearbyDJs([]);
            }
        }, 10000);
        
        socket.emit('user:searchNearbyDJs', { latitude, longitude, radius_km });
    };

    const trackDJ = (djId) => {
        if (!socket || !isConnected) {
            console.error('❌ Socket not connected');
            return;
        }
        
        setTrackedDJ(djId);
        socket.emit('user:trackDJ', { djId });
    };

    const untrackDJ = (djId) => {
        if (!socket || !isConnected) return;
        
        setTrackedDJ(null);
        setDjLocation(null);
        socket.emit('user:untrackDJ', { djId });
    };

    const requestETA = (djId, userLatitude, userLongitude, callback) => {
        if (!socket || !isConnected) {
            console.error('❌ Socket not connected');
            return;
        }
        
        socket.emit('user:requestETA', { djId, userLatitude, userLongitude }, (response) => {
            if (callback) callback(response);
        });
    };

    const requestRide = (djId, pickupLocation, eventDetails) => {
        if (!socket || !isConnected) {
            console.error('❌ Socket not connected');
            return;
        }
        
        socket.emit('user:requestRide', { djId, pickupLocation, eventDetails });
    };

    const value = {
        socket,
        isConnected,
        nearbyDJs,
        isSearching,
        trackedDJ,
        djLocation,
        notifications,      // ✅ NEW
        unreadCount,        // ✅ NEW
        markAllAsRead,      // ✅ NEW
        clearNotifications, // ✅ NEW
        markAsRead,         // ✅ NEW
        sendBookingNotification, // ✅ NEW
        searchNearbyDJs,
        trackDJ,
        untrackDJ,
        requestETA,
        requestRide
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};