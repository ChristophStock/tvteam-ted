
import React from "react";
// Lege das PNG-Logo im gleichen Ordner ab und benenne es z.B. "masked-singer-logo.png"
import logoPng from "./masked-singer-logo.png";

export default function MaskedSingerLogo({ style = {}, imgStyle = {} }) {
  // PNG-Logo statt SVG
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', ...style }}>
      <img
        src={logoPng}
        alt="Masked Singer Logo"
        style={{ maxWidth: '100%', height: 'auto', ...imgStyle }}
      />
    </div>
  );
}
