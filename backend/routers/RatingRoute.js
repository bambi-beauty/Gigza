import express from "express";
import {
    DeleteMyRating,
    GetMyRating,
    GetDJRatings,
    CreateRating
} from "../Controllers/Rating.js"

const router = express.Router();


router.post("/create-rating",CreateRating);
router.get("/getMyRating",GetMyRating);
router.get("/GetDJRating",GetDJRatings);
router.delete("/delete-rating",DeleteMyRating)

export default router;

