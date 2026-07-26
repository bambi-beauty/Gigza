import React, { useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import "./Splash.css";

function Splash({ onDone }) {
  const cardSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.8) translateY(20px)' },
    to: { opacity: 1, transform: 'scale(1) translateY(0px)' },
    config: { tension: 280, friction: 20 }
  });

  const logoSpring = useSpring({
    loop: { reverse: true },
    from: { rotate: 0, scale: 1 },
    to: { rotate: 10, scale: 1.05 },
    config: { tension: 200, friction: 10 },
    delay: 1000
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="splash">
      <animated.div style={cardSpring} className="splash__card">
        <animated.div style={logoSpring} className="splash__logo">
          GZ
        </animated.div>
        <h1 className="splash__title">Gigza</h1>
        <p className="splash__tag">Your Gig Starts Here</p>
        <div className="splash__loader">
          <span />
          <span />
          <span />
        </div>
      </animated.div>
    </div>
  );
}

export default Splash;