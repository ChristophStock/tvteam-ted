import React, { useEffect, useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import MaskedSingerLogo from "../MaskedSingerLogo";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function ResultPage() {
  const [question, setQuestion] = useState(null);
  const [emojis, setEmojis] = useState([]);
  const [view, setView] = useState("default"); // "default" | "results"

  useEffect(() => {
    socket.emit("getActiveQuestion");
    socket.on("activeQuestion", setQuestion);
    socket.on("voteUpdate", setQuestion);
    socket.on("questionClosed", setQuestion);
    socket.on("showEmoji", (data) => {
      const id = Date.now() + Math.random();
      // Zufällige X-Position im linken oder rechten Drittel
      const side = Math.random() < 0.5 ? "left" : "right";
      const min = side === "left" ? 5 : 66;
      const max = side === "left" ? 33 : 94;
      const left = `${Math.round(min + Math.random() * (max - min))}vw`;
      // Schwankung für Ballonbewegung
      const sway = typeof data.sway === "number" ? data.sway : Math.round(30 + Math.random() * 40) * (Math.random() < 0.5 ? -1 : 1);
      // Endhöhe (wie hoch der Ballon steigt)
      const endHeight = data.endHeight || 60 + Math.random() * 20; // vh
      setEmojis((prev) => [...prev, { ...data, id, left, sway, endHeight }]);
      setTimeout(() => {
        setEmojis((prev) => prev.filter((e) => e.id !== id));
      }, 2200);
    });
    socket.on("resultView", setView);
    return () => {
      socket.off("activeQuestion");
      socket.off("voteUpdate");
      socket.off("questionClosed");
      socket.off("showEmoji");
      socket.off("resultView");
    };
  }, []);

  if (view === "singing") {
    return (
      <Box sx={{ background: '#23242a', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, zIndex: 1 }}>
        <MaskedSingerLogo style={{ maxWidth: 600, width: '80vw' }} />
      </Box>
    );
  }
  if (!question)
    return (
      <Box sx={{ background: '#23242a', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, zIndex: 1 }}>
        <Typography variant="h5" sx={{ color: '#fff1f7', textShadow: '2px 2px 12px #ab218e' }}>Kein Ergebnis verfügbar</Typography>
      </Box>
    );

  const totalVotes = question.results.reduce((a, b) => a + b, 0);

  if (view === "default") {
    return (
      <Box sx={{ position: "fixed", top: 0, left: 0, width: '100vw', height: '100vh', minHeight: '100vh', background: '#23242a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#fff1f7', textShadow: '2px 2px 12px #ab218e' }}>
          Fragerunde aktiv
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff1f7', mb: 4, opacity: 0.8 }}>
          Die Fragerunde läuft. Ergebnisse werden später angezeigt.
        </Typography>
        {/* Emoji Animations */}
        {emojis.map((e) => (
          <Box
            key={e.id}
            sx={{
              position: "fixed",
              left: e.left,
              bottom: 32,
              fontSize: 56,
              zIndex: 20,
              animation: `flyUpVar${e.id} 2.1s cubic-bezier(.4,.01,.6,1)`,
              '--sway': `${e.sway}px`,
              '--sway-half': `${e.sway / 2}px`,
              '--endHeight': `${e.endHeight}vh`,
              filter: 'drop-shadow(0 0 16px #fff) drop-shadow(0 0 32px #ab218e)',
              pointerEvents: 'none',
            }}
          >
            {e.emoji}
            <style>{`
              @keyframes flyUpVar${e.id} {
                0% { transform: translateY(0) translateX(0); opacity: 1; }
                20% { transform: translateY(calc(-0.2 * var(--endHeight, 60vh))) translateX(var(--sway-half, 0px)); }
                40% { transform: translateY(calc(-0.4 * var(--endHeight, 60vh))) translateX(calc(var(--sway-half, 0px) * -1)); }
                60% { transform: translateY(calc(-0.6 * var(--endHeight, 60vh))) translateX(var(--sway, 0px)); }
                80% { transform: translateY(calc(-0.8 * var(--endHeight, 60vh))) translateX(calc(var(--sway, 0px) * -1)); opacity: 0.9; }
                100% { transform: translateY(calc(-1 * var(--endHeight, 60vh))) translateX(0); opacity: 0; }
              }
            `}</style>
          </Box>
        ))}
      </Box>
    );
  }

  // Ergebnisansicht
  return (
    <Box sx={{ position: "fixed", top: 0, left: 0, width: '100vw', height: '100vh', minHeight: '100vh', background: '#23242a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff1f7', textShadow: '2px 2px 12px #ab218e', mt: 2 }}>
        {question?.text}
      </Typography>
      <Box mt={4} sx={{ width: '80vw', maxWidth: 1200 }}>
        {question?.options?.map((opt, idx) => {
          const votes = question.results[idx];
          const percent = totalVotes
            ? Math.round((votes / totalVotes) * 100)
            : 0;
          return (
            <Box key={idx} mb={4}>
              <Typography sx={{ color: '#fff1f7', fontSize: '2.2em', mb: 1, textShadow: '1px 1px 12px #ab218e' }}>
                {opt}: {votes} Stimmen ({percent}%)
              </Typography>
              <Box
                sx={{
                  height: { xs: 54, sm: 80 },
                  width: `${percent}%`,
                  minWidth: 24,
                  background: 'linear-gradient(90deg, #ffb347 0%, #ab218e 100%)',
                  borderRadius: 16,
                  boxShadow: '0 4px 32px #ab218e88',
                  transition: 'width 0.7s cubic-bezier(.4,.01,.6,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Typography sx={{ color: '#fff', fontWeight: 700, pr: 4, fontSize: { xs: '1.5em', sm: '2em' }, textShadow: '0 0 12px #ab218e' }}>
                  {percent}%
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Typography mt={2} sx={{ color: '#ffb347', fontSize: '2em', textShadow: '0 0 12px #fff', mb: 2 }}>Gesamtstimmen: {totalVotes}</Typography>
      {/* Emoji Animations */}
      {emojis.map((e) => (
        <Box
          key={e.id}
          sx={{
            position: "fixed",
            left: e.left ?? `${Math.random() * 90}vw`,
            bottom: 32,
            fontSize: 56,
            zIndex: 20,
            animation: `flyUpVar${e.id} 2.1s cubic-bezier(.4,.01,.6,1)`,
            '--sway': `${e.sway}px`,
            '--sway-half': `${e.sway / 2}px`,
            '--endHeight': `${e.endHeight}vh`,
            filter: 'drop-shadow(0 0 16px #fff) drop-shadow(0 0 32px #ab218e)',
            pointerEvents: 'none',
          }}
        >
          {e.emoji}
          <style>{`
            @keyframes flyUpVar${e.id} {
              0% { transform: translateY(0) translateX(0); opacity: 1; }
              20% { transform: translateY(calc(-0.2 * var(--endHeight, 60vh))) translateX(var(--sway-half, 0px)); }
              40% { transform: translateY(calc(-0.4 * var(--endHeight, 60vh))) translateX(calc(var(--sway-half, 0px) * -1)); }
              60% { transform: translateY(calc(-0.6 * var(--endHeight, 60vh))) translateX(var(--sway, 0px)); }
              80% { transform: translateY(calc(-0.8 * var(--endHeight, 60vh))) translateX(calc(var(--sway, 0px) * -1)); opacity: 0.9; }
              100% { transform: translateY(calc(-1 * var(--endHeight, 60vh))) translateX(0); opacity: 0; }
            }
          `}</style>
        </Box>
      ))}
    </Box>
  );
}
