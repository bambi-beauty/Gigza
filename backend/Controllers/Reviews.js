import pool from "../lib/dbConnect.js";

export const createReview = async (req, res) => {
    try {
        const { dj_id, review_text, rating_value } = req.body;
        const userId = req.user.userid; // From auth middleware
        
        // Validate input
        if (!dj_id) {
            return res.status(400).json({
                success: false,
                message: "DJ ID is required"
            });
        }
        
        if (!review_text || review_text.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: "Review must be at least 10 characters long"
            });
        }
        
        // Check if DJ exists
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
        
        // Check if user already reviewed this DJ
        const existingReview = await pool.query(
            "SELECT * FROM reviews WHERE dj_id = $1 AND user_id = $2",
            [dj_id, userId]
        );
        
        if (existingReview.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this DJ. You can update your existing review."
            });
        }
        
        let rating_id = null;
        
        // If rating value provided, create rating first
        if (rating_value && rating_value >= 1 && rating_value <= 5) {
            // Check if user already rated this DJ
            const existingRating = await pool.query(
                "SELECT rating_id FROM ratings WHERE dj_id = $1 AND user_id = $2",
                [dj_id, userId]
            );
            
            if (existingRating.rows.length > 0) {
                rating_id = existingRating.rows[0].rating_id;
                // Update existing rating
                await pool.query(
                    "UPDATE ratings SET rating_value = $1, updated_at = CURRENT_TIMESTAMP WHERE rating_id = $2",
                    [rating_value, rating_id]
                );
            } else {
                // Create new rating
                const newRating = await pool.query(
                    `INSERT INTO ratings (dj_id, user_id, rating_value) 
                     VALUES ($1, $2, $3) 
                     RETURNING rating_id`,
                    [dj_id, userId, rating_value]
                );
                rating_id = newRating.rows[0].rating_id;
            }
        }
        
        // Create review
        const review = await pool.query(
            `INSERT INTO reviews (dj_id, user_id, rating_id, review_text, is_approved) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING review_id, dj_id, user_id, rating_id, review_text, is_approved, created_at`,
            [dj_id, userId, rating_id, review_text.trim(), false] // Not approved by default
        );
        
        res.status(201).json({
            success: true,
            message: "Review submitted successfully. It will appear after moderation.",
            review: review.rows[0]
        });
        
    } catch (err) {
        console.error(`Create review error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 2. Get Reviews for a DJ (Public - only approved reviews)
export const GetReviews = async (req, res) => {
    try {
        const { dj_id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Check if DJ exists
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
        
        // Get approved reviews with user info
        const reviews = await pool.query(
            `SELECT r.review_id, r.review_text, r.created_at, u.username, rat.rating_value
             FROM reviews r
             JOIN users u ON r.user_id = u.userid
             LEFT JOIN ratings rat ON r.rating_id = rat.rating_id
             WHERE r.dj_id = $1 AND r.is_approved = true
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [dj_id, limit, offset]
        );
        
        // Get total count for pagination
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM reviews WHERE dj_id = $1 AND is_approved = true",
            [dj_id]
        );
        
        res.status(200).json({
            success: true,
            reviews: reviews.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count),
                total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
        
    } catch (err) {
        console.error(`Get reviews error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 3. Get User's Own Reviews (User checks their reviews)
export const GetMyReviews = async (req, res) => {
    try {
        const userId = req.user.userid;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        const reviews = await pool.query(
            `SELECT r.review_id, r.review_text, r.is_approved, r.created_at, d.dj_name
             FROM reviews r
             JOIN DJ_profile d ON r.dj_id = d.dj_id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM reviews WHERE user_id = $1",
            [userId]
        );
        
        res.status(200).json({
            success: true,
            reviews: reviews.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count),
                total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
        
    } catch (err) {
        console.error(`Get my reviews error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 4. Update a Review (User updates their own review)
export const UpdateReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const { review_text, rating_value } = req.body;
        const userId = req.user.userid;
        
        // Check if review exists and belongs to user
        const existingReview = await pool.query(
            "SELECT * FROM reviews WHERE review_id = $1 AND user_id = $2",
            [review_id, userId]
        );
        
        if (existingReview.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission"
            });
        }
        
        const dj_id = existingReview.rows[0].dj_id;
        
        // Update review text if provided
        if (review_text && review_text.trim().length >= 10) {
            await pool.query(
                `UPDATE reviews 
                 SET review_text = $1, updated_at = CURRENT_TIMESTAMP, is_approved = false 
                 WHERE review_id = $2`,
                [review_text.trim(), review_id]
            );
        } else if (review_text) {
            return res.status(400).json({
                success: false,
                message: "Review must be at least 10 characters long"
            });
        }
        
        // Update rating if provided
        if (rating_value && rating_value >= 1 && rating_value <= 5) {
            // Check if user has a rating for this DJ
            const existingRating = await pool.query(
                "SELECT rating_id FROM ratings WHERE dj_id = $1 AND user_id = $2",
                [dj_id, userId]
            );
            
            if (existingRating.rows.length > 0) {
                // Update existing rating
                await pool.query(
                    "UPDATE ratings SET rating_value = $1, updated_at = CURRENT_TIMESTAMP WHERE rating_id = $2",
                    [rating_value, existingRating.rows[0].rating_id]
                );
            } else {
                // Create new rating
                const newRating = await pool.query(
                    `INSERT INTO ratings (dj_id, user_id, rating_value) 
                     VALUES ($1, $2, $3) 
                     RETURNING rating_id`,
                    [dj_id, userId, rating_value]
                );
                
                // Link rating to review
                await pool.query(
                    "UPDATE reviews SET rating_id = $1 WHERE review_id = $2",
                    [newRating.rows[0].rating_id, review_id]
                );
            }
        }
        
        res.status(200).json({
            success: true,
            message: "Review updated successfully. It will be re-moderated."
        });
        
    } catch (err) {
        console.error(`Update review error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 5. Delete a Review (User deletes their own review)
export const DeleteReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const userId = req.user.userid;
        
        // Check if review exists and belongs to user
        const review = await pool.query(
            "SELECT * FROM reviews WHERE review_id = $1 AND user_id = $2",
            [review_id, userId]
        );
        
        if (review.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission"
            });
        }
        
        // Delete the review
        await pool.query(
            "DELETE FROM reviews WHERE review_id = $1",
            [review_id]
        );
        
        res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
        
    } catch (err) {
        console.error(`Delete review error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 6. Admin: Get All Pending Reviews
export const GetPendingReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const reviews = await pool.query(
            `SELECT r.review_id, r.review_text, r.created_at, u.username, d.dj_name
             FROM reviews r
             JOIN users u ON r.user_id = u.userid
             JOIN DJ_profile d ON r.dj_id = d.dj_id
             WHERE r.is_approved = false
             ORDER BY r.created_at ASC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM reviews WHERE is_approved = false"
        );
        
        res.status(200).json({
            success: true,
            reviews: reviews.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count),
                total_pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
            }
        });
        
    } catch (err) {
        console.error(`Get pending reviews error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 7. Admin: Approve a Review
export const ApproveReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        
        const review = await pool.query(
            "UPDATE reviews SET is_approved = true WHERE review_id = $1 RETURNING *",
            [review_id]
        );
        
        if (review.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        
        res.status(200).json({
            success: true,
            message: "Review approved successfully",
            review: review.rows[0]
        });
        
    } catch (err) {
        console.error(`Approve review error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 8. Admin: Reject/Delete a Review
export const RejectReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        
        const review = await pool.query(
            "DELETE FROM reviews WHERE review_id = $1 RETURNING *",
            [review_id]
        );
        
        if (review.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }
        
        res.status(204).json({
            success: true,
            message: "Review rejected and deleted successfully"
        });
        
    } catch (err) {
        console.error(`Reject review error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};