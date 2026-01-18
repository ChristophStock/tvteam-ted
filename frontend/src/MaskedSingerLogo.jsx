
import React from "react";
import logoPng from "./masked-singer-logo.png";
import "./style/logo-effect.css";

export default function MaskedSingerLogo({ style = {}, imgStyle = {} }) {
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
      <img
        src={logoPng}
        alt="Masked Singer Logo"
        className="logo-pulse"
        style={{ maxWidth: '100%', height: 'auto', zIndex: 1, ...imgStyle }}
      />
    </div>
  );
}
