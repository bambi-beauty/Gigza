import pool from "../lib/dbConnect";

export const createDJBooking = async (req, res) => {
    try{
        const { dj_id, event_id, booking_date } = req.body;

        // Validate input
        if (!dj_id || !event_id || !booking_date) {
            return res.status(400).json({ error: "Missing required fields: dj_id, event_id, booking_date" });
        }
        // Insert booking into the database
        const result = await
            pool.query(
                "INSERT INTO dj_bookings (dj_id, event_id, booking_date) VALUES ($1, $2, $3) RETURNING *",
                [dj_id, event_id, booking_date]
            );
        res.status(201).json(result.rows[0]);
        
    }
    catch(error){
        console.error("Error creating DJ booking:", error);
        res.status(500).json({ error: "An error occurred while creating the DJ booking." });

    }
}