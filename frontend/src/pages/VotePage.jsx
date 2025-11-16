import React, { useEffect, useState } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function VotePage() {
  const [question, setQuestion] = useState(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    socket.emit("getActiveQuestion");
    socket.on("activeQuestion", setQuestion);
    socket.on("questionActivated", setQuestion);
    socket.on("questionClosed", () => setQuestion(null));
    return () => {
      socket.off("activeQuestion");
      socket.off("questionActivated");
      socket.off("questionClosed");
    };
  }, []);

  const vote = (idx) => {
    fetch(`/api/questions/${question._id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ option: idx }),
    }).then(() => setVoted(true));
  };

  if (!question)
    return (
      <Container>
        <Typography variant="h5">Keine aktive Frage</Typography>
      </Container>
    );

  return (
    <Container maxWidth="sm">
      <Typography variant="h5" gutterBottom>
        {question.text}
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        {question.options.map((opt, idx) => (
          <Button
            key={idx}
            variant="contained"
            fullWidth
            onClick={() => vote(idx)}
            disabled={voted}
          >
            {opt}
          </Button>
        ))}
      </Box>
      {voted && (
        <Typography color="success.main" mt={2}>
          Danke für deine Stimme!
        </Typography>
      )}
    </Container>
  );
}
