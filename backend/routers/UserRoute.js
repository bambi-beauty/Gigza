import express from 'express';
import {
    Signup,
    VerifyOTP,
    ResendOTP,
    CompleteProfile,
    Login,
    GetUserProfile,
    UpdateUserProfile,
    GetUserById,
    Logout
} from '../controllers/userController.js';
import {
    authenticateToken,
    isAdmin,
    isOwnerOrAdmin,
    isEmailVerified,
    checkProfileComplete,
    attachUserFromCache,
    invalidateUserCacheOnUpdate
} from '../middleware/auth.js';

import {
    SignupLimit,
    LoginLimit,
    OTPLimit,
    ResendOTPLimit
} from '../Rate-limit/RateLimit.js'

const router = express.Router();

// ========== PUBLIC ROUTES (No Authentication Required) ==========
router.post('/auth/signup', SignupLimit,Signup);
router.post('/auth/verify-otp', OTPLimit,VerifyOTP);
router.post('/auth/resend-otp', ResendOTP,ResendOTP);
router.post('/auth/login', LoginLimit,Login);

// ========== PROTECTED ROUTES (Authentication Required) ==========
// Apply authenticateToken to all routes below this middleware
router.use(authenticateToken);

// Profile routes with cache integration
router.get('/auth/profile', attachUserFromCache, GetUserProfile);
router.put('/auth/profile', invalidateUserCacheOnUpdate, UpdateUserProfile);
router.put('/auth/complete-profile', invalidateUserCacheOnUpdate, CompleteProfile);
router.post('/auth/logout', Logout);

// User lookup (self or admin)
router.get('/users/:id', isOwnerOrAdmin, GetUserById);

// Admin-only routes
router.get('/admin/users', isAdmin, async (req, res) => {
    try {
        const pool = (await import('../lib/dbConnect.js')).default;
        const result = await pool.query(
            "SELECT u.userid, u.username, u.email, u.email_verified, u.created_at, p.usertype, p.full_name FROM users u LEFT JOIN userprofile p ON u.userid = p.userid"
        );
        res.status(200).json({
            success: true,
            users: result.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Routes that require email verification
router.get('/auth/verified-only', isEmailVerified, (req, res) => {
    res.json({ success: true, message: "You have access to verified-only content" });
});

// Routes that require complete profile
router.get('/auth/profile-complete', checkProfileComplete, (req, res) => {
    res.json({ success: true, message: "Your profile is complete" });
});
export default router;