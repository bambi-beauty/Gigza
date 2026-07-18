import pool from "../lib/dbConnect.js";

// 1. Create Rating (User rates a DJ)
export const CreateRating = async (req, res) => {
    try {
        // Get the DJ being rated from request body
        const { dj_id, rating_value } = req.body;
        
        // Get the user who is giving the rating from the authenticated token
        const userId = req.user.userid;  // ← This is the user giving the rating
        
        // Validate rating value
        if (!rating_value || rating_value < 1 || rating_value > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating value must be between 1 and 5"
            });
        }
        
        // Validate DJ ID
        if (!dj_id) {
            return res.status(400).json({
                success: false,
                message: "DJ ID is required"
            });
        }
        
        // Check if the DJ exists
        const djExists = await pool.query(
            "SELECT * FROM DJ_profile WHERE dj_id = $1",
            [dj_id]
        );
        
        if (djExists.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "DJ not found"
            });
        }
        
        // Check if this user has already rated this DJ
        const existingRating = await pool.query(
            "SELECT * FROM ratings WHERE dj_id = $1 AND user_id = $2",
            [dj_id, userId]
        );
        
        let result;
        
        if (existingRating.rows.length > 0) {
            // User already rated this DJ - update the rating
            result = await pool.query(
                `UPDATE ratings 
                 SET rating_value = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE dj_id = $2 AND user_id = $3 
                 RETURNING rating_id, dj_id, user_id, rating_value, created_at`,
                [rating_value, dj_id, userId]
            );
            
            res.status(200).json({
                success: true,
                message: "Your rating has been updated successfully",
                rating: result.rows[0]
            });
        } else {
            // User hasn't rated this DJ yet - create new rating
            result = await pool.query(
                `INSERT INTO ratings (dj_id, user_id, rating_value) 
                 VALUES ($1, $2, $3) 
                 RETURNING rating_id, dj_id, user_id, rating_value, created_at`,
                [dj_id, userId, rating_value]
            );
            
            res.status(201).json({
                success: true,
                message: "Your rating has been submitted successfully",
                rating: result.rows[0]
            });
        }
        
    } catch (err) {
        console.error(`Rating error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error when creating a rating",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// 2. Get All Ratings for a Specific DJ (Public)
export const GetDJRatings = async (req, res) => {
    try {
        const { dj_id } = req.params;
        
        // Get rating summary
        const summary = await pool.query(
            `SELECT 
                COUNT(rating_id) as total_ratings,
                ROUND(AVG(rating_value), 2) as average_rating,
                COUNT(CASE WHEN rating_value = 5 THEN 1 END) as five_star,
                COUNT(CASE WHEN rating_value = 4 THEN 1 END) as four_star,
                COUNT(CASE WHEN rating_value = 3 THEN 1 END) as three_star,
                COUNT(CASE WHEN rating_value = 2 THEN 1 END) as two_star,
                COUNT(CASE WHEN rating_value = 1 THEN 1 END) as one_star
            FROM ratings 
            WHERE dj_id = $1`,
            [dj_id]
        );
        
        // Get individual ratings (without revealing who rated)
        const ratings = await pool.query(
            `SELECT rating_value, created_at
             FROM ratings
             WHERE dj_id = $1
             ORDER BY created_at DESC
             LIMIT 20`,
            [dj_id]
        );
        
        res.status(200).json({
            success: true,
            dj_id: dj_id,
            summary: summary.rows[0],
            recent_ratings: ratings.rows
        });
        
    } catch (err) {
        console.error(`Get ratings error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 3. Get User's Rating for a Specific DJ (User checks their own rating)
export const GetMyRating = async (req, res) => {
    try {
        const userId = req.user.userid;
        const { dj_id } = req.params;
        
        const rating = await pool.query(
            "SELECT rating_value, created_at, updated_at FROM ratings WHERE dj_id = $1 AND user_id = $2",
            [dj_id, userId]
        );
        
        res.status(200).json({
            success: true,
            has_rated: rating.rows.length > 0,
            rating: rating.rows[0] || null
        });
        
    } catch (err) {
        console.error(`Get my rating error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 4. Delete User's Rating (User removes their rating)
export const DeleteMyRating = async (req, res) => {
    try {
        const userId = req.user.userid;
        const { dj_id } = req.params;
        
        const result = await pool.query(
            "DELETE FROM ratings WHERE dj_id = $1 AND user_id = $2 RETURNING *",
            [dj_id, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "You haven't rated this DJ yet"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Your rating has been removed"
        });
        
    } catch (err) {
        console.error(`Delete rating error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};