// ...existing code...

import React, { useEffect, useState, useRef } from "react";
import { Typography, Button, Box } from "@mui/material";
import { io } from "socket.io-client";
import MaskedSingerLogo from "../MaskedSingerLogo";

const socket = io({ path: "/socket.io" });

function VotePage() {
  const [question, setQuestion] = useState(null);
  const [voted, setVoted] = useState(false);
  const [emojis, setEmojis] = useState([]);
  // "default" | "results" | "singing" | "not_started"
  const [view, setView] = useState("default");
  const [votingActive, setVotingActive] = useState(false);
  // 🎭: masks, 🎤: microphone, ✨: stars, 🎶: notes, 🍺: beer, 🍸: cocktail
  const emojiList = ["🎭", "🎤", "✨", "🎶", "🍺", "🍸"];
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
  const showNotStarted = view === "not_started";
  const showLogoOnly = view === "singing" || view === "results";

  return (
    <Box
      minHeight="100vh"
      minWidth="100vw"
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      sx={{
        background: '#23242a',
        p: 0,
        pt: showVotingOptions ? { xs: '8px', sm: '20px' } : 0,
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
      {/* Show logo at top, size depends on mode */}
      {showLogoOnly ? (
        <Box sx={{ width: '100%', display: 'flex', mt: { xs: 8, sm: 10 }, mb: { xs: 2, sm: 4 } }}>
          <MaskedSingerLogo style={{ width: '100%' }} imgStyle={{ maxWidth: 260, width: '60vw', height: 'auto' }} />
        </Box>
      ) : showVotingOptions ? (
        <Box sx={{ width: '100%', display: 'flex', mt: { xs: 2, sm: 3 }, mb: { xs: 1, sm: 2 } }}>
          <MaskedSingerLogo style={{ width: '100%' }} imgStyle={{ maxWidth: 64, width: '50vw', height: 'auto' }} />
        </Box>
      ) : null}

      {/* Voting options only in voting mode */}
      {showVotingOptions && (
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
      )}

      {/* Show info only in not_started mode */}
      {showNotStarted && (
        <Box display="flex" flexDirection="column" alignItems="center" width="100%" height="100%" sx={{ mt: 8 }}>
          <Typography variant="h3" sx={{ color: '#fff1f7', mb: 4, textShadow: '2px 2px 12px #ab218e', textAlign: 'center' }}>
            Du bist auf der richtigen Seite.<br />Die Show beginnt bald.<br />Die App aktiviert sich automatisch!
          </Typography>
        </Box>
      )}

      {/* Emoji Buttons always visible except in not_started mode */}
      {!showNotStarted && (
        <Box
          position="fixed"
          left={0}
          right={0}
          bottom={32}
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' }}
          gridTemplateRows={{ xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)' }}
          gap={2}
          zIndex={10}
          width="95vw"
          maxWidth={480}
          margin="0 auto"
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
      )}

      {/* If not voting, not logo-only, not not_started, show fallback info */}
      {(!showVotingOptions && !showLogoOnly && !showNotStarted) && (
        <Typography variant="h3" sx={{ color: '#fff1f7', mb: 4, textShadow: '2px 2px 12px #ab218e', textAlign: 'center' }}>
          {votingActive ? "Abstimmung läuft, aber keine Frage aktiv." : "Abstimmung ist aktuell nicht möglich"}
        </Typography>
      )}
    </Box>
  );
}

export default VotePage;
