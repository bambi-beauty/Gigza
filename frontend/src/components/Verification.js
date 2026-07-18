import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRight, FaEnvelope } from "react-icons/fa";
import { useUser } from "../UserContext/ThisUserContext";

function Verification({ goToSuccess }) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const inputsRef = useRef([]);
  const { verifyOTP, resendOTP, loading: authLoading } = useUser();

  useEffect(() => {
    // Get email from localStorage (set during signup)
    const storedEmail = localStorage.getItem("verificationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      console.log("Verifying email for:", storedEmail);
    } else {
      // If no email found, redirect back to login
      setError("No email found. Please sign up again.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }

    // Auto-focus first input
    if (inputsRef.current[0]) {
      setTimeout(() => inputsRef.current[0].focus(), 100);
    }

    // Start countdown timer for resend
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 3) {
      inputsRef.current[index + 1].focus();
    }

    // Auto-submit when all digits are filled
    if (value && index === 3 && newCode.every(digit => digit !== "")) {
      setTimeout(() => handleVerify(newCode.join("")), 100);
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace to go to previous input
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerify = async (enteredCode = code.join("")) => {
    if (enteredCode.length !== 4) {
      setError("Please enter the 4-digit verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Convert the OTP to a number since your backend expects a number
      const otpNumber = parseInt(enteredCode, 10);
      
      console.log("Verifying with:", { email, otp: otpNumber });
      
      // Call the actual backend API to verify OTP
      const result = await verifyOTP(email, otpNumber);
      
      console.log("Verification result:", result);
      
      if (result.success) {
        setVerificationSuccess(true);
        // Clear verification data from localStorage
        localStorage.removeItem("verificationEmail");
        localStorage.removeItem("pendingUserName");
        
        // Navigate to success after a short delay
        setTimeout(() => {
          goToSuccess();
        }, 1500);
      } else {
        setError(result.error || "The code you entered is incorrect. Please try again.");
        // Shake animation for error
        const container = document.querySelector('.code-container');
        if (container) {
          container.style.animation = 'shake 0.5s ease';
          setTimeout(() => {
            container.style.animation = '';
          }, 500);
        }
        // Clear all inputs on error
        setCode(["", "", "", ""]);
        // Focus first input
        if (inputsRef.current[0]) {
          inputsRef.current[0].focus();
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      console.log("Resending OTP for email:", email);
      
      // Call the actual backend API to resend OTP
      const result = await resendOTP(email);
      
      console.log("Resend result:", result);
      
      if (result.success) {
        // Reset code inputs
        setCode(["", "", "", ""]);
        setError("");
        setCanResend(false);
        setCountdown(30);
        
        // Restart countdown timer
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Focus first input
        if (inputsRef.current[0]) {
          inputsRef.current[0].focus();
        }
        
        // Show success message
        alert("A new verification code has been sent to your email");
      } else {
        setError(result.error || "Failed to resend code. Please try again.");
      }
    } catch (err) {
      console.error("Resend error:", err);
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isLoadingState = isLoading || authLoading;

  return (
    <Container>
      <BackgroundOrbs>
        <Orb1 />
        <Orb2 />
        <Orb3 />
      </BackgroundOrbs>
      
      <Card as={motion.div}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {verificationSuccess ? (
          <SuccessWrapper
            as={motion.div}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <SuccessIcon>
              <span>✓</span>
            </SuccessIcon>
            <SuccessTitle>Verified!</SuccessTitle>
            <SuccessText>Redirecting you to the app...</SuccessText>
          </SuccessWrapper>
        ) : (
          <>
            <IconWrapper
              as={motion.div}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <FaEnvelope className="icon" />
            </IconWrapper>

            <Logo
              as={motion.h1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Gigza
            </Logo>

            <Title
              as={motion.h2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Verify Your Email
            </Title>

            <Subtitle
              as={motion.p}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              We've sent a 4-digit verification code to
              <br />
              <EmailSpan>{email || "your email"}</EmailSpan>
            </Subtitle>

            <Form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
              <CodeContainer className="code-container">
                {code.map((digit, index) => (
                  <CodeInput
                    key={index}
                    as={motion.input}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    ref={(el) => (inputsRef.current[index] = el)}
                    $hasValue={digit !== ""}
                    disabled={isLoadingState}
                  />
                ))}
              </CodeContainer>

              <AnimatePresence>
                {error && (
                  <ErrorText
                    as={motion.p}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {error}
                  </ErrorText>
                )}
              </AnimatePresence>

              <Button
                as={motion.button}
                whileHover={{ scale: isLoadingState ? 1 : 1.02 }}
                whileTap={{ scale: isLoadingState ? 1 : 0.98 }}
                type="submit"
                disabled={isLoadingState}
              >
                {isLoadingState ? (
                  <Spinner />
                ) : (
                  <>
                    Verify
                    <FaArrowRight className="btn-icon" />
                  </>
                )}
              </Button>

              <ResendSection>
                {canResend ? (
                  <ResendButton
                    onClick={handleResend}
                    disabled={isLoadingState}
                  >
                    Didn't receive code? Resend
                  </ResendButton>
                ) : (
                  <CountdownText>
                    Resend code in <span>{countdown}</span> seconds
                  </CountdownText>
                )}
              </ResendSection>
            </Form>
          </>
        )}
      </Card>
    </Container>
  );
}

export default Verification;

// Styled Components
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.2; }
`;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
`;

const BackgroundOrbs = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const Orb1 = styled.div`
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255,255,255,0.1), transparent);
  border-radius: 50%;
  top: -250px;
  right: -250px;
  animation: ${pulse} 8s ease-in-out infinite;
`;

const Orb2 = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255,255,255,0.08), transparent);
  border-radius: 50%;
  bottom: -200px;
  left: -200px;
  animation: ${pulse} 10s ease-in-out infinite reverse;
`;

const Orb3 = styled.div`
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255,255,255,0.05), transparent);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${float} 6s ease-in-out infinite;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  padding: 48px 40px;
  border-radius: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
  text-align: center;
  width: 420px;
  max-width: 90%;
  position: relative;
  z-index: 1;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  
  .icon {
    font-size: 40px;
    color: white;
  }
`;

const Logo = styled.h1`
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 32px;
  line-height: 1.6;
`;

const EmailSpan = styled.span`
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 8px;
  display: inline-block;
  margin-top: 8px;
`;

const Form = styled.form`
  width: 100%;
`;

const CodeContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 28px;
`;

const CodeInput = styled.input`
  width: 60px;
  height: 70px;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  border: 2px solid ${props => props.$hasValue ? '#667eea' : '#e0e0e0'};
  border-radius: 16px;
  outline: none;
  background: white;
  transition: all 0.3s ease;
  color: #1a1a2e !important;
  -webkit-text-fill-color: #1a1a2e !important;

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: scale(1.05);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  margin-top: 8px;
  opacity: ${props => props.disabled ? 0.7 : 1};

  .btn-icon {
    transition: transform 0.3s;
  }

  &:hover:not(:disabled) .btn-icon {
    transform: translateX(5px);
  }
`;

const Spinner = styled.div`
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

const ErrorText = styled.p`
  color: #e74c3c;
  font-size: 13px;
  margin-bottom: 16px;
  padding: 8px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
`;

const ResendSection = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    color: #764ba2;
    text-decoration: underline;
  }
`;

const CountdownText = styled.p`
  font-size: 13px;
  color: #999;
  
  span {
    font-weight: 700;
    color: #667eea;
  }
`;

const SuccessWrapper = styled.div`
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  
  span {
    font-size: 40px;
    color: white;
  }
`;

const SuccessTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 12px;
`;

const SuccessText = styled.p`
  font-size: 14px;
  color: #666;
`;