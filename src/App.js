import React, { useState } from "react";
import Login from "./Components/Login";
import Verification from "./Components/Verification";

function App() {
  const [step, setStep] = useState("login");

  return (
    <>
      {step === "login" && (
        <Login goToVerification={() => setStep("verification")} 
         goToSuccess={() => setStep("success")} />
      )}

       {step === "verification" && (
        <Verification goToSuccess={() => setStep("success")} />

      )}

      {step === "success" && (
        <h1 style={{ textAlign: "center" }}>
          🎉 You are verified!
        </h1>
      )}
    </>
  );
}

export default App;