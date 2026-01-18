
import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import BalloonAnimation from "../BalloonAnimation";
import MaskedSingerLogo from "../MaskedSingerLogo";
import "../style/balloon.css";

const socket = io({ path: "/socket.io" });

export default function ResultPage() {
  // Alle Hooks müssen vor jeglichem return stehen!
  const [question, setQuestion] = useState(null);
  const [emojis, setEmojis] = useState([]);
  const sceneRef = useRef();
  const [view, setView] = useState("default");
  const [animatedPercents, setAnimatedPercents] = useState([]);
  // totalVotes und Animation müssen immer initialisiert werden, auch wenn question null ist
  const totalVotes = question?.results?.reduce((a, b) => a + b, 0) || 0;

  useEffect(() => {
    // Hole initial den globalen Status (view)
    fetch("/api/global-status")
      .then((res) => res.ok ? res.json() : { status: "default" })
      .then((data) => {
        if (data && (data.status || data.view)) setView(data.status || data.view);
      })
      .catch(() => setView("default"));

    socket.emit("getActiveQuestion");
    socket.on("activeQuestion", setQuestion);
    socket.on("voteUpdate", setQuestion);
    socket.on("questionClosed", setQuestion);
    // Emojis nur anzeigen, wenn showEmoji kommt (z.B. von VotePage)
    socket.on("showEmoji", (data) => {
      const emoji = data.emoji;
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

  useEffect(() => {
    if (!question?.results) return;
    const percents = question.options.map((opt, idx) => {
      const votes = question.results[idx];
      return totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
    });
    // Start bei 50% der Ziel-BALKENBREITE (nicht Prozentwert)
    setAnimatedPercents(percents.map(p => Math.max(0, Math.round(p * 0.5))));
    // Animate to final in 10s
    const start = Date.now();
    const duration = 5000;
    function animate() {
      const now = Date.now();
      const t = Math.min(1, (now - start) / duration);
      setAnimatedPercents(percents.map((target) => {
        const from = Math.max(0, Math.round(target * 0.5));
        return Math.round(from + (target - from) * t);
      }));
      if (t < 1) requestAnimationFrame(animate);
    }
    animate();
    // eslint-disable-next-line
  }, [question?.results?.join(",")]);

  if (view === "not_started") {
    return (
      <Box sx={{ background: '#23242a', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, zIndex: 1 }}>
        {/* Replace with your test image path or component */}
        <img src="/testbild.png" alt="Testbild" style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 16, boxShadow: '0 0 32px #ab218e88' }} />
      </Box>
    );
  }

  if(view === "default") { // default ist jetzt der "Abstimmung aktiv" Bildschirm
    return (
        <Box ref={sceneRef} className="scene" sx={{ position: "fixed", top: 0, left: 0, width: '100vw', height: '100vh', minHeight: '100vh', background: '#23242a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'hidden' }}>
          {/* Logo kleiner und mittig */}
          <MaskedSingerLogo imgStyle={{ width: '28vw', height: 'auto', marginBottom: 16 }} />
          <Typography variant="h5" sx={{ color: '#ffb347', textShadow: '2px 2px 12px #ab218e', mb: 3, mt: 1, textAlign: 'center' }}>
            Abstimmung aktiv, Jetzt auf dem Handy abstimmen!
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
  // Emoji-Buttons für ResultPage (zweispaltig in "singing" und "results")
  if (view === "singing") {
    return (
      <Box ref={sceneRef} className="scene" sx={{ background: '#23242a', minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, zIndex: 1, overflow: 'hidden' }}>
        {/* Logo groß und mittig */}
        <MaskedSingerLogo style={{ maxWidth: 600, width: '80vw' }} />
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

  // Ergebnisansicht
  return (
    <Box
      ref={sceneRef}
      className="scene"
      sx={{
        background: '#23242a',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1,
        overflow: 'auto',
        pb: 6,
      }}
    >
      {/* Question text */}
      <Typography variant="h2" sx={{ color: '#ffb347', textShadow: '2px 2px 12px #ab218e', mb: 4, textAlign: 'center', maxWidth: 800 }}>
        {question.text}
      </Typography>
      {/* Flex row: logo left, bars right */}
      <Box sx={{ width: '90%', maxWidth: 1000, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', height: { xs: 'auto', sm: '75vh' } }}>
        {/* Logo on the left - now larger and with more spacing */}
        <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', pr: { xs: 4, sm: 8 } }}>
          <MaskedSingerLogo imgStyle={{ width: '36vw', maxWidth: 320, minWidth: 120, height: 'auto' }} />
        </Box>
        {/* Bars on the right */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
          {question?.options?.map((opt, idx) => {
            const percent = animatedPercents[idx] || 0;
            const minBarWidth = 0.35;
            const maxBarWidth = 0.9;
            const barWidth = `calc(${minBarWidth * 100}% + ${(maxBarWidth - minBarWidth) * percent}%)`;
            const barHeight = { xs: '60px', sm: `calc(15vh)` };
            return (
              <Box
                key={idx}
                mb={{ xs: 2, sm: 4 }}
                sx={{
                  width: '100%',
                  position: 'relative',
                  minHeight: barHeight,
                  height: barHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                {/* Farbiger Balken als Hintergrund, Breite nach Prozent, aber immer minBarWidth */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: barWidth,
                    minWidth: `${minBarWidth * 100}%`,
                    maxWidth: `${maxBarWidth * 100}%`,
                    background: 'linear-gradient(90deg, #ffb347 0%, #ab218e 100%)',
                    borderRadius: 18,
                    boxShadow: '0 4px 32px #ab218e88',
                    transition: 'width 0.2s linear',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                />
                {/* Inhalt immer sichtbar, über dem Balken */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    minWidth: 120,
                    maxWidth: `${maxBarWidth * 100}%`,
                    pl: 2,
                    pr: 2,
                    width: '100%',
                  }}
                >
                  {opt.imageUrl && (
                    <img
                      src={opt.imageUrl}
                      alt={opt.text}
                      style={{ width: 56, height: 56, objectFit: 'contain', marginRight: 18, borderRadius: 10, background: '#fff', boxShadow: '0 2px 8px #ab218e44' }}
                    />
                  )}
                  <Typography
                    sx={{
                      color: '#fff1f7',
                      fontSize: { xs: '1.3em', sm: '2.2em' },
                      textShadow: '1px 1px 12px #ab218e',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                  >
                    {opt.text}
                  </Typography>
                  <Typography
                    sx={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: { xs: '1.2em', sm: '2em' },
                      textShadow: '0 0 12px #ab218e',
                      ml: 2,
                      minWidth: 60,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {percent}%
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
      {/* Balloon Animations (optional, if you want to keep them in result view) */}
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
