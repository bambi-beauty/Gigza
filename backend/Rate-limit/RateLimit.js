import rateLimit from "express-rate-limit";

export const SignupLimit = rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    max: 5,                    // 5 attempts
    message: "Too many signup attempts. Please try again after 5 minutes.",
});

export const LoginLimit = rateLimit({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    max: 2,                    // 5 attempts
    message: "Too many login attempts. Please try again after 5 minutes.",
});

// Optional: Stricter limit for OTP verification
export const OTPLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,                    // 3 attempts
    message: "Too many OTP verification attempts. Please try again after 15 minutes.",
});

// Optional: Limit for resending OTP
export const ResendOTPLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 2,                    // 2 attempts
    message: "Too many OTP resend requests. Please wait before requesting another code.",
});