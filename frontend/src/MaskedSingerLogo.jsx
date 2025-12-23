import React from "react";

export default function MaskedSingerLogo({ style = {} }) {
  // Replace the SVG below with a real Masked Singer logo SVG or image if available
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
      <svg width="320" height="120" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ms-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffb347"/>
            <stop offset="100%" stopColor="#ab218e"/>
          </linearGradient>
        </defs>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="'Luckiest Guy', 'Comic Sans MS', cursive" fontSize="48" fontWeight="bold" fill="url(#ms-gold)" stroke="#fff" strokeWidth="2" style={{filter:'drop-shadow(0 0 16px #ab218e)'}}>Masked Singer</text>
      </svg>
    </div>
  );
}
