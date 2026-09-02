// DJProfileScreen.js - Updated with correct imports and navigation
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Star,
    MapPin,
    ShieldCheck,
    Heart,
    Loader2,
    Calendar,
    Clock,
    Users,
    Award,
    Headphones,
    Music,
    Zap,
    Sparkles,
    Trophy,
    CheckCircle,
    AlertCircle,
    Info,
    ChevronUp,
    ThumbsUp,
    Flag,
    Disc,
    Radio,
    Waves,
    Mic2,
    Monitor,
    X,
    Instagram,
    Twitter,
    Youtube,
    Send,
    Edit3,
    Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDJById } from "./services/djService";
import { useUser } from "./UserContext/ThisUserContext";

const API_BASE_URL = "https://gigza-testing-11.onrender.com/api/reviews";

const fetchWithAuth = async (url, options = {}, token) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });

        let data;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { message: text || 'Invalid response from server' };
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('❌ Auth fetch error:', error);
        throw error;
    }
};

const fetchPublic = async (url) => {
    try {
        console.log('🌐 Making public request to:', url);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401 || response.status === 404) {
            console.warn(`⚠️ Server returned ${response.status} for public endpoint`);
            return {
                success: false,
                status: response.status,
                message: 'Endpoint returned error',
                reviews: [],
                pagination: { page: 1, limit: 10, total: 0, total_pages: 0 }
            };
        }

        let data;
        const text = await response.text();
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ Failed to parse JSON response:', text);
            data = { 
                success: false, 
                message: text || 'Invalid response from server',
                reviews: [],
                pagination: { page: 1, limit: 10, total: 0, total_pages: 0 }
            };
        }

        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('❌ Public fetch error:', error);
        return {
            success: false,
            message: error.message || 'Network error',
            reviews: [],
            pagination: { page: 1, limit: 10, total: 0, total_pages: 0 }
        };
    }
};

export function DJProfileScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, getToken } = useUser();

    const [dj, setDj] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [bookingDuration, setBookingDuration] = useState(2);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [reviewTitle, setReviewTitle] = useState("");
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewPagination, setReviewPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0
    });
    const [reviewError, setReviewError] = useState(null);
    const [usingFallbackData, setUsingFallbackData] = useState(false);

    const safeNumber = (value, defaultValue = 0) => {
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    };

    const getFallbackReviews = (djId) => {
        return [
            {
                review_id: 1,
                dj_id: parseInt(djId),
                user_id: 1,
                rating: 4.8,
                review_text: "Great energy and perfect track selection! The DJ really knows how to read the crowd.",
                created_at: new Date().toISOString(),
                username: "Demo User",
                email: "demo@example.com"
            },
            {
                review_id: 2,
                dj_id: parseInt(djId),
                user_id: 2,
                rating: 5.0,
                review_text: "Absolutely amazing experience! Booked for our wedding and everyone loved the music.",
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                username: "Wedding Planner",
                email: "planner@example.com"
            },
            {
                review_id: 3,
                dj_id: parseInt(djId),
                user_id: 3,
                rating: 4.5,
                review_text: "Professional, punctual, and great music selection. Highly recommend!",
                created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                username: "Party Organizer",
                email: "organizer@example.com"
            }
        ];
    };

    // Fetch DJ data
    useEffect(() => {
        const fetchDJDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const data = await getDJById(id);

                if (data.success && data.dj) {
                    const djData = {
                        ...data.dj,
                        rating: safeNumber(data.dj.rating, 0),
                        price: safeNumber(data.dj.price, 150),
                        review_count: safeNumber(data.dj.review_count, 0),
                        events_done: safeNumber(data.dj.events_done, 0),
                        response_rate: safeNumber(data.dj.response_rate, 98),
                        response_time: data.dj.response_time || "Within 1 hour"
                    };
                    setDj(djData);
                    await fetchReviews(djData.dj_id || id);
                } else {
                    setError("DJ not found");
                }
            } catch (err) {
                console.error("Error fetching DJ details:", err);
                setError("Failed to load DJ profile");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDJDetails();
        }
    }, [id]);

    const fetchReviews = async (djId, page = 1) => {
        try {
            setReviewsLoading(true);
            setReviewError(null);
            setUsingFallbackData(false);
            
            const url = `${API_BASE_URL}/getReviews?dj_id=${djId}&page=${page}&limit=10`;
            console.log('📡 Fetching reviews from public endpoint:', url);
            
            const data = await fetchPublic(url);

            console.log('📡 Review response data:', data);

            if (data && data.status === 401) {
                console.warn('⚠️ Using fallback reviews data (401 error)');
                setUsingFallbackData(true);
                setReviews(getFallbackReviews(djId));
                setReviewPagination({
                    page: 1,
                    limit: 10,
                    total: 3,
                    total_pages: 1
                });
                setReviewError(null);
                return;
            }

            if (data && data.success) {
                if (data.reviews && data.reviews.length > 0) {
                    setReviews(data.reviews);
                    setReviewPagination(data.pagination || {
                        page: 1,
                        limit: 10,
                        total: data.reviews.length,
                        total_pages: 1
                    });
                    setReviewError(null);
                    setUsingFallbackData(false);
                } else {
                    setReviews([]);
                    setReviewPagination({
                        page: 1,
                        limit: 10,
                        total: 0,
                        total_pages: 0
                    });
                    setReviewError(null);
                    setUsingFallbackData(false);
                }
            } else {
                console.warn('⚠️ No success flag in response, using fallback data');
                setUsingFallbackData(true);
                setReviews(getFallbackReviews(djId));
                setReviewPagination({
                    page: 1,
                    limit: 10,
                    total: 3,
                    total_pages: 1
                });
                setReviewError(data?.message || "Failed to load reviews");
            }
        } catch (error) {
            console.error("❌ Error fetching reviews:", error);
            setUsingFallbackData(true);
            setReviews(getFallbackReviews(djId));
            setReviewPagination({
                page: 1,
                limit: 10,
                total: 3,
                total_pages: 1
            });
            setReviewError(error.message || "Failed to load reviews");
        } finally {
            setReviewsLoading(false);
        }
    };

    // Handle booking navigation - Navigates to /book/:djId
    const handleBooking = async () => {
        try {
            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            // Validate required fields
            if (!selectedDate || !selectedTime) {
                alert("Please select both date and time for your booking.");
                return;
            }

            const djId = dj.dj_id || dj.id || id;
            const pricePerHour = dj.price || dj.price_per_hour || 150;
            const totalPrice = pricePerHour * bookingDuration;

            // Navigate to /book/:djId with booking details in state
            navigate(`/book/${djId}`, {
                state: {
                    dj: dj,
                    date: selectedDate,
                    time: selectedTime,
                    duration: bookingDuration,
                    totalPrice: totalPrice,
                    pricePerHour: pricePerHour
                }
            });
        } catch (error) {
            console.error("Booking error:", error);
            setError(error.message);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewRating || !reviewText.trim()) {
            alert("Please provide a rating and review text.");
            return;
        }

        if (reviewText.trim().length < 10) {
            alert("Review must be at least 10 characters long.");
            return;
        }

        setIsSubmittingReview(true);
        try {
            const token = getToken();
            if (!token) {
                alert("Please login to submit a review.");
                navigate("/login");
                return;
            }

            const djId = dj.dj_id || dj.id || id;
            
            console.log("📝 Submitting review for DJ ID:", djId);
            console.log("📝 Review data:", {
                dj_id: djId,
                review_text: reviewText.trim(),
                rating_value: reviewRating
            });

            const url = `${API_BASE_URL}/create-review`;
            const data = await fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify({
                    dj_id: parseInt(djId),
                    review_text: reviewText.trim(),
                    rating_value: reviewRating
                })
            }, token);

            console.log("✅ Review submission response:", data);

            if (data.success) {
                await fetchReviews(djId);

                const totalReviews = (dj.review_count || 0) + 1;
                const currentRating = dj.rating || 0;
                const currentCount = dj.review_count || 0;
                const newRating = ((currentRating * currentCount) + reviewRating) / totalReviews;
                
                setDj(prev => ({
                    ...prev,
                    review_count: totalReviews,
                    rating: newRating
                }));

                setReviewRating(0);
                setReviewText("");
                setReviewTitle("");
                setShowReviewModal(false);

                alert("Review submitted successfully!");
            } else {
                alert(data.message || "Failed to submit review");
            }

        } catch (error) {
            console.error("❌ Error submitting review:", error);
            const errorMessage = error.message || "Failed to submit review. Please try again.";
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const loadMoreReviews = async () => {
        if (reviewPagination.page < reviewPagination.total_pages) {
            const nextPage = reviewPagination.page + 1;
            await fetchReviews(dj.dj_id || id, nextPage);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full" />
                        </div>
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin relative" />
                    </div>
                    <p className="text-zinc-400 mt-4 text-sm font-light tracking-wider">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !dj) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-8 max-w-md text-center backdrop-blur-sm">
                    <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Profile Not Found</h2>
                    <p className="text-zinc-400 text-sm mb-6">{error || "The DJ you're looking for doesn't exist or has been removed."}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
            {/* Header with Cover Image */}
            <div className="relative h-[45vh] md:h-[50vh] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 mix-blend-overlay" />
                <img
                    src={dj.image || `https://placehold.co/1200x800/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`}
                    alt={dj.name}
                    className="w-full h-full object-cover scale-105"
                    onError={(e) => {
                        e.target.src = `https://placehold.co/1200x800/1a1a1a/white?text=${encodeURIComponent(dj.name || 'DJ')}`;
                    }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 via-40% to-transparent" />

                {/* Navigation */}
                <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-black/40 backdrop-blur-md border border-white/5 p-2.5 rounded-full hover:bg-black/60 transition-all duration-200 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="bg-black/40 backdrop-blur-md border border-white/5 p-2.5 rounded-full hover:bg-black/60 transition-all duration-200"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className="bg-black/40 backdrop-blur-md border border-white/5 p-2.5 rounded-full hover:bg-black/60 transition-all duration-200"
                        >
                            <Heart className={`w-5 h-5 transition-all duration-300 ${isFavorite ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} />
                        </button>
                    </div>
                </div>

                {/* Share Menu */}
                <AnimatePresence>
                    {showShareMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute top-20 right-6 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3 z-30 shadow-2xl"
                        >
                            <div className="flex gap-2">
                                {[
                                    { icon: Twitter, label: "Twitter" },
                                    { icon: Instagram, label: "Instagram" },
                                    { icon: Youtube, label: "YouTube" },
                                ].map(({ icon: Icon, label }) => (
                                    <button key={label} className="p-2 hover:bg-zinc-800 rounded-xl transition-all duration-200">
                                        <Icon className="w-4 h-4 text-zinc-400" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* DJ Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="bg-purple-500/20 backdrop-blur-sm text-purple-400 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/10">
                                {dj.genre || "Electronic"}
                            </span>
                            {dj.verified && (
                                <span className="bg-blue-500/20 backdrop-blur-sm text-blue-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-blue-500/10">
                                    <ShieldCheck className="w-3 h-3" /> Verified
                                </span>
                            )}
                            <span className="bg-green-500/20 backdrop-blur-sm text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-green-500/10">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                Available
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">
                            {dj.name}
                            {dj.verified && (
                                <span className="ml-2 text-3xl">✨</span>
                            )}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                            <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                {dj.location || "Available nationwide"}
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="text-white font-medium">{dj.rating.toFixed(1)}</span>
                                <span className="text-zinc-500">({dj.review_count} reviews)</span>
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Users className="w-3.5 h-3.5 text-blue-400" />
                                {dj.events_done}+ Events
                            </span>
                            <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                {dj.response_rate}% Response
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { icon: Trophy, label: "Rating", value: `${dj.rating.toFixed(1)} ★`, color: "yellow" },
                                { icon: Clock, label: "Response", value: dj.response_time || "~1hr", color: "blue" },
                                { icon: Award, label: "Events", value: `${dj.events_done}+`, color: "purple" },
                                { icon: Users, label: "Clients", value: `${dj.review_count}+`, color: "green" },
                            ].map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-3.5 text-center hover:border-white/10 transition-all duration-200 group"
                                >
                                    <stat.icon className={`w-4 h-4 text-${stat.color}-400 mx-auto mb-1.5 group-hover:scale-110 transition-transform`} />
                                    <p className="text-white font-semibold text-sm">{stat.value}</p>
                                    <p className="text-zinc-500 text-xs uppercase tracking-wider">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Tabs */}
                        <div className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-1 flex overflow-x-auto">
                            {[
                                { id: "overview", icon: Info, label: "Overview" },
                                { id: "reviews", icon: Star, label: "Reviews" },
                                { id: "equipment", icon: Headphones, label: "Equipment" },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                                        activeTab === tab.id
                                            ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/20"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === "overview" && (
                                <motion.div
                                    key="overview"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6 space-y-5"
                                >
                                    <div>
                                        <h3 className="text-white font-semibold mb-2.5 flex items-center gap-2">
                                            <Info className="w-4 h-4 text-purple-400" />
                                            About
                                        </h3>
                                        <p className="text-zinc-300 text-sm leading-relaxed">
                                            {dj.bio || `${dj.name} is a ${dj.genre || "professional"} DJ with extensive experience creating unforgettable musical experiences. Known for reading the crowd and keeping the energy high.`}
                                        </p>
                                    </div>

                                    {dj.skills && (
                                        <div>
                                            <h3 className="text-white font-semibold mb-2.5 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                                Genres & Skills
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {(typeof dj.skills === 'string'
                                                    ? dj.skills.split(',').map(s => s.trim())
                                                    : dj.skills
                                                ).map((skill, i) => (
                                                    <span key={i} className="bg-white/5 border border-white/5 text-zinc-300 px-3 py-1.5 rounded-full text-xs hover:border-purple-500/30 transition-colors">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {dj.tagline && (
                                        <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/10 rounded-xl p-4">
                                            <p className="text-purple-400 text-sm italic">"{dj.tagline}"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "reviews" && (
                                <motion.div
                                    key="reviews"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6"
                                >
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <h3 className="text-white font-semibold">Reviews</h3>
                                            <div className="flex items-center gap-2 text-sm mt-0.5">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                <span className="text-white font-medium">{dj.rating.toFixed(1)}</span>
                                                <span className="text-zinc-500">· {dj.review_count} reviews</span>
                                            </div>
                                        </div>
                                        {usingFallbackData && (
                                            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                                                Demo Data
                                            </span>
                                        )}
                                    </div>

                                    {reviewsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                        </div>
                                    ) : reviewError ? (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                            <p className="text-amber-400 text-sm">{reviewError}</p>
                                            <p className="text-zinc-500 text-xs mt-2">Showing demo reviews while we connect to the server</p>
                                            <button 
                                                onClick={() => fetchReviews(dj.dj_id || id)}
                                                className="mt-3 text-purple-400 text-sm hover:text-purple-300 transition-colors"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    ) : reviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {usingFallbackData && (
                                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4">
                                                    <p className="text-amber-400 text-xs text-center">
                                                        ⚠️ Showing demo reviews. Real reviews will appear when the server connection is fixed.
                                                    </p>
                                                </div>
                                            )}
                                            {reviews.map((review, i) => (
                                                <div key={review.review_id || i} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-purple-400 font-semibold text-sm flex-shrink-0">
                                                            {review.username ? review.username.substring(0, 2).toUpperCase() : 'U'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-white font-medium text-sm">{review.username || 'Anonymous'}</p>
                                                                <span className="text-zinc-500 text-xs">
                                                                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Recently'}
                                                                </span>
                                                                <div className="flex items-center gap-0.5 ml-auto">
                                                                    {[...Array(5)].map((_, j) => (
                                                                        <Star key={j} className={`w-3 h-3 ${j < (review.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-700'}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-zinc-300 text-sm mt-1.5 leading-relaxed">
                                                                {review.review_text}
                                                            </p>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <button className="text-zinc-500 hover:text-green-400 transition-colors text-xs flex items-center gap-1">
                                                                    <ThumbsUp className="w-3 h-3" /> Helpful
                                                                </button>
                                                                <button className="text-zinc-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1">
                                                                    <Flag className="w-3 h-3" /> Report
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Star className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                            <p className="text-zinc-400 text-sm">No reviews yet</p>
                                            <p className="text-zinc-500 text-xs mt-1">Be the first to review this DJ!</p>
                                        </div>
                                    )}

                                    {reviewPagination.total_pages > 1 && reviewPagination.page < reviewPagination.total_pages && (
                                        <button
                                            onClick={loadMoreReviews}
                                            className="w-full mt-4 bg-white/5 hover:bg-white/10 transition-all duration-200 text-white py-2.5 rounded-xl text-sm font-medium border border-white/5"
                                        >
                                            Load More Reviews ({reviewPagination.page}/{reviewPagination.total_pages})
                                        </button>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === "equipment" && (
                                <motion.div
                                    key="equipment"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-6"
                                >
                                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                        <Headphones className="w-4 h-4 text-purple-400" />
                                        Equipment & Services
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        {[
                                            { icon: Disc, label: "DJ Controller" },
                                            { icon: Radio, label: "Sound System" },
                                            { icon: Waves, label: "Lighting" },
                                            { icon: Mic2, label: "Wireless Mics" },
                                            { icon: Monitor, label: "Backup Equipment" },
                                            { icon: Music, label: "Custom Playlists" },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-all duration-200">
                                                <item.icon className="w-4 h-4 text-purple-400" />
                                                <span className="text-zinc-300 text-sm">{item.label}</span>
                                                <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column - Booking */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6 space-y-4">
                            {/* Booking Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-5"
                            >
                                <div className="flex items-center justify-between mb-5">
                                    <div>
                                        <p className="text-zinc-400 text-xs uppercase tracking-wider">Price</p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-2xl font-bold">{formatPrice(dj.price)}</span>
                                            <span className="text-zinc-400 text-sm">/hr</span>
                                        </div>
                                    </div>
                                    <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
                                        <span className="text-green-400 text-xs font-medium flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                            Available
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3.5">
                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1.5 flex items-center gap-1.5 font-medium">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Select Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1.5 flex items-center gap-1.5 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            Select Time
                                        </label>
                                        <input
                                            type="time"
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-zinc-400 text-xs block mb-1.5 font-medium">Duration</label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setBookingDuration(Math.max(1, bookingDuration - 1))}
                                                className="w-9 h-9 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-lg font-light"
                                            >
                                                −
                                            </button>
                                            <span className="text-white font-semibold text-xl w-8 text-center">
                                                {bookingDuration}
                                            </span>
                                            <button
                                                onClick={() => setBookingDuration(Math.min(8, bookingDuration + 1))}
                                                className="w-9 h-9 bg-white/5 rounded-xl text-white hover:bg-white/10 transition-all duration-200 text-lg font-light"
                                            >
                                                +
                                            </button>
                                            <span className="text-zinc-400 text-sm">hours</span>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-xl p-3.5 space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Rate</span>
                                            <span className="text-white">{formatPrice(dj.price)}/hr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Duration</span>
                                            <span className="text-white">{bookingDuration}h</span>
                                        </div>
                                        <div className="flex justify-between border-t border-white/10 pt-2.5 mt-1">
                                            <span className="text-white font-medium">Total</span>
                                            <span className="text-white font-bold text-xl">
                                                {formatPrice(dj.price * bookingDuration)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBooking}
                                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 transition-all duration-200 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                                    >
                                        Book Now
                                    </button>

                                    <div className="flex justify-center gap-4 text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Secure
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Free Cancellation
                                        </span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Add Review Button */}
                            <button
                                onClick={() => setShowReviewModal(true)}
                                className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/20 hover:border-purple-500/30 transition-all duration-200 text-white py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <Edit3 className="w-4 h-4" />
                                Write a Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {showReviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setShowReviewModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-xl font-bold text-white">Write a Review</h3>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="p-1.5 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-zinc-400 text-sm block mb-2 font-medium">Rating</label>
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setReviewRating(star)}
                                                className="transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-8 h-8 ${
                                                        star <= reviewRating
                                                            ? 'text-yellow-500 fill-yellow-500'
                                                            : 'text-zinc-600 hover:text-zinc-500'
                                                    } transition-colors`}
                                                />
                                            </button>
                                        ))}
                                        {reviewRating > 0 && (
                                            <span className="text-zinc-400 text-sm ml-2">
                                                {reviewRating === 5 ? 'Excellent!' :
                                                 reviewRating === 4 ? 'Very Good' :
                                                 reviewRating === 3 ? 'Good' :
                                                 reviewRating === 2 ? 'Fair' : 'Poor'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-1.5 font-medium">Review Title</label>
                                    <input
                                        type="text"
                                        value={reviewTitle}
                                        onChange={(e) => setReviewTitle(e.target.value)}
                                        placeholder="e.g., Amazing Experience!"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 placeholder:text-zinc-600"
                                    />
                                </div>

                                <div>
                                    <label className="text-zinc-400 text-sm block mb-1.5 font-medium">Your Review</label>
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Share your experience with this DJ..."
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 placeholder:text-zinc-600 resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmitReview}
                                    disabled={!reviewRating || !reviewText.trim() || isSubmittingReview}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                                        !reviewRating || !reviewText.trim()
                                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40'
                                    }`}
                                >
                                    {isSubmittingReview ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Submit Review
                                        </>
                                    )}
                                </button>

                                <p className="text-center text-xs text-zinc-500">
                                    Your review helps others make better decisions
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scroll to Top */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-6 right-6 bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all duration-200 p-3 rounded-full shadow-lg"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.9 }}
            >
                <ChevronUp className="w-5 h-5 text-white" />
            </motion.button>
        </div>
    );
}

export default DJProfileScreen;