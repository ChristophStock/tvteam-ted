
import React, { useEffect, useState, useRef } from "react";
import { Container, Typography, Box } from "@mui/material";
import MaskedSingerLogo from "../MaskedSingerLogo";
import { io } from "socket.io-client";
import BalloonAnimation from "../BalloonAnimation";
import "../style/balloon.css";

const socket = io({ path: "/socket.io" });

export default function ResultPage() {
  const [question, setQuestion] = useState(null);
  const [emojis, setEmojis] = useState([]);
  const sceneRef = useRef();
  const [view, setView] = useState("default"); // "default" | "results"

  useEffect(() => {
    socket.emit("getActiveQuestion");
    socket.on("activeQuestion", setQuestion);
    socket.on("voteUpdate", setQuestion);
    socket.on("questionClosed", setQuestion);
    // Emojis nur anzeigen, wenn showEmoji kommt (z.B. von VotePage)
    socket.on("showEmoji", (data) => {
      const emojisArr = ["🎈", "🎈", "🎈", "🎉", "🎊", "🎈", "🎈", "🎈"];
      const emoji = data.emoji || emojisArr[Math.floor(Math.random() * emojisArr.length)];
      const sceneWidth = sceneRef.current ? sceneRef.current.offsetWidth : window.innerWidth;
      let startX;
      if (Math.random() < 0.5) {
        startX = Math.random() * (sceneWidth * 0.25);
      } else {
        startX = sceneWidth * 0.75 + Math.random() * (sceneWidth * 0.25);
      }
      const duration = Math.random() * 8 + 8;
      const swayDuration = Math.random() * 3 + 2.5;
      const size = Math.random() * 1.6 + 1.7;
      const fadeStart = Math.random() * 0.2 + 0.6;
      const id = Date.now() + Math.random();
        setEmojis((prev) => {
          // Verhindere doppelte Emojis beim View-Wechsel: nur hinzufügen, wenn id noch nicht existiert
          if (prev.some((b) => b.id === id)) return prev;
          return [...prev, { id, emoji, startX, duration, swayDuration, size, fadeStart }];
        });
    });
    socket.on("resultView", (v) => {
      setView(v);
      // Emojis beim Statuswechsel leeren, damit keine alten erneut animiert werden
      setEmojis([]);
    });
    // Keine Rücksetzung der Emojis bei View-Wechsel!
    return () => {
      socket.off("activeQuestion");
      socket.off("voteUpdate");
      socket.off("questionClosed");
      socket.off("showEmoji");
      socket.off("resultView");
    };
  }, []);

  // Emoji-Buttons für ResultPage (zweispaltig in "singing" und "results")
  const emojiList = ["🎭", "🎤", "🦄", "🦋", "🦚", "🦜", "✨", "🎶"];
  if (view === "singing") {
    return (
      <Box ref={sceneRef} className="scene" sx={{ background: '#23242a', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, zIndex: 1, overflow: 'hidden' }}>
        <MaskedSingerLogo style={{ maxWidth: 600, width: '80vw' }} />
        {/* Emoji Buttons zweispaltig */}
        <Box position="fixed" left={0} right={0} bottom={32} display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)' }} gap={2} zIndex={10} width="100vw" maxWidth={320} margin="0 auto" sx={{ px: { xs: 2, sm: 0 } }}>
          {emojiList.map((emoji, idx) => (
            <Box key={idx} sx={{ fontSize: 40, background: 'rgba(255,255,255,0.15)', minWidth: 0, width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, border: '1px solid #fff1f7' }}>{emoji}</Box>
          ))}
        </Box>
        {/* Balloon Animations auch im Singen-Modus */}
        {emojis.map((e) => (
          <BalloonAnimation
            key={e.id}
            emoji={e.emoji}
            startX={e.startX}
            duration={e.duration}
            swayDuration={e.swayDuration}
            size={e.size}
            fadeStart={e.fadeStart}
            onRemove={() => setEmojis((prev) => prev.filter((b) => b.id !== e.id))}
          />
        ))}
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
      <Box ref={sceneRef} className="scene" sx={{ position: "fixed", top: 0, left: 0, width: '100vw', height: '100vh', minHeight: '100vh', background: '#23242a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'hidden' }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#fff1f7', textShadow: '2px 2px 12px #ab218e' }}>
          Fragerunde aktiv
        </Typography>
        <Typography variant="body1" sx={{ color: '#fff1f7', mb: 4, opacity: 0.8 }}>
          Die Fragerunde läuft. Ergebnisse werden später angezeigt.
        </Typography>
        {/* Balloon Animations */}
        {emojis.map((e) => (
          <BalloonAnimation
            key={e.id}
            emoji={e.emoji}
            startX={e.startX}
            duration={e.duration}
            swayDuration={e.swayDuration}
            size={e.size}
            fadeStart={e.fadeStart}
            onRemove={() => setEmojis((prev) => prev.filter((b) => b.id !== e.id))}
          />
        ))}
      </Box>
    );
  }

  // Ergebnisansicht
  return (
    <Box ref={sceneRef} className="scene" sx={{ position: "fixed", top: 0, left: 0, width: '100vw', height: '100vh', minHeight: '100vh', background: '#23242a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'hidden' }}>
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
      {/* Emoji Buttons zweispaltig */}
      <Box position="fixed" left={0} right={0} bottom={32} display="grid" gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)' }} gap={2} zIndex={10} width="100vw" maxWidth={320} margin="0 auto" sx={{ px: { xs: 2, sm: 0 } }}>
        {emojiList.map((emoji, idx) => (
          <Box key={idx} sx={{ fontSize: 40, background: 'rgba(255,255,255,0.15)', minWidth: 0, width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, border: '1px solid #fff1f7' }}>{emoji}</Box>
        ))}
      </Box>
      {/* Balloon Animations */}
      {emojis.map((e) => (
        <BalloonAnimation
          key={e.id}
          emoji={e.emoji}
          startX={e.startX}
          duration={e.duration}
          swayDuration={e.swayDuration}
          size={e.size}
          fadeStart={e.fadeStart}
          onRemove={() => setEmojis((prev) => prev.filter((b) => b.id !== e.id))}
        />
      ))}
    </Box>
  );
}
