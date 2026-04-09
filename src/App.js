import React, { useState } from "react";
import Login from "./Components/Login";
import Verification from "./Components/Verification";
import Dashboard from "./Components/Dashboard";
import Splash from "./Components/Splash";

function App() {
  const [step, setStep] = useState("splash");

  return (
    <>
      {step === "splash" && <Splash onDone={() => setStep("login")} />}

      {step === "login" && (
        <Login
          goToVerification={() => setStep("verification")}
          goToSuccess={() => setStep("success")}
        />
      )}

      {step === "verification" && (
        <Verification goToSuccess={() => setStep("success")} />
      )}

      {step === "success" && <Dashboard />}
    </>
  );
}

export default App;
