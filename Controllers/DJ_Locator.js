import pool from "../lib/dbConnect.js";
import s2 from 's2-geometry';

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Helper function to get S2 cells covering a radius
function getCoveringCells(lat, lng, radiusKm, minLevel = 12, maxLevel = 15) {
    const radiusMeters = radiusKm * 1000;
    const centerCell = s2.latLngToKey(lat, lng, minLevel);
    const covering = s2.latLngToCellIds(lat, lng, radiusMeters, maxLevel);
    
    return covering.map(cell => cell.toString());
}

// Main function: Find DJs within radius
export const LocateDj = async (req, res) => {
    try {
        const { latitude, longitude, radius_km = 1.5 } = req.body;
        const userId = req.user?.userid; // Optional: if user is logged in
        
        // Validate input
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required"
            });
        }
        
        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({
                success: false,
                message: "Invalid latitude. Must be between -90 and 90"
            });
        }
        
        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({
                success: false,
                message: "Invalid longitude. Must be between -180 and 180"
            });
        }
        
        if (radius_km < 0.1 || radius_km > 50) {
            return res.status(400).json({
                success: false,
                message: "Radius must be between 0.1km and 50km"
            });
        }
        
        // Method 1: Using S2 for fast indexing (Recommended for large datasets)
        // Get S2 covering cells for this radius
        const coveringCells = getCoveringCells(latitude, longitude, radius_km);
        
        let query = `
            SELECT 
                d.dj_id,
                d.dj_name,
                d.dj_experience,
                d.dj_skills,
                d.latitude,
                d.longitude,
                u.username,
                u.email,
                up.usertype,
                (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(d.latitude)) *
                        cos(radians(d.longitude) - radians($2)) +
                        sin(radians($1)) * sin(radians(d.latitude))
                    )
                ) AS distance_km,
                CASE 
                    WHEN COUNT(r.rating_id) > 0 THEN ROUND(AVG(r.rating_value), 1)
                    ELSE 0
                END AS average_rating,
                COUNT(r.rating_id) AS total_ratings
            FROM DJ_profile d
            JOIN userprofile up ON d.profileId = up.profileId
            JOIN users u ON up.userid = u.userid
            LEFT JOIN ratings r ON d.dj_id = r.dj_id
            WHERE 
        `;
        
        const queryParams = [latitude, longitude];
        
        // If we have S2 cells, use them for faster filtering
        if (coveringCells.length > 0) {
            query += ` d.s2_cell_id = ANY($3::bigint[]) `;
            queryParams.push(coveringCells.map(cell => BigInt(cell)));
        } else {
            // Fallback: rough bounding box filter
            const latDelta = radius_km / 111; // 1 degree latitude ≈ 111km
            const lonDelta = radius_km / (111 * Math.cos(latitude * Math.PI / 180));
            
            query += ` 
                d.latitude BETWEEN $3 AND $4 
                AND d.longitude BETWEEN $5 AND $6 
            `;
            queryParams.push(
                latitude - latDelta,
                latitude + latDelta,
                longitude - lonDelta,
                longitude + lonDelta
            );
        }
        
        query += `
            GROUP BY d.dj_id, d.dj_name, d.dj_experience, d.dj_skills, 
                     d.latitude, d.longitude, u.username, u.email, up.usertype
            HAVING 
                6371 * acos(
                    cos(radians($1)) * cos(radians(d.latitude)) *
                    cos(radians(d.longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(d.latitude))
                ) <= $7
            ORDER BY distance_km ASC
        `;
        
        queryParams.push(radius_km);
        
        const result = await pool.query(query, queryParams);
        
        // Format response
        const djs = result.rows.map(dj => ({
            ...dj,
            distance_km: parseFloat(dj.distance_km).toFixed(2),
            average_rating: parseFloat(dj.average_rating),
            is_within_radius: parseFloat(dj.distance_km) <= radius_km
        }));
        
        res.status(200).json({
            success: true,
            data: {
                center: {
                    latitude,
                    longitude,
                    radius_km
                },
                total_djs: djs.length,
                djs: djs,
                search_metadata: {
                    method: coveringCells.length > 0 ? "s2_index" : "bounding_box",
                    covering_cells_used: coveringCells.length,
                    search_time: new Date().toISOString()
                }
            }
        });
        
    } catch (err) {
        console.error(`Locate DJ error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error while locating DJs",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Alternative: Simpler version using PostGIS (if you have it installed)
export const LocateDjPostGIS = async (req, res) => {
    try {
        const { latitude, longitude, radius_km = 1.5 } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required"
            });
        }
        
        const query = `
            SELECT 
                d.dj_id,
                d.dj_name,
                d.dj_experience,
                d.dj_skills,
                d.latitude,
                d.longitude,
                u.username,
                u.email,
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(d.longitude, d.latitude), 4326)::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) / 1000 AS distance_km,
                COALESCE(AVG(r.rating_value), 0) AS average_rating,
                COUNT(r.rating_id) AS total_ratings
            FROM DJ_profile d
            JOIN userprofile up ON d.profileId = up.profileId
            JOIN users u ON up.userid = u.userid
            LEFT JOIN ratings r ON d.dj_id = r.dj_id
            WHERE ST_DWithin(
                ST_SetSRID(ST_MakePoint(d.longitude, d.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3 * 1000
            )
            GROUP BY d.dj_id, d.dj_name, d.dj_experience, d.dj_skills, 
                     d.latitude, d.longitude, u.username, u.email
            ORDER BY distance_km ASC
        `;
        
        const result = await pool.query(query, [longitude, latitude, radius_km]);
        
        res.status(200).json({
            success: true,
            data: {
                center: { latitude, longitude, radius_km },
                total_djs: result.rows.length,
                djs: result.rows
            }
        });
        
    } catch (err) {
        console.error(`PostGIS locate error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Update DJ's location (when DJ moves or updates their location)
export const UpdateDJLocation = async (req, res) => {
    try {
        const userId = req.user.userid;
        const { latitude, longitude } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required"
            });
        }
        
        // Get DJ profile for this user
        const djProfile = await pool.query(
            `SELECT d.dj_id 
             FROM DJ_profile d
             JOIN userprofile up ON d.profileId = up.profileId
             WHERE up.userid = $1`,
            [userId]
        );
        
        if (djProfile.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "DJ profile not found"
            });
        }
        
        // Calculate S2 cell ID for the location
        const s2CellId = s2.latLngToKey(latitude, longitude, 15);
        const s2CellBigInt = BigInt(s2.latLngToCellId(latitude, longitude, 15));
        
        // Update location
        await pool.query(
            `UPDATE DJ_profile 
             SET latitude = $1, 
                 longitude = $2, 
                 s2_cell_id = $3,
                 location_updated_at = CURRENT_TIMESTAMP
             WHERE dj_id = $4`,
            [latitude, longitude, s2CellBigInt, djProfile.rows[0].dj_id]
        );
        
        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            location: { latitude, longitude, s2_cell: s2CellId }
        });
        
    } catch (err) {
        console.error(`Update DJ location error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get DJs in a specific S2 cell (for real-time updates)
export const GetDJsByCell = async (req, res) => {
    try {
        const { cell_id } = req.params;
        const { radius_cells = 1 } = req.query; // Include neighboring cells
        
        let query = `
            SELECT 
                d.dj_id,
                d.dj_name,
                d.dj_skills,
                d.latitude,
                d.longitude,
                u.username,
                COALESCE(AVG(r.rating_value), 0) AS average_rating
            FROM DJ_profile d
            JOIN userprofile up ON d.profileId = up.profileId
            JOIN users u ON up.userid = u.userid
            LEFT JOIN ratings r ON d.dj_id = r.dj_id
            WHERE d.s2_cell_id = $1
        `;
        
        const params = [cell_id];
        
        // Optional: Include neighboring cells for seamless transitions
        if (radius_cells > 1) {
            // This would require getting neighboring S2 cells
            // Implementation depends on your S2 library
        }
        
        query += ` GROUP BY d.dj_id, d.dj_name, d.dj_skills, d.latitude, d.longitude, u.username`;
        
        const result = await pool.query(query, params);
        
        res.status(200).json({
            success: true,
            cell_id,
            total_djs: result.rows.length,
            djs: result.rows
        });
        
    } catch (err) {
        console.error(`Get DJs by cell error: ${err.message}`);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Add this function to your DJ_Locator.js file
export async function findNearbyDJsWithS2(latitude, longitude, radius_km = 1.5) {
    try {
        const coveringCells = getCoveringCells(latitude, longitude, radius_km);
        
        let query = `
            SELECT 
                d.dj_id,
                d.dj_name,
                d.dj_experience,
                d.dj_skills,
                d.latitude,
                d.longitude,
                u.username,
                (
                    6371 * acos(
                        cos(radians($1)) * cos(radians(d.latitude)) *
                        cos(radians(d.longitude) - radians($2)) +
                        sin(radians($1)) * sin(radians(d.latitude))
                    )
                ) AS distance_km,
                COALESCE(AVG(r.rating_value), 0) AS average_rating,
                COUNT(r.rating_id) AS total_ratings
            FROM DJ_profile d
            JOIN userprofile up ON d.profileId = up.profileId
            JOIN users u ON up.userid = u.userid
            LEFT JOIN ratings r ON d.dj_id = r.dj_id
            WHERE d.s2_cell_id = ANY($3::bigint[])
            GROUP BY d.dj_id, d.dj_name, d.dj_experience, d.dj_skills, 
                     d.latitude, d.longitude, u.username
            HAVING 
                6371 * acos(
                    cos(radians($1)) * cos(radians(d.latitude)) *
                    cos(radians(d.longitude) - radians($2)) +
                    sin(radians($1)) * sin(radians(d.latitude))
                ) <= $4
            ORDER BY distance_km ASC
        `;
        
        const result = await pool.query(query, [
            latitude, 
            longitude, 
            coveringCells.map(cell => BigInt(cell)),
            radius_km
        ]);
        
        return result.rows;
    } catch (err) {
        console.error(`findNearbyDJsWithS2 error: ${err.message}`);
        return [];
    }
}