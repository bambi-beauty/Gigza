// Components/Login.jsx - Updated with proper flow
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

const BASE_API = 'https://gigza-testing-11.onrender.com/api';

export function DJLogin() {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
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

  // ✅ LOGIN - Existing DJ
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${BASE_API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store auth data
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userType", "dj");
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isNewDJ", "false"); // Existing DJ
        
        // Check if profile is completed
        if (data.user.profile_completed) {
          localStorage.setItem("profileCompleted", "true");
        }
        if (data.user.application_submitted) {
          localStorage.setItem("djApplicationSubmitted", "true");
        }

        // ✅ Direct to dashboard
        navigate("/requests");
      } else {
        setErrors({ submit: data.message || "Login failed" });
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SIGNUP - New DJ
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${BASE_API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          userType: 'dj'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store basic auth info
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userType", "dj");
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isNewDJ", "true"); // ✅ Mark as new DJ
        localStorage.setItem("newUserEmail", formData.email);
        localStorage.setItem("newUserName", formData.name);
        
        // ✅ Navigate to OTP verification
        navigate("/verify-otp", { 
          state: { 
            email: formData.email,
            name: formData.name,
            isNewDJ: true
          } 
        });
      } else {
        setErrors({ submit: data.message || "Signup failed" });
      }
    } catch (err) {
      console.error("Signup error:", err);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google OAuth if needed
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userType", "dj");
      navigate("/requests");
    }, 1500);
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
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0b11] flex items-center justify-center p-4 relative overflow-hidden font-['Inter']">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10 pointer-events-none" />
      
      {/* Glow Orbs */}
      <div className="absolute w-[200px] h-[200px] bg-pink-500/10 rounded-full blur-[80px] -top-20 -right-16 animate-pulse pointer-events-none" />
      <div className="absolute w-[180px] h-[180px] bg-purple-500/10 rounded-full blur-[80px] -bottom-16 -left-12 animate-pulse pointer-events-none" style={{ animationDelay: '-5s' }} />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] bg-purple-400/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `floatParticle ${3 + Math.random() * 5}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[400px] relative z-10">
        <div className="bg-[#10121c]/90 backdrop-blur-3xl rounded-3xl p-7 pb-6 border border-white/5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] transition-shadow duration-300 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
          
          {/* Logo */}
          <div className="text-center mb-5">
            <div className="inline-block text-4xl mb-1">
              <span className="text-4xl">🎧</span>
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-white via-[#c4b5fd] to-[#a78bfa] bg-clip-text text-transparent">
              Gigza <span className="text-xs font-normal text-purple-400/60">DJ</span>
              <span className="inline-block animate-sparkle">
                <Sparkles size={18} className="inline text-yellow-400/80 ml-0.5" />
              </span>
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center text-white mb-0.5">
            {isLogin ? "Welcome Back, DJ!" : "Create Your DJ Account"}
          </h2>

          <p className="text-center text-white/30 text-sm mb-5">
            {isLogin ? "Sign in to manage your gigs" : "Join Gigza and start your DJ career"}
          </p>

          {/* ✅ Form Container with Slide Animation */}
          <div className="relative overflow-hidden">
            <div 
              className={`transition-all duration-500 ease-in-out ${
                isLogin ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0 absolute inset-0 pointer-events-none'
              }`}
            >
              {/* Login Form */}
              <form onSubmit={handleLogin}>
                <div className="relative mb-3">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full py-2.5 pl-10 pr-3 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder:text-white/15 focus:outline-none focus:border-purple-500/25 focus:bg-white/5 transition-all duration-300"
                    disabled={isLoading}
                  />
                  {errors.email && <span className="block text-red-400 text-xs mt-1 pl-2">{errors.email}</span>}
                </div>

                <div className="relative mb-3">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full py-2.5 pl-10 pr-10 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder:text-white/15 focus:outline-none focus:border-purple-500/25 focus:bg-white/5 transition-all duration-300"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/30 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <span className="block text-red-400 text-xs mt-1 pl-2">{errors.password}</span>}
                </div>

                {errors.submit && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl py-2 px-3 text-red-400 text-sm text-center mb-3">
                    {errors.submit}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_8px_20px_-8px_rgba(139,92,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign In
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div 
              className={`transition-all duration-500 ease-in-out ${
                !isLogin ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0 absolute inset-0 pointer-events-none'
              }`}
            >
              {/* Signup Form */}
              <form onSubmit={handleSignup}>
                <div className="relative mb-3">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full py-2.5 pl-10 pr-3 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder:text-white/15 focus:outline-none focus:border-purple-500/25 focus:bg-white/5 transition-all duration-300"
                    disabled={isLoading}
                  />
                  {errors.name && <span className="block text-red-400 text-xs mt-1 pl-2">{errors.name}</span>}
                </div>

                <div className="relative mb-3">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full py-2.5 pl-10 pr-3 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder:text-white/15 focus:outline-none focus:border-purple-500/25 focus:bg-white/5 transition-all duration-300"
                    disabled={isLoading}
                  />
                  {errors.email && <span className="block text-red-400 text-xs mt-1 pl-2">{errors.email}</span>}
                </div>

                <div className="relative mb-3">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full py-2.5 pl-10 pr-10 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder:text-white/15 focus:outline-none focus:border-purple-500/25 focus:bg-white/5 transition-all duration-300"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/15 hover:text-white/30 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && <span className="block text-red-400 text-xs mt-1 pl-2">{errors.password}</span>}
                </div>

                <div className="relative mb-3">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/15 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full py-2.5 pl-10 pr-3 text-sm border border-white/5 rounded-xl bg-white/5 text-white placeholder:text-white/15 focus:outline-none focus:border-purple-500/25 focus:bg-white/5 transition-all duration-300"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <span className="block text-red-400 text-xs mt-1 pl-2">{errors.confirmPassword}</span>}
                </div>

                {errors.submit && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl py-2 px-3 text-red-400 text-sm text-center mb-3">
                    {errors.submit}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_8px_20px_-8px_rgba(139,92,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Sign Up
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            <span className="text-white/10 text-[10px] uppercase tracking-[0.05em] font-medium">or continue with</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>

          {/* Social Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-white/5 rounded-xl bg-white/5 text-white/40 text-xs font-medium transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-500"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Google
            </button>

            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-white/5 rounded-xl bg-white/5 text-white/40 text-xs font-medium transition-all duration-300 hover:border-blue-500/20 hover:bg-blue-500/5 hover:text-blue-500"
              disabled={isLoading}
            >
              <span className="text-blue-400 font-bold">f</span>
              Facebook
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="text-center pt-3 border-t border-white/5">
            <p className="text-white/20 text-xs">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={toggleMode}
                className="text-purple-400 font-semibold hover:text-purple-300 transition-colors inline-flex items-center gap-0.5 ml-1 text-xs"
                disabled={isLoading}
              >
                {isLogin ? "Sign Up" : "Sign In"}
                <ArrowRight size={12} />
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(100vh) scale(0); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(15deg) scale(1.1); }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}