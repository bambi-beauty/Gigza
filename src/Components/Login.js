import React, { useState } from "react";
import "./Login.css";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import emailjs from "emailjs-com";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

function Login({ goToVerification, goToSuccess }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

   
    const generatedCode = Math.floor(1000 + Math.random() * 9000);

    console.log("Generated code:", generatedCode);

   
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

        
        goToVerification();
      })
      .catch((error) => {
        console.log("Error:", error);
      });
  };

  const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log("Google user:", user);

    alert("Logged in as: " + user.email);

   
    goToSuccess();

  } catch (error) {
    console.log("Google login error:", error);
  }
};

  return (
    <div className="container">
      <div className="card">

        <h1 className="logo">Gigza</h1>

        <h2 className="title">What's your email?</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="continue-btn">Continue</button>
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

        <button className="social-btn">
          <FaFacebook className="icon facebook" />
          Continue with Facebook
        </button>

      </div>
    </div>
  );
}

export default Login;