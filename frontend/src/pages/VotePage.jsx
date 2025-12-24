// ...existing code...
import React, { useEffect, useState, useRef } from "react";
import { Typography, Button, Box } from "@mui/material";
import { io } from "socket.io-client";

const socket = io({ path: "/socket.io" });

function VotePage() {
  const [question, setQuestion] = useState(null);
  const [voted, setVoted] = useState(false);
  const [emojis, setEmojis] = useState([]);
  const [view, setView] = useState("default"); // "default" | "results" | "singing"
  const [votingActive, setVotingActive] = useState(false);
  const emojiList = ["🎭", "🎤", "🦄", "🦋", "🦚", "🦜", "✨", "🎶"];
  const emojiRefs = useRef([]);


  // Fetch voting status AND global status on mount
  useEffect(() => {
    fetch("/api/voting-status")
      .then((res) => res.json())
      .then((data) => setVotingActive(data.active));
    fetch("/api/global-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.view === "string") setView(data.view);
      });
  }, []);

  useEffect(() => {
    socket.emit("getActiveQuestion");
    socket.on("activeQuestion", (q) => {
      setQuestion(q);
      setVotingActive(!!q && !q.closed && q.active);
    });
    socket.on("questionActivated", (q) => {
      setQuestion(q);
      setVotingActive(!!q && !q.closed && q.active);
    });
    socket.on("questionClosed", () => {
      setQuestion(null);
      setVotingActive(false);
    });
    socket.on("resultView", (v) => setView(v));
    return () => {
      socket.off("activeQuestion");
      socket.off("questionActivated");
      socket.off("questionClosed");
      socket.off("resultView");
    };
  }, []);

  const vote = (idx) => {
    fetch(`/api/questions/${question._id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option: idx }),
    }).then(() => setVoted(true));
  };

  // Emoji animation logic
  const sendEmoji = (emoji) => {
    const side = Math.random() < 0.5 ? "left" : "right";
    const sway = Math.round(30 + Math.random() * 60) * (Math.random() < 0.5 ? -1 : 1);
    const endHeight = 40 + Math.random() * 30;
    socket.emit("sendEmoji", { emoji, side, sway, endHeight });
    const id = Date.now() + Math.random();
    setEmojis((prev) => [...prev, { id, emoji, side, sway, endHeight }]);
    setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== id));
    }, 2200);
  };

  // Show voting options only if voting is active and question is present
  const showVotingOptions = votingActive && !!question && view === "default";

  return (
    <Box
      minHeight="100vh"
      minWidth="100vw"
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent={showVotingOptions ? "flex-start" : "center"}
      sx={{
        background: '#23242a',
        p: 0,
        pt: showVotingOptions ? { xs: '84px', sm: '120px' } : 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        boxSizing: 'border-box',
        border: 'none',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {showVotingOptions ? (
        <>
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              color: '#fff1f7',
              textShadow: '2px 2px 12px #ab218e, 0 0 24px #fff',
              mb: { xs: 2, sm: 4 },
              fontSize: { xs: '1.3em', sm: '2.2em' },
              textAlign: 'center',
            }}
          >
            {question.text}
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            width="100%"
            maxWidth={480}
            sx={{ px: { xs: 2, sm: 0 } }}
          >
            {question.options.map((opt, idx) => (
              <Button
                key={idx}
                variant="contained"
                fullWidth
                onClick={() => vote(idx)}
                disabled={voted}
                sx={{
                  fontSize: { xs: '1.1em', sm: '1.5em' },
                  py: { xs: 1.2, sm: 2 },
                  background: 'linear-gradient(90deg, #ffb347 0%, #ffcc33 100%)',
                  color: '#6a0572',
                  border: '2px solid #fff1f7',
                  boxShadow: '0 2px 12px #ab218e55',
                  mb: 1,
                  fontFamily: 'Luckiest Guy, Comic Sans MS, cursive, sans-serif',
                }}
              >
                {opt}
              </Button>
            ))}
          </Box>
          {voted && (
            <Typography sx={{ color: '#ffb347', mt: 3, fontSize: '1.3em', textShadow: '0 0 8px #fff' }}>
              Danke für deine Stimme!
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="h3" sx={{ color: '#fff1f7', mb: 4, textShadow: '2px 2px 12px #ab218e', textAlign: 'center' }}>
          {votingActive ? "Abstimmung läuft, aber keine Frage aktiv." : "Abstimmung ist aktuell nicht möglich"}
        </Typography>
      )}
      {/* Emoji Buttons always in 4x2 grid at bottom */}
      <Box
        position="fixed"
        left={0}
        right={0}
        bottom={32}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(4, 1fr)', sm: 'repeat(4, 1fr)' }}
        gridTemplateRows={{ xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)' }}
        gap={2}
        zIndex={10}
        width="100vw"
        maxWidth={480}
        margin="0 auto"
        sx={{ px: { xs: 2, sm: 0 } }}
      >
        {emojiList.map((emoji, idx) => (
          <Button
            key={idx}
            variant="outlined"
            sx={{ fontSize: 40, background: 'rgba(255,255,255,0.15)', minWidth: 0, width: '100%', aspectRatio: '1/1' }}
            onClick={() => sendEmoji(emoji)}
            className="emoji-confetti"
          >
            {emoji}
          </Button>
        ))}
      </Box>
      {/* Emoji Animations */}
      {emojis.map((e) => (
        <Box
          key={e.id}
          sx={{
            position: "fixed",
            [e.side]: 8,
            bottom: 32,
            fontSize: 48,
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

export default VotePage;
