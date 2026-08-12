import bcrypt from 'bcryptjs';

export const validateEmail = (email) => {
    if (!email?.length) {
        return { isValid: false, message: "Email is required" };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return {
        isValid: emailRegex.test(email),
        message: emailRegex.test(email) ? "Email is valid" : "Invalid email format"
    };
};

export const PasswordCheck = (password) => {
    if (!password) {
        return { isValid: false, message: "Password is required" };
    }
    
    if (password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number" };
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special character" };
    }
    
    return { isValid: true, message: "Password is valid" };
};

export const HashPassword = async (plainPassword) => {
    try {
        console.log("1. HashPassword called with password length:", plainPassword?.length);
        
        if (!plainPassword) {
            throw new Error("Password is required");
        }
        
        const saltRounds = 10;
        console.log("2. Generating salt...");
        const salt = await bcrypt.genSalt(saltRounds);
        console.log("3. Salt generated:", salt);
        
        console.log("4. Hashing password...");
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        console.log("5. Password hashed successfully, hash length:", hashedPassword.length);
        
        return hashedPassword;
    } catch (error) {
        console.error("HashPassword error details:", error);
        throw new Error(`Error hashing password: ${error.message}`);
    }
};

// For login password comparison
export const ComparePassword = async (plainPassword, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error("Compare password error:", error);
        throw new Error("Error comparing passwords");
    }
};