import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

// Store OTPs temporarily (use Redis in production)
const otpStorage = new Map();

const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000);
};

// Send OTP email
export const sendOTPEmail = async (email, userId) => {
    const otp = generateOTP();
    
    // Configure email transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    const mailOptions = {
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email - OTP Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center;">
                    <h1 style="color: white;">Email Verification</h1>
                </div>
                <div style="padding: 20px; border: 1px solid #ddd;">
                    <h2>Welcome to Our Gigza!</h2>
                    <p>Your OTP verification code is:</p>
                    <div style="font-size: 36px; font-weight: bold; color: #4CAF50; padding: 20px; text-align: center; letter-spacing: 5px;">
                        ${otp}
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't create an account, please ignore this email.</p>
                </div>
            </div>
        `,
        text: `Your OTP verification code is: ${otp}\n\nValid for 10 minutes.`
    };
    
    // Store OTP with user ID
    otpStorage.set(email, {
        otp: otp,
        userId: userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        verified: false
    });
    
    // Auto-clear after 10 minutes
    setTimeout(() => {
        if (otpStorage.has(email) && !otpStorage.get(email).verified) {
            otpStorage.delete(email);
            console.log(`OTP for ${email} expired and was removed`);
        }
    }, 10 * 60 * 1000);
    
    await transporter.sendMail(mailOptions);
    return { success: true, otpSent: true };
};

// Verify OTP
export const verifyOTPCode = async (email, otp) => {
    const storedData = otpStorage.get(email);
    
    if (!storedData) {
        return { valid: false, message: "OTP not found or expired. Please request a new one." };
    }
    
    if (storedData.verified) {
        return { valid: false, message: "OTP already verified. Please login." };
    }
    
    if (Date.now() > storedData.expiresAt) {
        otpStorage.delete(email);
        return { valid: false, message: "OTP has expired. Please request a new one." };
    }
    
    if (storedData.attempts >= 5) {
        otpStorage.delete(email);
        return { valid: false, message: "Too many failed attempts. Please request a new OTP." };
    }
    
    if (storedData.otp !== parseInt(otp)) {
        storedData.attempts++;
        otpStorage.set(email, storedData);
        return { valid: false, message: `Invalid OTP. ${5 - storedData.attempts} attempts remaining.` };
    }
    
    // Mark as verified
    storedData.verified = true;
    otpStorage.set(email, storedData);
    
    return { 
        valid: true, 
        message: "OTP verified successfully!",
        userId: storedData.userId
    };
};

// Resend OTP
export const resendOTP = async (email) => {
    const existing = otpStorage.get(email);
    
    if (existing && !existing.verified) {
        const timeLeft = Math.ceil((existing.expiresAt - Date.now()) / 1000 / 60);
        if (timeLeft > 0 && timeLeft < 8) {
            return { 
                success: false, 
                message: `Please wait ${timeLeft} minutes before requesting a new OTP` 
            };
        }
    }
    
    const otp = generateOTP();
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "New OTP Code",
        html: `<h2>Your new OTP is: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`,
        text: `Your new OTP is: ${otp}\nValid for 10 minutes.`
    };
    
    await transporter.sendMail(mailOptions);
    
    // Update storage
    otpStorage.set(email, {
        ...existing,
        otp: otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        verified: false
    });
    
    return { success: true, message: "New OTP sent successfully" };
};