import React, { useEffect, useState } from "react";
import { Container, Typography, Box } from "@mui/material";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function ResultPage() {
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    socket.emit("getActiveQuestion");
    socket.on("activeQuestion", setQuestion);
    socket.on("voteUpdate", setQuestion);
    socket.on("questionClosed", setQuestion);
    return () => {
      socket.off("activeQuestion");
      socket.off("voteUpdate");
      socket.off("questionClosed");
    };
  }, []);

  if (!question)
    return (
      <Container>
        <Typography variant="h5">Kein Ergebnis verfügbar</Typography>
      </Container>
    );

  const totalVotes = question.results.reduce((a, b) => a + b, 0);

  return (
    <Container maxWidth="sm">
      <Typography variant="h5" gutterBottom>
        Ergebnisse: {question.text}
      </Typography>
      <Box mt={2}>
        {question.options.map((opt, idx) => {
          const votes = question.results[idx];
          const percent = totalVotes
            ? Math.round((votes / totalVotes) * 100)
            : 0;
          return (
            <Box key={idx} mb={2}>
              <Typography>
                {opt}: {votes} Stimmen ({percent}%)
              </Typography>
              <Box
                height={20}
                bgcolor="#1976d2"
                width={`${percent}%`}
                borderRadius={2}
              />
            </Box>
          );
        })}
      </Box>
      <Typography mt={2}>Gesamtstimmen: {totalVotes}</Typography>
    </Container>
  );
}
