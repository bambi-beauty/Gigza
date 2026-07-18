import express from "express";
import {
    DeleteReview,
    UpdateReview,
    GetMyReviews,
    GetReviews,
    createReview
} from "../Controllers/Reviews.js";

const router = express.Router();


router.post("/create-review",createReview);
router.get("/getReviews",GetReviews);
router.get("/getmyReviews",GetMyReviews);
router.delete("/DeleteReview",DeleteReview);


export default router;
