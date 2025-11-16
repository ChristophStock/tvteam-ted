
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  TextField,
  Chip,
  Stack,
} from "@mui/material";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

export default function ControlPage() {
  const [questions, setQuestions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [newText, setNewText] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [newOptions, setNewOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = () => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then(setQuestions);
  };

  useEffect(() => {
    fetchQuestions();
    socket.on("questionActivated", (q) => setActiveId(q._id));
    socket.on("questionClosed", (q) => setActiveId(null));
    return () => {
      socket.off("questionActivated");
      socket.off("questionClosed");
    };
  }, []);

  const activate = (id) => {
    fetch(`/api/questions/${id}/activate`, { method: "POST" }).then(() => {
      setActiveId(id);
      fetchQuestions();
    });
  };
  const close = (id) => {
    fetch(`/api/questions/${id}/close`, { method: "POST" }).then(() => {
      setActiveId(null);
      fetchQuestions();
    });
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setNewOptions([...newOptions, optionInput.trim()]);
      setOptionInput("");
    }
  };

  const removeOption = (idx) => {
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  const createQuestion = async (e) => {
    e.preventDefault();
    if (!newText.trim() || newOptions.length < 2) return;
    setLoading(true);
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText, options: newOptions }),
    });
    setNewText("");
    setNewOptions([]);
    setLoading(false);
    fetchQuestions();
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Kontrollseite
      </Typography>

      {/* Neue Frage erstellen */}
      <Box component="form" onSubmit={createQuestion} mb={4}>
        <Typography variant="h6" gutterBottom>
          Neue Frage erstellen
        </Typography>
        <TextField
          label="Fragetext"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <TextField
            label="Antwortoption"
            value={optionInput}
            onChange={(e) => setOptionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption();
              }
            }}
          />
          <Button variant="outlined" onClick={addOption} disabled={!optionInput.trim()}>
            Hinzufügen
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} mb={2}>
          {newOptions.map((opt, idx) => (
            <Chip key={idx} label={opt} onDelete={() => removeOption(idx)} />
          ))}
        </Stack>
        <Button
          type="submit"
          variant="contained"
          color="success"
          disabled={loading || !newText.trim() || newOptions.length < 2}
        >
          Frage anlegen
        </Button>
      </Box>

      {/* Fragen zur Aktivierung */}
      <Typography variant="h6" gutterBottom>
        Fragen zur Aktivierung
      </Typography>
      <List>
        {questions.map((q) => (
          <ListItem
            key={q._id}
            selected={q._id === activeId}
            sx={{
              bgcolor: q.active ? "#e3f2fd" : undefined,
              borderRadius: 2,
              mb: 1,
              boxShadow: q.active ? 2 : 0,
            }}
          >
            <ListItemText
              primary={q.text}
              secondary={q.options.join(", ")}
            />
            <Box display="flex" alignItems="center" gap={1}>
              {q.active ? (
                <Chip label="Aktiv" color="primary" size="small" />
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => activate(q._id)}
                >
                  Aktiv setzen
                </Button>
              )}
              <Button
                variant="contained"
                color="secondary"
                onClick={() => close(q._id)}
                disabled={!q.active}
              >
                Schließen
              </Button>
            </Box>
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
