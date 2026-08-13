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
    
    // Notification state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Emergency state
    const [emergencyStatus, setEmergencyStatus] = useState('idle');
    const [emergencyId, setEmergencyId] = useState(null);
    const [foundDJ, setFoundDJ] = useState(null);
    const [eta, setEta] = useState(null);
    const [progress, setProgress] = useState(0);
    
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        const token = getToken();
        
        if (!token || !user) {
            console.log('🔌 No token or user, skipping socket connection');
            return;
        }

        // ✅ CORRECT URL - Using Render deployment
        const socketUrl = 'https://gigza-testing-11.onrender.com';

        console.log(`🔌 Connecting to WebSocket at: ${socketUrl}`);
        
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 30000,
            forceNew: true,
            withCredentials: true
        });

        // ============================================
        // SOCKET EVENT HANDLERS
        // ============================================

        // Connection events
        newSocket.on('connect', () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
            
            if (user?.id || user?.userid) {
                newSocket.emit('user:online', user.id || user.userid);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('⚠️ WebSocket connection error:', error.message);
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

        // ============================================
        // USER EVENTS
        // ============================================

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

        // ============================================
        // EMERGENCY EVENTS
        // ============================================

        newSocket.on('emergency:accepted', (data) => {
            console.log('🚨 Emergency accepted:', data);
            setEmergencyStatus('accepted');
            setFoundDJ(data.dj);
            setEta(data.estimated_arrival || 15);
            setProgress(20);
            setEmergencyId(data.emergency_id);
            
            const notification = {
                id: Date.now(),
                title: 'DJ Accepted! 🎧',
                message: `${data.dj.name} is on their way! ETA: ${data.estimated_arrival || 15} mins`,
                type: 'emergency_accepted',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            if (Notification.permission === 'granted') {
                new Notification('DJ Accepted!', {
                    body: `${data.dj.name} is on their way! ETA: ${data.estimated_arrival || 15} mins`,
                    icon: '/dj-icon.png'
                });
            }
        });

        newSocket.on('emergency:searching', (data) => {
            console.log('🔍 Searching for DJs:', data);
            setEmergencyStatus('searching');
            setEmergencyId(data.emergency_id);
            
            const notification = {
                id: Date.now(),
                title: 'Searching for DJs... 🔍',
                message: `Looking for available DJs in your area. Found ${data.djs_found || 0} nearby.`,
                type: 'emergency_searching',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('emergency:completed', (data) => {
            console.log('✅ Emergency completed:', data);
            setEmergencyStatus('completed');
            setProgress(100);
            
            const notification = {
                id: Date.now(),
                title: 'Emergency Completed! ✅',
                message: 'Your emergency request has been completed successfully.',
                type: 'emergency_completed',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('emergency:timeout', (data) => {
            console.log('⏰ Emergency timeout:', data);
            setEmergencyStatus('idle');
            setEmergencyId(null);
            setFoundDJ(null);
            
            const notification = {
                id: Date.now(),
                title: 'No DJs Available ⏰',
                message: 'No DJs responded to your emergency request. Please try again.',
                type: 'emergency_timeout',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('emergency:cancelled', (data) => {
            console.log('❌ Emergency cancelled:', data);
            setEmergencyStatus('idle');
            setEmergencyId(null);
            setFoundDJ(null);
            setDjLocation(null);
            setEta(null);
            setProgress(0);
            
            const notification = {
                id: Date.now(),
                title: 'Emergency Cancelled ❌',
                message: data.reason || 'Your emergency request has been cancelled.',
                type: 'emergency_cancelled',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('emergency:taken', (data) => {
            console.log('🚨 Emergency taken by another DJ:', data);
            setEmergencyStatus('idle');
            setEmergencyId(null);
            
            const notification = {
                id: Date.now(),
                title: 'Emergency Taken 🎧',
                message: 'Another DJ has accepted this emergency request.',
                type: 'emergency_taken',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('emergency:new_request', (data) => {
            console.log('🚨 New emergency request:', data);
            
            const notification = {
                id: Date.now(),
                title: 'New Emergency Request! 🚨',
                message: `Emergency DJ needed ${data.distance_km || 'nearby'} km away.`,
                type: 'emergency_new_request',
                data: data,
                timestamp: new Date().toISOString(),
                read: false
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            if (Notification.permission === 'granted') {
                new Notification('New Emergency Request!', {
                    body: `DJ needed ${data.distance_km || 'nearby'} km away. Emergency rate: R${data.emergency_rate || 'custom'}`,
                    icon: '/emergency-icon.png'
                });
            }
        });

        // ============================================
        // BOOKING EVENTS
        // ============================================

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

        newSocket.on('new_notification', (notification) => {
            console.log('📬 New notification via WebSocket:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        newSocket.on('error', (error) => {
            console.error('❌ Socket error:', error);
        });

        setSocket(newSocket);

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

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

    // ============================================
    // NOTIFICATION METHODS
    // ============================================

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const sendBookingNotification = (type, data) => {
        if (socket && isConnected) {
            socket.emit('booking:notification', { type, data });
        } else {
            console.warn('⚠️ Socket not connected, notification not sent');
        }
    };

    // ============================================
    // EMERGENCY METHODS
    // ============================================

    const createEmergency = (data) => {
        if (socket && isConnected) {
            socket.emit('user:emergency', data);
            setEmergencyStatus('searching');
        } else {
            console.error('❌ Socket not connected');
        }
    };

    const cancelEmergency = (emergencyId) => {
        if (socket && isConnected) {
            socket.emit('user:cancel-emergency', { emergencyId });
            setEmergencyStatus('idle');
            setEmergencyId(null);
            setFoundDJ(null);
        } else {
            console.error('❌ Socket not connected');
        }
    };

    const acceptEmergency = (emergencyId) => {
        if (socket && isConnected) {
            socket.emit('dj:accept-emergency', { emergencyId });
        } else {
            console.error('❌ Socket not connected');
        }
    };

    // ============================================
    // DJ METHODS
    // ============================================

    const setDJOnline = (isOnline) => {
        if (socket && isConnected) {
            socket.emit('dj:toggleOnline', { isOnline });
        }
    };

    const updateDJLocation = (latitude, longitude) => {
        if (socket && isConnected) {
            socket.emit('dj:updateLocation', { latitude, longitude });
        }
    };

    // ============================================
    // USER METHODS
    // ============================================

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

    // ============================================
    // CONTEXT VALUE
    // ============================================

    const value = {
        socket,
        isConnected,
        nearbyDJs,
        isSearching,
        trackedDJ,
        djLocation,
        notifications,
        unreadCount,
        markAllAsRead,
        clearNotifications,
        markAsRead,
        sendBookingNotification,
        emergencyStatus,
        emergencyId,
        foundDJ,
        eta,
        progress,
        createEmergency,
        cancelEmergency,
        acceptEmergency,
        setDJOnline,
        updateDJLocation,
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