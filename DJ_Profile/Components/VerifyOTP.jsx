// src/VerifyOTP.jsx - Updated
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";

const BASE_API = 'https://gigza-testing-11.onrender.com/api';

export default function VerifyOTP({ onVerified }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || localStorage.getItem("newUserEmail");
  const isNewDJ = location.state?.isNewDJ || localStorage.getItem("isNewDJ") === "true";

  useEffect(() => {
    if (!email) {
      navigate("/dj-login");
      return;
    }

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [email, navigate]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otp.every((digit) => digit !== "")) {
      handleVerify();
    }
  }, [otp]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BASE_API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpString }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);

        // Store tokens
        if (data.token) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("refreshToken", data.refreshToken || "");
        }

        // ✅ Navigate to profile setup for new DJs
        setTimeout(() => {
          if (onVerified) {
            onVerified();
          } else if (isNewDJ) {
            navigate("/dj-profile-setup", {
              state: {
                email: email,
                user: data.user,
                isNewDJ: true
              }
            });
          } else {
            navigate("/requests");
          }
        }, 1500);
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Verification failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResending(true);
    setError("");

    try {
      const response = await fetch(`${BASE_API}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setTimer(30);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        document.getElementById("otp-0")?.focus();
        setError("");
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified! 🎉</h2>
          <p className="text-zinc-400">Your account has been verified.</p>
          <p className="text-zinc-500 text-sm mt-2">Setting up your DJ profile...</p>
          <div className="mt-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
          <p className="text-zinc-400 text-sm mt-1">
            We sent a 6-digit code to <span className="text-white">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex justify-between gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-black border border-zinc-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || otp.some((digit) => digit === "")}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 mt-4"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Verify Email
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Resend */}
        <div className="text-center">
          <p className="text-zinc-500 text-sm">
            Didn't receive the code?{" "}
            <button
              onClick={handleResend}
              disabled={!canResend || resending}
              className={`text-purple-400 hover:text-purple-300 transition ${
                !canResend ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {resending ? (
                <Loader2 className="w-4 h-4 inline animate-spin" />
              ) : canResend ? (
                "Resend Code"
              ) : (
                `Resend in ${timer}s`
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}