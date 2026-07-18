import express from 'express';
import {
    LocateDj,
    LocateDjPostGIS,
    UpdateDJLocation,
    GetDJsByCell
} from '../Controllers/DJ_Locator.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ========== PUBLIC ROUTES (No authentication required) ==========

/**
 * @route   POST /api/djs/locate
 * @desc    Find DJs within a radius of your location
 * @access  Public (or authenticated if you want to track user history)
 * @body    { latitude, longitude, radius_km }
 * @example 
 *   POST /api/djs/locate
 *   {
 *       "latitude": -26.195246,
 *       "longitude": 28.034088,
 *       "radius_km": 1.5
 *   }
 */
router.post('/djs/locate', LocateDj);

/**
 * @route   POST /api/djs/locate/postgis
 * @desc    Find DJs using PostGIS (alternative method)
 * @access  Public
 * @body    { latitude, longitude, radius_km }
 */
router.post('/djs/locate/postgis', LocateDjPostGIS);

/**
 * @route   GET /api/djs/cell/:cell_id
 * @desc    Get DJs in a specific S2 cell
 * @access  Public
 * @params  cell_id - S2 cell ID
 * @query   radius_cells - Include neighboring cells (optional)
 * @example 
 *   GET /api/djs/cell/89c258c?radius_cells=1
 */
router.get('/djs/cell/:cell_id', GetDJsByCell);

// ========== PROTECTED ROUTES (Authentication required) ==========

/**
 * @route   PUT /api/dj/location
 * @desc    Update DJ's current location (for DJ users only)
 * @access  Private (DJ only)
 * @body    { latitude, longitude }
 * @example 
 *   PUT /api/dj/location
 *   {
 *       "latitude": -26.195246,
 *       "longitude": 28.034088
 *   }
 */
router.put('/dj/location', authenticateToken, UpdateDJLocation);

/**
 * @route   GET /api/djs/nearby
 * @desc    Get nearby DJs with real-time WebSocket subscription
 * @access  Private (for authenticated users)
 * @query   latitude, longitude, radius_km
 * @example 
 *   GET /api/djs/nearby?latitude=-26.195246&longitude=28.034088&radius_km=1.5
 */
router.get('/djs/nearby', authenticateToken, async (req, res) => {
    try {
        const { latitude, longitude, radius_km = 1.5 } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required"
            });
        }
        
        // Import the findNearbyDJsWithS2 function
        const { findNearbyDJsWithS2 } = await import('../services/DJ_Locator.js');
        
        const nearbyDJs = await findNearbyDJsWithS2(
            parseFloat(latitude), 
            parseFloat(longitude), 
            parseFloat(radius_km)
        );
        
        res.status(200).json({
            success: true,
            data: {
                center: {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    radius_km: parseFloat(radius_km)
                },
                total: nearbyDJs.length,
                djs: nearbyDJs
            }
        });
        
    } catch (err) {
        console.error(`Nearby DJs error: ${err.message}`);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

/**
 * @route   GET /api/dj/location/history
 * @desc    Get DJ's location history (for DJ users)
 * @access  Private (DJ only)
 */
router.get('/dj/location/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userid;
        
        const result = await pool.query(
            `SELECT d.dj_id, d.latitude, d.longitude, d.location_updated_at
             FROM DJ_profile d
             JOIN userprofile up ON d.profileId = up.profileId
             WHERE up.userid = $1
             ORDER BY d.location_updated_at DESC
             LIMIT 10`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No location history found"
            });
        }
        
        res.status(200).json({
            success: true,
            history: result.rows
        });
        
    } catch (err) {
        console.error(`Location history error: ${err.message}`);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

export default router;