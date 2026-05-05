import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useUser } from './ThisUserContext';

const SocketContext = createContext();

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [nearbyDJs, setNearbyDJs] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const { getToken, user } = useUser();
    const socketRef = useRef(null);

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        // Connect to WebSocket server
        const socketInstance = io('http://localhost:5000', {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected:', socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        // Listen for nearby DJs response
        socketInstance.on('user:nearbyDJs', (data) => {
            console.log('Nearby DJs received:', data);
            if (data.success) {
                setNearbyDJs(data.djs);
                setIsSearching(false);
            }
        });

        // Listen for DJ location updates (real-time)
        socketInstance.on('dj:locationUpdate', (data) => {
            console.log('DJ location update:', data);
            // Update the location of a specific DJ in your list
            setNearbyDJs(prev => prev.map(dj => 
                dj.dj_id === data.djId 
                    ? { ...dj, latitude: data.location.latitude, longitude: data.location.longitude }
                    : dj
            ));
        });

        // Listen for DJ status changes
        socketInstance.on('dj:statusChanged', (data) => {
            console.log('DJ status changed:', data);
            setNearbyDJs(prev => prev.map(dj =>
                dj.dj_id === data.djId
                    ? { ...dj, is_online: data.isOnline }
                    : dj
            ));
        });

        socketRef.current = socketInstance;
        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [getToken]);

    // Search for nearby DJs
    const searchNearbyDJs = (latitude, longitude, radius_km = 1.5) => {
        if (!socketRef.current || !isConnected) {
            console.error('Socket not connected');
            return;
        }

        setIsSearching(true);
        socketRef.current.emit('user:searchNearbyDJs', {
            latitude,
            longitude,
            radius_km
        });
    };

    // Track a specific DJ
    const trackDJ = (djId) => {
        if (!socketRef.current || !isConnected) return;
        socketRef.current.emit('user:trackDJ', { djId });
    };

    // Request ride from DJ
    const requestRide = (djId, pickupLocation, eventDetails) => {
        if (!socketRef.current || !isConnected) return;
        
        return new Promise((resolve, reject) => {
            socketRef.current.emit('user:requestRide', {
                djId,
                pickupLocation,
                eventDetails
            });
            
            // Listen for response
            socketRef.current.once('user:rideRequested', (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
            
            setTimeout(() => reject(new Error('Request timeout')), 10000);
        });
    };

    // Request ETA
    const requestETA = (djId, userLatitude, userLongitude) => {
        if (!socketRef.current || !isConnected) return;
        
        return new Promise((resolve, reject) => {
            socketRef.current.emit('user:requestETA', {
                djId,
                userLatitude,
                userLongitude
            });
            
            socketRef.current.once('user:ETA', (response) => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject(response);
                }
            });
            
            setTimeout(() => reject(new Error('ETA request timeout')), 5000);
        });
    };

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            nearbyDJs,
            isSearching,
            searchNearbyDJs,
            trackDJ,
            requestRide,
            requestETA
        }}>
            {children}
        </SocketContext.Provider>
    );
};