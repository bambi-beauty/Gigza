import { Server } from "socket.io";
import pool from "../lib/dbConnect.js";
import { 
    UpdateDJLocation, 
    findNearbyDJsWithS2 
} from "../Controllers/DJ_Locator.js";

// Store active connections
const activeUsers = new Map(); // userId -> socketId
const activeDJs = new Map();   // djId -> { socketId, location, lastUpdate, isOnline }
const userTrackedDJs = new Map(); // userId -> Set of djIds they're tracking

// Helper: Find all users tracking a specific DJ
function findUsersTrackingDJ(djId) {
    const users = [];
    for (const [userId, trackedDJs] of userTrackedDJs.entries()) {
        if (trackedDJs.has(djId)) {
            users.push(userId);
        }
    }
    return users;
}

// Helper: Calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Helper: Find nearby DJs from database using S2
async function findNearbyDJsFromDB(latitude, longitude, radius_km) {
    try {
        const query = `
            SELECT 
                d.dj_id,
                d.dj_name,
                d.dj_experience,
                d.dj_skills,
                d.latitude,
                d.longitude,
                u.username,
                COALESCE(AVG(r.rating_value), 0) AS average_rating,
                COUNT(r.rating_id) AS total_ratings,
                (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(d.latitude)) *
                        cos(radians(d.longitude) - radians($2)) +
                        sin(radians($1)) * sin(radians(d.latitude))
                    )
                ) AS distance_km
            FROM DJ_profile d
            JOIN userprofile up ON d.profileId = up.profileId
            JOIN users u ON up.userid = u.userid
            LEFT JOIN ratings r ON d.dj_id = r.dj_id
            GROUP BY d.dj_id, d.dj_name, d.dj_experience, d.dj_skills, 
                     d.latitude, d.longitude, u.username
            HAVING 
                6371 * acos(
                    cos(radians($1)) * cos(radians(d.latitude)) *
                    cos(radians(d.longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(d.latitude))
                ) <= $3
            ORDER BY distance_km ASC
            LIMIT 20
        `;
        
        const result = await pool.query(query, [latitude, longitude, radius_km]);
        
        // Add online status
        const djsWithStatus = result.rows.map(dj => ({
            ...dj,
            is_online: activeDJs.has(dj.dj_id) && activeDJs.get(dj.dj_id).isOnline,
            distance_km: parseFloat(dj.distance_km).toFixed(2)
        }));
        
        return djsWithStatus;
    } catch (err) {
        console.error(`Find nearby DJs error: ${err.message}`);
        return [];
    }
}

// Initialize WebSocket server
export function initializeWebSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error("Authentication required"));
            }
            
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userid;
            socket.userType = decoded.usertype;
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 User connected: ${socket.userId} (${socket.userType})`);
        
        // Store connection
        if (socket.userType === 'dj') {
            activeDJs.set(socket.userId, {
                socketId: socket.id,
                location: null,
                lastUpdate: null,
                isOnline: false
            });
        } else {
            activeUsers.set(socket.userId, socket.id);
        }
        
        // ============ DJ EVENTS ============
        
        // 1. DJ updates their location (uses your DJ_Locator service)
        socket.on("dj:updateLocation", async (data) => {
            try {
                const { latitude, longitude, accuracy } = data;
                
                if (!latitude || !longitude) {
                    socket.emit("error", { message: "Location data required" });
                    return;
                }
                
                // Update in-memory location
                const djData = activeDJs.get(socket.userId);
                if (djData && djData.isOnline) {
                    djData.location = { latitude, longitude, accuracy };
                    djData.lastUpdate = Date.now();
                    activeDJs.set(socket.userId, djData);
                    
                    // Call your existing UpdateDJLocation logic to persist to database
                    // Create a mock request object
                    const mockReq = {
                        user: { userid: socket.userId },
                        body: { latitude, longitude }
                    };
                    const mockRes = {
                        status: () => ({ json: () => {} })
                    };
                    await UpdateDJLocation(mockReq, mockRes);
                    
                    console.log(`📍 DJ ${socket.userId} location updated: ${latitude}, ${longitude}`);
                    
                    // Notify all users tracking this DJ
                    const trackingUsers = findUsersTrackingDJ(socket.userId);
                    trackingUsers.forEach(userId => {
                        const userSocketId = activeUsers.get(userId);
                        if (userSocketId) {
                            io.to(userSocketId).emit("dj:locationUpdate", {
                                djId: socket.userId,
                                location: { latitude, longitude, accuracy },
                                timestamp: Date.now()
                            });
                        }
                    });
                    
                    socket.emit("dj:locationUpdated", {
                        success: true,
                        location: { latitude, longitude },
                        timestamp: Date.now()
                    });
                }
            } catch (err) {
                console.error(`Location update error: ${err.message}`);
                socket.emit("error", { message: "Failed to update location" });
            }
        });
        
        // 2. DJ goes online/offline
        socket.on("dj:toggleOnline", async (data) => {
            try {
                const { isOnline } = data;
                
                const dj = activeDJs.get(socket.userId);
                if (dj) {
                    dj.isOnline = isOnline;
                    if (!isOnline) {
                        dj.location = null;
                    }
                    activeDJs.set(socket.userId, dj);
                    
                    socket.emit("dj:onlineStatus", {
                        success: true,
                        isOnline,
                        message: isOnline ? "You are now online" : "You are now offline"
                    });
                    
                    // Notify all users tracking this DJ
                    const trackingUsers = findUsersTrackingDJ(socket.userId);
                    trackingUsers.forEach(userId => {
                        const userSocketId = activeUsers.get(userId);
                        if (userSocketId) {
                            io.to(userSocketId).emit("dj:statusChanged", {
                                djId: socket.userId,
                                isOnline,
                                timestamp: Date.now()
                            });
                        }
                    });
                }
            } catch (err) {
                console.error(`Toggle online error: ${err.message}`);
                socket.emit("error", { message: "Failed to update status" });
            }
        });
        
        // 3. DJ responds to ride request
        socket.on("dj:respondToRequest", async (data) => {
            try {
                const { bookingId, userId, accepted } = data;
                
                const userSocketId = activeUsers.get(userId);
                
                if (userSocketId) {
                    if (accepted) {
                        io.to(userSocketId).emit("user:rideAccepted", {
                            success: true,
                            bookingId,
                            djId: socket.userId,
                            message: "DJ has accepted your request",
                            status: "accepted"
                        });
                        
                        // Start real-time tracking automatically
                        if (!userTrackedDJs.has(userId)) {
                            userTrackedDJs.set(userId, new Set());
                        }
                        userTrackedDJs.get(userId).add(socket.userId);
                        
                    } else {
                        io.to(userSocketId).emit("user:rideRejected", {
                            success: false,
                            bookingId,
                            message: "DJ declined your request",
                            status: "rejected"
                        });
                    }
                }
                
                socket.emit("dj:requestResponded", {
                    success: true,
                    bookingId,
                    accepted
                });
                
            } catch (err) {
                console.error(`DJ response error: ${err.message}`);
                socket.emit("error", { message: "Failed to respond to request" });
            }
        });
        
        // ============ USER EVENTS ============
        
        // 4. User searches for nearby DJs (uses your LocateDj logic)
        socket.on("user:searchNearbyDJs", async (data) => {
            try {
                const { latitude, longitude, radius_km = 1.5 } = data;
                
                if (!latitude || !longitude) {
                    socket.emit("error", { message: "Location required" });
                    return;
                }
                
                // Store user's location for real-time updates
                socket.userLocation = { latitude, longitude, radius_km };
                
                // Use your existing findNearbyDJs logic
                const nearbyDJs = await findNearbyDJsFromDB(latitude, longitude, radius_km);
                
                // Subscribe user to real-time updates for these DJs
                nearbyDJs.forEach(dj => {
                    if (!userTrackedDJs.has(socket.userId)) {
                        userTrackedDJs.set(socket.userId, new Set());
                    }
                    userTrackedDJs.get(socket.userId).add(dj.dj_id);
                });
                
                socket.emit("user:nearbyDJs", {
                    success: true,
                    center: { latitude, longitude, radius_km },
                    total: nearbyDJs.length,
                    djs: nearbyDJs,
                    isRealTime: true
                });
                
            } catch (err) {
                console.error(`Search nearby DJs error: ${err.message}`);
                socket.emit("error", { message: "Failed to search for DJs" });
            }
        });
        
        // 5. User requests to track a specific DJ
        socket.on("user:trackDJ", async (data) => {
            try {
                const { djId } = data;
                
                if (!djId) {
                    socket.emit("error", { message: "DJ ID required" });
                    return;
                }
                
                // Add to tracking list
                if (!userTrackedDJs.has(socket.userId)) {
                    userTrackedDJs.set(socket.userId, new Set());
                }
                userTrackedDJs.get(socket.userId).add(parseInt(djId));
                
                // Check if DJ is online
                const dj = activeDJs.get(parseInt(djId));
                
                if (dj && dj.isOnline && dj.location) {
                    socket.emit("dj:locationUpdate", {
                        djId: parseInt(djId),
                        location: dj.location,
                        timestamp: dj.lastUpdate,
                        isOnline: true
                    });
                    
                    socket.emit("user:trackingStarted", {
                        success: true,
                        djId: parseInt(djId),
                        message: "Now tracking DJ location",
                        isOnline: true
                    });
                } else {
                    socket.emit("user:trackingStarted", {
                        success: true,
                        djId: parseInt(djId),
                        message: "DJ is offline. Will track when they come online.",
                        isOnline: false
                    });
                }
                
                console.log(`👤 User ${socket.userId} started tracking DJ ${djId}`);
                
            } catch (err) {
                console.error(`Track DJ error: ${err.message}`);
                socket.emit("error", { message: "Failed to track DJ" });
            }
        });
        
        // 6. User stops tracking a DJ
        socket.on("user:untrackDJ", async (data) => {
            try {
                const { djId } = data;
                
                if (userTrackedDJs.has(socket.userId)) {
                    userTrackedDJs.get(socket.userId).delete(parseInt(djId));
                    socket.emit("user:trackingStopped", {
                        success: true,
                        djId: parseInt(djId),
                        message: "Stopped tracking DJ"
                    });
                }
                
                console.log(`👤 User ${socket.userId} stopped tracking DJ ${djId}`);
                
            } catch (err) {
                console.error(`Untrack DJ error: ${err.message}`);
                socket.emit("error", { message: "Failed to stop tracking" });
            }
        });
        
        // 7. User requests ETA to a DJ
        socket.on("user:requestETA", async (data) => {
            try {
                const { djId, userLatitude, userLongitude } = data;
                
                if (!djId || !userLatitude || !userLongitude) {
                    socket.emit("error", { message: "DJ ID and user location required" });
                    return;
                }
                
                const dj = activeDJs.get(parseInt(djId));
                
                if (!dj || !dj.isOnline || !dj.location) {
                    socket.emit("user:ETA", {
                        success: false,
                        message: "DJ location not available or offline",
                        eta: null
                    });
                    return;
                }
                
                // Calculate distance and ETA
                const distance = calculateDistance(
                    userLatitude, userLongitude,
                    dj.location.latitude, dj.location.longitude
                );
                
                const averageSpeed = 30; // km/h
                const etaMinutes = (distance / averageSpeed) * 60;
                
                socket.emit("user:ETA", {
                    success: true,
                    djId: parseInt(djId),
                    distance_km: distance.toFixed(2),
                    eta_minutes: Math.ceil(etaMinutes),
                    eta_formatted: `${Math.ceil(etaMinutes)} minutes`,
                    djLocation: dj.location
                });
                
            } catch (err) {
                console.error(`ETA calculation error: ${err.message}`);
                socket.emit("error", { message: "Failed to calculate ETA" });
            }
        });
        
        // 8. User requests a ride (books a DJ)
        socket.on("user:requestRide", async (data) => {
            try {
                const { djId, pickupLocation, eventDetails } = data;
                
                const booking = {
                    bookingId: Date.now(),
                    userId: socket.userId,
                    djId: parseInt(djId),
                    pickupLocation,
                    eventDetails,
                    status: "pending",
                    timestamp: Date.now()
                };
                
                // Notify the DJ
                const dj = activeDJs.get(parseInt(djId));
                if (dj && dj.isOnline) {
                    io.to(dj.socketId).emit("dj:rideRequest", {
                        bookingId: booking.bookingId,
                        userId: socket.userId,
                        pickupLocation,
                        eventDetails,
                        timestamp: booking.timestamp
                    });
                    
                    socket.emit("user:rideRequested", {
                        success: true,
                        bookingId: booking.bookingId,
                        message: "Ride request sent to DJ",
                        status: "pending"
                    });
                } else {
                    socket.emit("user:rideRequested", {
                        success: false,
                        message: "DJ is offline",
                        status: "failed"
                    });
                }
                
            } catch (err) {
                console.error(`Ride request error: ${err.message}`);
                socket.emit("error", { message: "Failed to request ride" });
            }
        });
        
        // ============ DISCONNECT ============
        
        socket.on("disconnect", () => {
            console.log(`🔌 User disconnected: ${socket.userId}`);
            
            if (socket.userType === 'dj') {
                const dj = activeDJs.get(socket.userId);
                if (dj) {
                    // Notify all users tracking this DJ that they went offline
                    const trackingUsers = findUsersTrackingDJ(socket.userId);
                    trackingUsers.forEach(userId => {
                        const userSocketId = activeUsers.get(userId);
                        if (userSocketId) {
                            io.to(userSocketId).emit("dj:statusChanged", {
                                djId: socket.userId,
                                isOnline: false,
                                timestamp: Date.now()
                            });
                        }
                    });
                }
                activeDJs.delete(socket.userId);
            } else {
                activeUsers.delete(socket.userId);
                userTrackedDJs.delete(socket.userId);
            }
        });
    });
    
    return io;
}

export { activeUsers, activeDJs, userTrackedDJs };