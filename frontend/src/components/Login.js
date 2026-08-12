// components/Login.jsx

import React, { useState, useEffect } from "react";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaArrowRight } from "react-icons/fa";
import { AiOutlineMail, AiOutlineLock, AiOutlineUser } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useUser } from "../UserContext/ThisUserContext";

function Login({ goToProfileSetup, goToHome }) {
  const { 
    login, 
    signup, 
    googleLogin, 
    verifyOTP,
    resendOTP,
    loading: authLoading, 
    error: authError, 
    setError,
    requiresVerification,
    verificationEmail,
    isVerifying,
    clearVerificationState
  } = useUser();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [otpData, setOtpData] = useState({
    otp: "",
    email: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Floating particles background
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const particleArray = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 3 + Math.random() * 5,
        delay: Math.random() * 5
      });
    }
    setParticles(particleArray);
  }, []);

  // Check if verification is needed
  useEffect(() => {
    if (requiresVerification && verificationEmail) {
      setOtpData(prev => ({ ...prev, email: verificationEmail }));
      setShowOTPModal(true);
    }
  }, [requiresVerification, verificationEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (authError) setError(null);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpData(prev => ({ ...prev, otp: value }));
    setOtpError("");
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = "Name is required";
      } else if (formData.name.length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }
      
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else {
      if (!formData.password) {
        newErrors.password = "Password is required";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLE SIGNUP ==========
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setOtpError("");
    setOtpSuccess("");
    
    try {
      const result = await signup(formData.name, formData.email, formData.password);
      
      if (result.success) {
        if (result.requiresVerification) {
          // Show OTP modal
          setOtpData(prev => ({ ...prev, email: result.email || formData.email }));
          setShowOTPModal(true);
          setOtpSuccess("We've sent a verification code to your email. Please check your inbox.");
          setResendCountdown(60);
        } else {
          // Direct login (shouldn't happen with new signup)
          localStorage.setItem("newUserEmail", formData.email);
          localStorage.setItem("newUserName", formData.name);
          goToProfileSetup();
        }
      } else {
        setErrors({ submit: result.error || "Signup failed. Please try again." });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ submit: "An error occurred during signup. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ========== HANDLE LOGIN ==========
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setOtpError("");
    setOtpSuccess("");
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        goToHome();
      } else if (result.requiresVerification) {
        // Show OTP modal for verification
        setOtpData(prev => ({ ...prev, email: result.email || formData.email }));
        setShowOTPModal(true);
        setOtpSuccess("Please verify your email to continue. We've sent a code to your email.");
        setResendCountdown(60);
      } else {
        setErrors({ submit: result.error || "Login failed. Please check your credentials." });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ submit: "An error occurred during login. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ========== HANDLE OTP VERIFICATION ==========
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (otpData.otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    setOtpError("");
    
    try {
      const result = await verifyOTP(otpData.email, otpData.otp);
      
      if (result.success) {
        setOtpSuccess("Email verified successfully! 🎉");
        setOtpAttempts(0);
        
        // Close modal after success
        setTimeout(() => {
          setShowOTPModal(false);
          setOtpData({ otp: "", email: "" });
          clearVerificationState();
          
          // Check if user was in signup flow or login flow
          const pendingName = localStorage.getItem("pendingUserName");
          if (pendingName) {
            localStorage.setItem("newUserEmail", otpData.email);
            localStorage.setItem("newUserName", pendingName);
            goToProfileSetup();
          } else {
            goToHome();
          }
        }, 1500);
      } else {
        setOtpError(result.error || "Invalid OTP. Please try again.");
        setOtpAttempts(prev => prev + 1);
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      setOtpError(error.message || "OTP verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== HANDLE RESEND OTP ==========
  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;
    
    setIsLoading(true);
    setOtpError("");
    setOtpSuccess("");
    
    try {
      const result = await resendOTP(otpData.email);
      
      if (result.success) {
        setOtpSuccess("New OTP sent to your email!");
        setResendCountdown(60);
        setOtpAttempts(0);
      } else {
        setOtpError(result.error || "Failed to resend OTP. Please try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setOtpError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ========== HANDLE GOOGLE LOGIN ==========
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;
      
      console.log("Google user received:", { 
        email: user.email, 
        name: user.displayName,
        uid: user.uid 
      });
      
      const loginResult = await googleLogin(
        user.email, 
        user.displayName, 
        user.uid
      );
      
      if (loginResult.success) {
        if (loginResult.user?.isNewUser) {
          localStorage.setItem("newUserEmail", user.email);
          localStorage.setItem("newUserName", user.displayName);
          goToProfileSetup();
        } else {
          goToHome();
        }
      } else {
        setErrors({ submit: loginResult.error || "Google login failed. Please try again." });
      }
    } catch (error) {
      console.error("Google login error:", error);
      setErrors({ submit: `Google login failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Facebook Login
  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setErrors({ submit: "Facebook login coming soon!" });
    }, 1000);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: ""
    });
    setOtpError("");
    setOtpSuccess("");
    if (authError) setError(null);
    clearVerificationState();
    setShowOTPModal(false);
  };

  const isLoadingState = isLoading || authLoading || isVerifying;

  return (
    <div className="login-container">
      {/* Animated Background Particles */}
      <div className="particles-bg">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Floating Orbs for extra flair */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      <div className="login-wrapper">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="login-card"
        >
          {/* Animated Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="logo-wrapper"
          >
            <div className="logo-icon">🎵</div>
            <h1 className="logo">
              Gigza
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="logo-sparkle"
              >
                ✨
              </motion.span>
            </h1>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="title"
          >
            {isLogin ? "Welcome Back! 👋" : "Create Your Account 🎉"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="subtitle"
          >
            {isLogin 
              ? "Sign in to continue your music journey" 
              : "Join Gigza and start your DJ adventure"}
          </motion.p>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={isLogin ? handleEmailLogin : handleEmailSignup}
            >
              {!isLogin && (
                <div className="input-group">
                  <AiOutlineUser className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className={focusedField === "name" ? "focused" : ""}
                    disabled={isLoadingState}
                  />
                  {errors.name && <span className="error">{errors.name}</span>}
                </div>
              )}

              <div className="input-group">
                <AiOutlineMail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === "email" ? "focused" : ""}
                  disabled={isLoadingState}
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>

              <div className="input-group">
                <AiOutlineLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={focusedField === "password" ? "focused" : ""}
                  disabled={isLoadingState}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoadingState}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                {errors.password && <span className="error">{errors.password}</span>}
              </div>

              {!isLogin && (
                <div className="input-group">
                  <AiOutlineLock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                    className={focusedField === "confirmPassword" ? "focused" : ""}
                    disabled={isLoadingState}
                  />
                  {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
                </div>
              )}

              {/* Display errors */}
              {(errors.submit || authError) && (
                <div className="error submit-error">
                  {errors.submit || authError}
                </div>
              )}

              <motion.button
                whileHover={{ scale: isLoadingState ? 1 : 1.02 }}
                whileTap={{ scale: isLoadingState ? 1 : 0.98 }}
                type="submit"
                className="continue-btn"
                disabled={isLoadingState}
              >
                {isLoadingState ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Sign Up"}
                    <FaArrowRight className="btn-icon" />
                  </>
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <div className="social-buttons">
            <motion.button
              whileHover={{ scale: isLoadingState ? 1 : 1.05 }}
              whileTap={{ scale: isLoadingState ? 1 : 0.95 }}
              className="social-btn google"
              onClick={handleGoogleLogin}
              disabled={isLoadingState}
            >
              <FcGoogle className="icon" />
              Google
            </motion.button>

            <motion.button
              whileHover={{ scale: isLoadingState ? 1 : 1.05 }}
              whileTap={{ scale: isLoadingState ? 1 : 0.95 }}
              className="social-btn facebook"
              onClick={handleFacebookLogin}
              disabled={isLoadingState}
            >
              <FaFacebook className="icon" />
              Facebook
            </motion.button>
          </div>

          <div className="toggle-mode">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={toggleMode} className="toggle-btn" disabled={isLoadingState}>
                {isLogin ? "Sign Up" : "Sign In"}
                <FaArrowRight className="toggle-icon" />
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* ============================================ */}
      {/* OTP VERIFICATION MODAL */}
      {/* ============================================ */}
      <AnimatePresence>
        {showOTPModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="otp-modal-overlay"
            onClick={() => {}} // Don't close on overlay click
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="otp-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="otp-modal-header">
                <div className="otp-modal-icon">📧</div>
                <h2>Verify Your Email</h2>
                <p className="otp-modal-subtitle">
                  We've sent a 6-digit verification code to <strong>{otpData.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="otp-form">
                <div className="otp-input-container">
                  <input
                    type="text"
                    className="otp-input"
                    placeholder="Enter 6-digit code"
                    value={otpData.otp}
                    onChange={handleOtpChange}
                    maxLength={6}
                    autoFocus
                    disabled={isLoadingState}
                  />
                  <div className="otp-input-hint">
                    {otpData.otp.length === 0 && "Enter the code sent to your email"}
                    {otpData.otp.length > 0 && otpData.otp.length < 6 && `${otpData.otp.length}/6 digits`}
                    {otpData.otp.length === 6 && "✅ Ready to verify"}
                  </div>
                </div>

                {otpError && (
                  <div className="otp-error">{otpError}</div>
                )}

                {otpSuccess && (
                  <div className="otp-success">{otpSuccess}</div>
                )}

                <div className="otp-actions">
                  <button
                    type="submit"
                    className="otp-verify-btn"
                    disabled={isLoadingState || otpData.otp.length !== 6}
                  >
                    {isLoadingState ? (
                      <div className="spinner-small"></div>
                    ) : (
                      "Verify Email"
                    )}
                  </button>
                </div>

                <div className="otp-resend">
                  <span>Didn't receive the code? </span>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoadingState || resendCountdown > 0}
                    className={`otp-resend-btn ${resendCountdown > 0 ? 'disabled' : ''}`}
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                  </button>
                </div>

                <div className="otp-help">
                  <p>💡 Check your spam folder if you don't see the email.</p>
                  {otpAttempts >= 3 && (
                    <p className="otp-warning">⚠️ Multiple failed attempts. Request a new code.</p>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Login;