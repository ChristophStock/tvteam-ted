/*
  BalloonAnimation.jsx
  React component for rising balloon/emoji animation, based on the provided HTML/CSS/JS example.
*/
import React, { useEffect, useRef } from "react";
import "./style/balloon.css";

export default function BalloonAnimation({ emoji, startX, duration, swayDuration, size, fadeStart, onRemove }) {
  const wrapperRef = useRef();

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    // Fade out at fadeStart
    const fadeTimeout = setTimeout(() => {
      wrapper.style.transition = "opacity 1.8s ease-out";
      wrapper.style.opacity = "0";
    }, duration * fadeStart * 1000);
    // Remove after animation
    const removeTimeout = setTimeout(() => {
      onRemove && onRemove();
    }, duration * 1000 + 2500);
    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, [duration, fadeStart, onRemove]);

  return (
    <div
      className="balloon-wrapper"
      ref={wrapperRef}
      style={{
        left: startX,
        animation: `rise ${duration}s linear forwards`,
      }}
    >
      <div
        className="balloon"
        style={{
          fontSize: `${size}rem`,
          animation: `sway ${swayDuration}s ease-in-out infinite alternate`,
        }}
      >
        {emoji}
      </div>
    </div>
  );
}
