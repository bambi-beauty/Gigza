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
    
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        const token = getToken();
        
        if (!token || !user) {
            console.log('No token or user, skipping socket connection');
            return;
        }

        console.log('Connecting to WebSocket...');
        
        const newSocket = io(process.env.REACT_APP_API_URL || 'https://gigza-testing-11.onrender.com', {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('WebSocket connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            setIsSearching(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
        });

        // Listen for nearby DJs response
        newSocket.on('user:nearbyDJs', (data) => {
            console.log('Received nearby DJs:', data);
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

        // Listen for DJ location updates
        newSocket.on('dj:locationUpdate', (data) => {
            console.log('DJ location update:', data);
            if (trackedDJ === data.djId) {
                setDjLocation(data.location);
            }
        });

        // Listen for DJ status changes
        newSocket.on('dj:statusChanged', (data) => {
            console.log('DJ status changed:', data);
            // Update nearby DJs list with new status
            setNearbyDJs(prev => prev.map(dj => 
                dj.dj_id === data.djId 
                    ? { ...dj, is_online: data.isOnline }
                    : dj
            ));
        });

        // Listen for errors
        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            newSocket.disconnect();
        };
    }, [user, getToken]);

    const searchNearbyDJs = (latitude, longitude, radius_km = 1.5) => {
        if (!socket || !isConnected) {
            console.error('Socket not connected');
            return;
        }
        
        console.log(`Searching for DJs within ${radius_km}km`);
        setIsSearching(true);
        setNearbyDJs([]);
        
        // Set timeout for search response
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            if (isSearching) {
                console.log('Search timeout - no response');
                setIsSearching(false);
                setNearbyDJs([]);
            }
        }, 10000);
        
        socket.emit('user:searchNearbyDJs', { latitude, longitude, radius_km });
    };

    const trackDJ = (djId) => {
        if (!socket || !isConnected) return;
        
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
        if (!socket || !isConnected) return;
        
        socket.emit('user:requestETA', { djId, userLatitude, userLongitude }, (response) => {
            if (callback) callback(response);
        });
    };

    const requestRide = (djId, pickupLocation, eventDetails) => {
        if (!socket || !isConnected) return;
        
        socket.emit('user:requestRide', { djId, pickupLocation, eventDetails });
    };

    const value = {
        socket,
        isConnected,
        nearbyDJs,
        isSearching,
        trackedDJ,
        djLocation,
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