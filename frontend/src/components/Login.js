// src/components/Login.js - Fan Only (DJ Removed) · Ticket edition
import React, { useState, useMemo } from "react";
import "./Login.css";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useUser } from "../UserContext/ThisUserContext";
import { useNavigate } from "react-router-dom";

import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Headphones,
  AlertCircle,
} from "lucide-react";

/* ---------- Inline brand icons (lucide is dropping brand icons) ---------- */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="icon">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="icon">
    <path
      fill="#1877F2"
      d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.34l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07z"
    />
  </svg>
);

/* ---------- Reusable field (defined outside Login so inputs never remount) ---------- */
function Field({ id, label, icon: Icon, error, trailing, ...inputProps }) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <Icon size={18} className="input-icon" aria-hidden="true" />
        <input
          id={id}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        {trailing}
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- Password strength (signup only) ---------- */
const STRENGTH_LABELS = ["", "Weak", "Okay", "Good", "Strong"];

const getStrength = (pw) => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/\d/.test(pw) && /[a-zA-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || (/[A-Z]/.test(pw) && /[a-z]/.test(pw))) score++;
  return Math.max(1, score);
};

const EMPTY_FORM = { email: "", password: "", confirmPassword: "", name: "" };

function Login({ goToProfileSetup, goToHome }) {
  const { login, signup, googleLogin, loading: authLoading, error: authError, setError } = useUser();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Equalizer bars along the bottom of the stage (generated once)
  const bars = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        duration: 0.7 + Math.random() * 1.2,
        delay: -Math.random() * 2,
        peak: 0.3 + Math.random() * 0.7,
      })),
    []
  );

  const strength = getStrength(formData.password);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.submit) {
      setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
    }
    if (authError) setError(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Enter your email address";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email, like you@example.com";
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = "Enter your name";
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }

      if (!formData.password) {
        newErrors.password = "Enter a password";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
    } else if (!formData.password) {
      newErrors.password = "Enter your password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Signup - goes to OTP verification
  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await signup(formData.name, formData.email, formData.password);

      if (result.success) {
        localStorage.setItem("newUserEmail", formData.email);
        localStorage.setItem("newUserName", formData.name);

        navigate("/verify-otp", {
          state: { email: formData.email, name: formData.name },
        });
      } else {
        setErrors({ submit: result.error || "Signup failed. Please try again." });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ submit: "Something went wrong while signing up. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Login - handles OTP requirement
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        goToHome(result.user);
      } else if (result.requiresVerification) {
        localStorage.setItem("newUserEmail", result.email);
        navigate("/verify-otp", { state: { email: result.email } });
      } else {
        setErrors({ submit: result.error || "Sign in failed. Check your email and password." });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ submit: "Something went wrong while signing in. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { user } = result;

      const loginResult = await googleLogin(user.email, user.displayName, user.uid);

      if (loginResult.success) {
        if (loginResult.user?.isNewUser) {
          localStorage.setItem("newUserEmail", user.email);
          localStorage.setItem("newUserName", user.displayName);
          goToProfileSetup();
        } else {
          goToHome(loginResult.user);
        }
      } else {
        setErrors({ submit: loginResult.error || "Google sign in failed. Please try again." });
      }
    } catch (error) {
      // Closing the popup isn't an error worth showing
      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      console.error("Google login error:", error);
      setErrors({ submit: `Google sign in failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setErrors({ submit: "Facebook sign in isn't available yet." });
    }, 800);
  };

  const setMode = (loginMode) => {
    if (loginMode === isLogin) return;
    setIsLogin(loginMode);
    setErrors({});
    setFormData(EMPTY_FORM);
    setShowPassword(false);
    if (authError) setError(null);
  };

  const isLoadingState = isLoading || authLoading;
  const submitMessage = errors.submit || authError;

  const passwordToggle = (
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowPassword((s) => !s)}
      disabled={isLoadingState}
      aria-label={showPassword ? "Hide password" : "Show password"}
      aria-pressed={showPassword}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div className="login-container">
      {/* ===== The stage: spotlights + equalizer ===== */}
      <div className="stage" aria-hidden="true">
        <div className="beam beam--left" />
        <div className="beam beam--right" />
        <div className="equalizer">
          {bars.map((b) => (
            <span
              key={b.id}
              className="eq-bar"
              style={{
                "--dur": `${b.duration}s`,
                "--delay": `${b.delay}s`,
                "--peak": b.peak,
              }}
            />
          ))}
        </div>
      </div>

      <div className="login-wrapper">
        {/* ===== The ticket ===== */}
        <motion.div
          className="ticket-shadow"
          initial={reduceMotion ? false : { opacity: 0, y: -60, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 14, mass: 0.9 }}
        >
          <div className="ticket">
            <header className="ticket-head">
              <div className="brand">
                <span className="brand-mark">
                  <Headphones size={22} strokeWidth={2} aria-hidden="true" />
                </span>
                <h1 className="brand-name">Gigza</h1>
              </div>
              <span className="admit">Admit one</span>
            </header>
            <div className="perf" aria-hidden="true" />

            <div className="ticket-body">
              <div className="mode-tabs" role="group" aria-label="Choose sign in or sign up">
                {[
                  { key: true, label: "Sign in" },
                  { key: false, label: "Sign up" },
                ].map((tab) => {
                  const active = isLogin === tab.key;
                  return (
                    <button
                      key={tab.label}
                      type="button"
                      className={`mode-tab${active ? " active" : ""}`}
                      aria-pressed={active}
                      onClick={() => setMode(tab.key)}
                      disabled={isLoadingState}
                    >
                      {active && (
                        <motion.span
                          layoutId="tab-pill"
                          className="tab-pill"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="tab-label">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <h2 className="title">{isLogin ? "Welcome back" : "Create your account"}</h2>
              <p className="subtitle">
                {isLogin
                  ? "Sign in to continue your music journey."
                  : "Join Gigza and start your music adventure."}
              </p>

              <AnimatePresence mode="wait" initial={false}>
                <motion.form
                  key={isLogin ? "login" : "signup"}
                  noValidate
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  onSubmit={isLogin ? handleEmailLogin : handleEmailSignup}
                >
                  {!isLogin && (
                    <Field
                      id="name"
                      label="Full name"
                      icon={User}
                      type="text"
                      name="name"
                      placeholder="Alex Morgan"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isLoadingState}
                      error={errors.name}
                    />
                  )}

                  <Field
                    id="email"
                    label="Email address"
                    icon={Mail}
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoadingState}
                    error={errors.email}
                  />

                  <Field
                    id="password"
                    label="Password"
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={isLogin ? "Your password" : "At least 6 characters"}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoadingState}
                    error={errors.password}
                    trailing={passwordToggle}
                  />

                  {!isLogin && formData.password && (
                    <div className="strength" data-level={strength}>
                      <div className="strength-bars" aria-hidden="true">
                        {[1, 2, 3, 4].map((n) => (
                          <span key={n} className={n <= strength ? "on" : ""} />
                        ))}
                      </div>
                      <span className="strength-label">Password strength: {STRENGTH_LABELS[strength]}</span>
                    </div>
                  )}

                  {!isLogin && (
                    <Field
                      id="confirmPassword"
                      label="Confirm password"
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Type it once more"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={isLoadingState}
                      error={errors.confirmPassword}
                    />
                  )}

                  {submitMessage && (
                    <div className="submit-error" role="alert">
                      <AlertCircle size={16} aria-hidden="true" />
                      <span>{submitMessage}</span>
                    </div>
                  )}

                  <button type="submit" className="continue-btn" disabled={isLoadingState}>
                    {isLoadingState ? (
                      <>
                        <span className="spinner" aria-hidden="true" />
                        <span className="sr-only">Please wait</span>
                      </>
                    ) : (
                      <>
                        {isLogin ? (
                          <LogIn size={18} aria-hidden="true" />
                        ) : (
                          <UserPlus size={18} aria-hidden="true" />
                        )}
                        {isLogin ? "Sign in" : "Create account"}
                        <ArrowRight size={16} className="btn-icon" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </motion.form>
              </AnimatePresence>

              <div className="divider">
                <span>or use</span>
              </div>

              <div className="social-buttons">
                <button
                  type="button"
                  className="social-btn google"
                  onClick={handleGoogleLogin}
                  disabled={isLoadingState}
                >
                  <GoogleIcon />
                  Google
                </button>

                <button
                  type="button"
                  className="social-btn facebook"
                  onClick={handleFacebookLogin}
                  disabled={isLoadingState}
                >
                  <FacebookIcon />
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Login;