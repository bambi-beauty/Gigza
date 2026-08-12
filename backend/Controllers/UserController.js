import pool from "../lib/dbConnect.js";
import jwt from 'jsonwebtoken';
import bcrypt from "bcryptjs";
import { validateEmail, PasswordCheck, HashPassword } from "../utils/EmailAndPasswordValidator.js";
import { sendOTPEmail, verifyOTPCode, resendOTP } from "../Services/EmailNotification.js";
import { writeUserToCache, readUserFromCache, invalidateUserCache } from "../Services/UserCacheService.js";

// 1. Sign up (Stage 1)
export const Signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Missing input fields. Please provide username, email, and password."
            });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid email format" 
            });
        }
        
        if (!PasswordCheck(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters with uppercase, lowercase, and numbers"
            });
        }
        
        // Check if user exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User already exists with this email",
                code: "DUPLICATE_USER"
            });
        }

        // Hash password
        const hashedPassword = await HashPassword(password);
        
        // Create user
        const result = await pool.query(
            "INSERT INTO users (username, email, password, email_verified) VALUES ($1, $2, $3, $4) RETURNING userid, username, email",
            [username, email.toLowerCase(), hashedPassword, false]
        );
        
        // Send OTP email
        await sendOTPEmail(email, result.rows[0].userid);
        
        res.status(201).json({
            success: true,
            message: "User created successfully. OTP sent to your email. Please verify to continue.",
            user: {
                id: result.rows[0].userid,
                username: result.rows[0].username,
                email: result.rows[0].email
            },
            nextStep: "verify_otp"
        });

    } catch (err) {
        console.error(`Failed to create user: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error while creating user",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 2. Verify OTP (Stage 2)
export const VerifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ 
                success: false,
                message: "Email and OTP are required" 
            });
        }
        
        const verification = await verifyOTPCode(email, otp);
        
        if (!verification.valid) {
            return res.status(400).json({ 
                success: false,
                message: verification.message 
            });
        }
        
        // Update email verification status
        await pool.query(
            "UPDATE users SET email_verified = true WHERE userid = $1",
            [verification.userId]
        );
        
        // Create user profile (only with usertype - no date_of_birth)
        await pool.query(
            "INSERT INTO userprofile (userid, usertype) VALUES ($1, $2) ON CONFLICT (userid) DO NOTHING",
            [verification.userId, 'free']
        );
        
        // Get user data for cache
        const userResult = await pool.query(
            "SELECT userid, username, email, email_verified, created_at FROM users WHERE userid = $1",
            [verification.userId]
        );
        
        const profileResult = await pool.query(
            "SELECT usertype, created_at FROM userprofile WHERE userid = $1",
            [verification.userId]
        );
        
        const userData = {
            user: userResult.rows[0],
            profile: profileResult.rows[0] || { usertype: 'free' }
        };
        
        // Write to cache after verification
        await writeUserToCache(verification.userId, userData);
        
        const token = jwt.sign(
            { 
                userid: verification.userId, 
                email: email,
                username: userResult.rows[0].username,
                usertype: 'free'
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        
        res.status(200).json({
            success: true,
            message: "Email verified successfully! You can now complete your profile.",
            token: token,
            userId: verification.userId,
            nextStep: "complete_profile"
        });
        
    } catch (err) {
        console.error(`Failed to verify OTP: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error while verifying OTP"
        });
    }
};

// 3. Resend OTP
export const ResendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: "Email is required" 
            });
        }
        
        const result = await resendOTP(email);
        
        if (!result.success) {
            return res.status(429).json({ 
                success: false,
                message: result.message 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: "New OTP sent to your email" 
        });
        
    } catch (err) {
        console.error(`Failed to resend OTP: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error while resending OTP"
        });
    }
};

// 4. Complete Profile (Stage 3 - After OTP verification)
// Note: Since your userprofile table doesn't have full_name, bio, date_of_birth,
// you might want to add those columns or store them elsewhere.
// For now, this updates only usertype.
export const CompleteProfile = async (req, res) => {
    try {
        const { userid, usertype } = req.body;
        
        // Verify user exists and email is verified
        const user = await pool.query(
            "SELECT * FROM users WHERE userid = $1 AND email_verified = true",
            [userid]
        );
        
        if (user.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "User not found or email not verified. Please verify your email first."
            });
        }
        
        // Update usertype in profile
        const profile = await pool.query(
            `UPDATE userprofile 
             SET usertype = $1
             WHERE userid = $2
             RETURNING *`,
            [usertype || 'free', userid]
        );
        
        // If profile doesn't exist, create it
        if (profile.rows.length === 0) {
            const insertResult = await pool.query(
                `INSERT INTO userprofile (userid, usertype) 
                 VALUES ($1, $2)
                 RETURNING *`,
                [userid, usertype || 'free']
            );
            profile.rows = insertResult.rows;
        }
        
        // Invalidate old cache
        await invalidateUserCache(userid);
        
        // Get fresh user data
        const userResult = await pool.query(
            "SELECT userid, username, email, email_verified, created_at FROM users WHERE userid = $1",
            [userid]
        );
        
        const freshData = {
            user: userResult.rows[0],
            profile: profile.rows[0]
        };
        
        // Write fresh cache
        await writeUserToCache(userid, freshData);
        
        res.status(200).json({
            success: true,
            message: "Profile completed successfully! Welcome aboard!",
            profile: profile.rows[0]
        });
        
    } catch (err) {
        console.error(`Failed to complete profile: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error while completing profile"
        });
    }
};

// 5. Login
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Missing input fields. Please provide email and password."
            });
        }
        // Find user by email
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }
        
        const user = result.rows[0];

        // Check if email is verified
        if (user.email_verified === false) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in",
                needsVerification: true,
                email: user.email
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: "Invalid email or password" 
            });
        }

        // Get user profile for cache
        const profileResult = await pool.query(
            "SELECT usertype FROM userprofile WHERE userid = $1",
            [user.userid]
        );
        
        const userProfile = profileResult.rows[0] || { usertype: 'free' };
        
        // Write to cache (async - don't block response)
        const cacheData = {
            user: {
                id: user.userid,
                username: user.username,
                email: user.email,
                email_verified: user.email_verified,
                created_at: user.created_at
            },
            profile: userProfile
        };
        
        // Fire and forget - cache write doesn't block login
        writeUserToCache(user.userid, cacheData).catch(err => {
            console.error(`Background cache write failed: ${err.message}`);
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                userid: user.userid, 
                email: user.email,
                username: user.username,
                usertype: userProfile.usertype || 'free'
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: "7d" }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
            user: {
                id: user.userid,
                username: user.username,
                email: user.email,
                email_verified: user.email_verified,
                usertype: userProfile.usertype || 'free'
            }
        });

    } catch (err) {
        console.error(`Login error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 6. Get User Profile (With Cache Integration)
export const GetUserProfile = async (req, res) => {
    try {
        const userId = req.user.userid;
        
        // Try cache first
        let userData = await readUserFromCache(userId);
        
        if (userData) {
            console.log(`Cache HIT for user ${userId}`);
            return res.status(200).json({
                success: true,
                source: "cache",
                data: userData
            });
        }
        
        // Cache MISS - get from database
        console.log(`Cache MISS for user ${userId} - querying DB`);
        
        const userResult = await pool.query(
            "SELECT userid, username, email, email_verified, created_at FROM users WHERE userid = $1",
            [userId]
        );
        
        const profileResult = await pool.query(
            "SELECT usertype, created_at FROM userprofile WHERE userid = $1",
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        const freshData = {
            user: userResult.rows[0],
            profile: profileResult.rows[0] || { usertype: 'free' }
        };
        
        // Write to cache for next time (async)
        writeUserToCache(userId, freshData).catch(err => {
            console.error(`Cache write failed: ${err.message}`);
        });
        
        res.status(200).json({
            success: true,
            source: "database",
            data: freshData
        });
        
    } catch (err) {
        console.error(`GetUserProfile error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 7. Update User Profile (Invalidates Cache)
export const UpdateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userid;
        const { usertype } = req.body;
        
        if (!usertype) {
            return res.status(400).json({
                success: false,
                message: "usertype is required for update"
            });
        }
        
        // Update usertype in profile
        const profile = await pool.query(
            `UPDATE userprofile 
             SET usertype = $1
             WHERE userid = $2
             RETURNING *`,
            [usertype, userId]
        );
        
        if (profile.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Profile not found. Please complete your profile first."
            });
        }
        
        // Invalidate cache
        await invalidateUserCache(userId);
        
        // Get fresh user data
        const userResult = await pool.query(
            "SELECT userid, username, email, email_verified, created_at FROM users WHERE userid = $1",
            [userId]
        );
        
        const freshData = {
            user: userResult.rows[0],
            profile: profile.rows[0]
        };
        
        // Write fresh cache
        await writeUserToCache(userId, freshData);
        
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile: profile.rows[0]
        });
        
    } catch (err) {
        console.error(`UpdateUserProfile error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 8. Get User by ID (For admin or self)
export const GetUserById = async (req, res) => {
    try {
        const requestedUserId = parseInt(req.params.id);
        const loggedInUserId = req.user.userid;
        const userType = req.user.usertype;
        
        // Check permissions
        if (loggedInUserId !== requestedUserId && userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only access your own resources."
            });
        }
        
        // Try cache first
        let userData = await readUserFromCache(requestedUserId);
        
        if (userData) {
            return res.status(200).json({
                success: true,
                source: "cache",
                data: userData
            });
        }
        
        // Get from database
        const userResult = await pool.query(
            "SELECT userid, username, email, email_verified, created_at FROM users WHERE userid = $1",
            [requestedUserId]
        );
        
        const profileResult = await pool.query(
            "SELECT usertype, created_at FROM userprofile WHERE userid = $1",
            [requestedUserId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        const freshData = {
            user: userResult.rows[0],
            profile: profileResult.rows[0] || { usertype: 'free' }
        };
        
        // Cache for next time
        writeUserToCache(requestedUserId, freshData).catch(() => {});
        
        res.status(200).json({
            success: true,
            source: "database",
            data: freshData
        });
        
    } catch (err) {
        console.error(`GetUserById error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 9. Logout
export const Logout = async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully. Please remove the token from client storage."
    });
};

// 10. Delete User Account (with cache cleanup)
export const DeleteUser = async (req, res) => {
    try {
        const userId = req.user.userid;
        
        // Invalidate cache first
        await invalidateUserCache(userId);
        
        // Delete user (cascade will delete profile)
        await pool.query(
            "DELETE FROM users WHERE userid = $1",
            [userId]
        );
        
        res.status(200).json({
            success: true,
            message: "User account deleted successfully"
        });
        
    } catch (err) {
        console.error(`DeleteUser error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};