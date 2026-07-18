import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to authenticate JWT token
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            if (err.name === 'JsonWebTokenError') {
                return res.status(403).json({
                    success: false,
                    message: "Invalid token."
                });
            }

            if (err.name === 'TokenExpiredError') {
                return res.status(403).json({
                    success: false,
                    message: "Token has expired. Please login again."
                });
            }

            return res.status(403).json({
                success: false,
                message: "Failed to authenticate token."
            });
        }

        req.user = user;
        next();
    });
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.usertype === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required."
        });
    }
};

// Middleware to check if user owns the resource or is admin
export const isOwnerOrAdmin = (req, res, next) => {
    const requestedUserId = parseInt(req.params.id) || parseInt(req.body.userid);
    const loggedInUserId = req.user.userid;
    const userType = req.user.usertype;

    if (loggedInUserId === requestedUserId || userType === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. You can only access your own resources."
        });
    }
};

// Middleware to check if email is verified
export const isEmailVerified = async (req, res, next) => {
    try {
        const pool = (await import('../lib/dbConnect.js')).default;

        const result = await pool.query(
            "SELECT email_verified FROM users WHERE userid = $1",
            [req.user.userid]
        );

        if (result.rows.length > 0 && result.rows[0].email_verified) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Email not verified. Please verify your email first."
            });
        }
    } catch (error) {
        console.error("Error checking email verification:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Middleware to check if profile is complete
export const checkProfileComplete = async (req, res, next) => {
    try {
        const pool = (await import('../lib/dbConnect.js')).default;

        const result = await pool.query(
            "SELECT profileid FROM userprofile WHERE userid = $1",
            [req.user.userid]
        );

        if (result.rows.length > 0) {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Please complete your profile first.",
                redirectTo: "/complete-profile"
            });
        }
    } catch (error) {
        console.error("Error checking profile:", error);
        next();
    }
};

// Refresh token middleware
export const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const newAccessToken = jwt.sign(
            { userid: decoded.userid, email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            token: newAccessToken
        });

    } catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid refresh token"
        });
    }
};

// ========== NEW: Cache-Integrated Middleware ==========

// Middleware to attach user data from cache (if available)
export const attachUserFromCache = async (req, res, next) => {
    try {
        const userId = req.user?.userid;
        if (!userId) {
            return next();
        }

        const { readUserFromCache } = await import('../Services/UserCacheService.js');
        
        const cachedData = await readUserFromCache(userId);
        
        if (cachedData) {
            // Attach cached user data to request for use in controllers
            req.cachedUserData = cachedData;
            req.cacheStatus = 'HIT';
        } else {
            req.cacheStatus = 'MISS';
        }
        
        next();
    } catch (error) {
        // Don't block the request if cache fails
        req.cacheStatus = 'ERROR';
        next();
    }
};

// Middleware to invalidate cache after updates
export const invalidateUserCacheOnUpdate = async (req, res, next) => {
    try {
        const userId = req.user?.userid;
        if (userId) {
            const { invalidateUserCache } = await import('../Services/UserCacheService.js');
            await invalidateUserCache(userId);
        }
        next();
    } catch (error) {
        // Don't block if cache invalidation fails
        next();
    }
};