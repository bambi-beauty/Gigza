import React, { useState } from "react";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import emailjs from "emailjs-com";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function Login({ goToVerification, goToSuccess, onRoleSelect }) {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState(null); // 'client' or 'dj'
  const [showRoleSelection, setShowRoleSelection] = useState(true);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowRoleSelection(false);
    if (onRoleSelect) {
      onRoleSelect(role);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedRole) {
      alert("Please select whether you're a Client or a DJ first");
      return;
    }

    const generatedCode = Math.floor(1000 + Math.random() * 9000);

    console.log("Generated code:", generatedCode);
    console.log("User role:", selectedRole);

    emailjs.send(
      "service_46ueimb",        
      "template_v1sied9",      
      {
        email: email,        
        code: generatedCode,    
      },
      "c779kPTHeCCW_Ad_i"       
    )
      .then(() => {
        console.log("Email sent!");

        localStorage.setItem("verificationCode", generatedCode);
        localStorage.setItem("userRole", selectedRole);
        localStorage.setItem("userEmail", email);

        goToVerification();
      })
      .catch((error) => {
        console.log("Error:", error);
        alert("Failed to send verification code. Please try again.");
      });
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Google user:", user);

      if (!selectedRole) {
        alert("Please select whether you're a Client or a DJ first");
        return;
      }

      localStorage.setItem("userRole", selectedRole);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.displayName);

      alert(`Logged in as ${selectedRole === 'client' ? 'Client' : 'DJ'}: ${user.email}`);

      goToSuccess();

    } catch (error) {
      console.log("Google login error:", error);
      alert("Google login failed. Please try again.");
    }
  };

  const handleFacebookLogin = () => {
    if (!selectedRole) {
      alert("Please select whether you're a Client or a DJ first");
      return;
    }
    // Facebook login logic would go here
    alert("Facebook login coming soon!");
  };

  return (
    <div className="container">
      <div className="card">

        <h1 className="logo">Gigza</h1>

        {showRoleSelection ? (
          <>
            <h2 className="title">I am a...</h2>
            <div className="role-buttons">
              <button 
                className={`role-btn ${selectedRole === 'client' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('client')}
              >
                <div className="role-icon">🎧</div>
                <div className="role-title">Client</div>
                <div className="role-desc">Looking for DJs & talent</div>
              </button>
              <button 
                className={`role-btn ${selectedRole === 'dj' ? 'selected' : ''}`}
                onClick={() => handleRoleSelect('dj')}
              >
                <div className="role-icon">🎵</div>
                <div className="role-title">DJ / Creative</div>
                <div className="role-desc">Offering my services</div>
              </button>
            </div>
            
            {selectedRole && (
              <button 
                className="continue-role-btn"
                onClick={() => setShowRoleSelection(false)}
              >
                Continue with {selectedRole === 'client' ? 'Client' : 'DJ'} account
              </button>
            )}
          </>
        ) : (
          <>
            <div className="role-badge">
              Logging in as: <strong>{selectedRole === 'client' ? 'Client' : 'DJ / Creative'}</strong>
              <button className="change-role-btn" onClick={() => setShowRoleSelection(true)}>
                Change
              </button>
            </div>

            <h2 className="title">What's your email?</h2>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button className="continue-btn">Send Verification Code</button>
            </form>

            <div className="divider">
              <span>or</span>
            </div>

            <button className="social-btn" onClick={handleGoogleLogin}>
              <FcGoogle className="icon" />
              Continue with Google
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button className="social-btn" onClick={handleFacebookLogin}>
              <FaFacebook className="icon facebook" />
              Continue with Facebook
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default Login;