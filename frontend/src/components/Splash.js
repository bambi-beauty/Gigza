import React, { useEffect } from "react";
import "./Splash.css";

function Splash({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="splash">
      <div className="splash__card">
        <div className="splash__logo">GZ</div>
        <h1 className="splash__title">Gigza</h1>
        <p className="splash__tag">Your Gig Starts Here</p>
        <div className="splash__loader">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default Splash;
