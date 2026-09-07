// src/components/Login.js - Fan Only (DJ Removed)
import React, { useState, useEffect } from "react";
import "./Login.css";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useUser } from "../UserContext/ThisUserContext";
import { useNavigate } from "react-router-dom";

// Lucide React Icons
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  LogIn,
  UserPlus,
  Chrome,
  Facebook,
  Headphones,
} from "lucide-react";

function Login({ goToProfileSetup, goToHome }) {
  const { login, signup, googleLogin, loading: authLoading, error: authError, setError } = useUser();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (authError) setError(null);
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
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
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

  // Signup - Goes to OTP verification
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await signup(formData.name, formData.email, formData.password);

      if (result.success) {
        // Store email for OTP verification
        localStorage.setItem("newUserEmail", formData.email);
        localStorage.setItem("newUserName", formData.name);
        
        // Navigate to OTP verification
        navigate("/verify-otp", { 
          state: { 
            email: formData.email,
            name: formData.name
          } 
        });
        
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

  // Login - Handles OTP requirement
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        goToHome(result.user);
      } else if (result.requiresVerification) {
        // Handle OTP requirement
        localStorage.setItem("newUserEmail", result.email);
        navigate("/verify-otp", { state: { email: result.email } });
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
          goToHome(loginResult.user);
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
    if (authError) setError(null);
  };

  const isLoadingState = isLoading || authLoading;

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
            <div className="logo-icon">
              <Headphones size={36} strokeWidth={1.5} />
            </div>
            <h1 className="logo">
              Gigza
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="logo-sparkle"
              >
                <Sparkles size={18} className="inline" />
              </motion.span>
            </h1>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="title"
          >
            {isLogin ? "Welcome Back!" : "Create Your Account"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="subtitle"
          >
            {isLogin
              ? "Sign in to continue your music journey"
              : "Join Gigza and start your music adventure"}
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
                  <User size={18} className="input-icon" />
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
                <Mail size={18} className="input-icon" />
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
                <Lock size={18} className="input-icon" />
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
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.password && <span className="error">{errors.password}</span>}
              </div>

              {!isLogin && (
                <div className="input-group">
                  <Lock size={18} className="input-icon" />
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
                    {isLogin ? (
                      <>
                        <LogIn size={18} />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Sign Up
                      </>
                    )}
                    <ArrowRight size={16} className="btn-icon" />
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
              <Chrome size={18} className="icon" />
              Google
            </motion.button>

            <motion.button
              whileHover={{ scale: isLoadingState ? 1 : 1.05 }}
              whileTap={{ scale: isLoadingState ? 1 : 0.95 }}
              className="social-btn facebook"
              onClick={handleFacebookLogin}
              disabled={isLoadingState}
            >
              <Facebook size={18} className="icon" />
              Facebook
            </motion.button>
          </div>

          <div className="toggle-mode">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button onClick={toggleMode} className="toggle-btn" disabled={isLoadingState}>
                {isLogin ? "Sign Up" : "Sign In"}
                <ArrowRight size={14} className="toggle-icon" />
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;