
import React, { useEffect, useState } from "react";
import MaskedSingerLogo from "../MaskedSingerLogo";
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
  const [liveResults, setLiveResults] = useState(null);
  const [newText, setNewText] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [newOptions, setNewOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultView, setResultView] = useState("default"); // "default" | "results" | "singing"

  // Result view control
  const setResultScreen = (view) => {
    setResultView(view);
    socket.emit("setResultView", view);
  };

  const fetchQuestions = () => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then(setQuestions);
          };

  useEffect(() => {
    fetchQuestions();
    socket.on("questionActivated", (q) => setActiveId(q._id));
    socket.on("questionClosed", (q) => setActiveId(null));
    socket.on("voteUpdate", (q) => {
      if (q && q._id === activeId) setLiveResults(q);
    });
    return () => {
      socket.off("questionActivated");
      socket.off("questionClosed");
      socket.off("voteUpdate");
    };
    // eslint-disable-next-line
  }, []);

  // Update liveResults when activeId or questions change
  useEffect(() => {
    if (activeId) {
      const q = questions.find((q) => q._id === activeId);
      setLiveResults(q || null);
    } else {
      setLiveResults(null);
    }
  }, [activeId, questions]);
  // Delete a question
  const deleteQuestion = (id) => {
    if (globalThis.confirm("Frage wirklich löschen?")) {
      fetch(`/api/questions/${id}`, { method: "DELETE" }).then(() => {
        fetchQuestions();
      });
    }
  };

  // Reset results for a question
  const resetQuestion = (id) => {
    if (globalThis.confirm("Ergebnisse dieser Frage wirklich zurücksetzen?")) {
      fetch(`/api/questions/${id}/reset`, { method: "POST" }).then(() => {
        fetchQuestions();
      });
    }
  };

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

              {/* Result view control */}
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>
                  Resultseite steuern
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant={resultView === "default" ? "contained" : "outlined"}
                    color="primary"
                    onClick={() => setResultScreen("default")}
                  >
                    Fragerunde aktiv
                  </Button>
                  <Button
                    variant={resultView === "results" ? "contained" : "outlined"}
                    color="secondary"
                    onClick={() => setResultScreen("results")}
                  >
                    Ergebnisse anzeigen
                  </Button>
                  <Button
                    variant={resultView === "singing" ? "contained" : "outlined"}
                    color="warning"
                    onClick={() => setResultScreen("singing")}
                  >
                    Gesamtstatus: Singen
                  </Button>
                </Stack>
                {resultView === "singing" && (
                  <Box mt={2}>
                    <MaskedSingerLogo style={{ maxWidth: 400, margin: '0 auto' }} />
                  </Box>
                )}
              </Box>

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
                    <Chip key={opt + idx} label={opt} onDelete={() => removeOption(idx)} />
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
                    sx={{
                      bgcolor: q.active ? "#e3f2fd" : undefined,
                      borderRadius: 2,
                      mb: 1,
                      boxShadow: q.active ? 2 : 0,
                      outline: q._id === activeId ? '2px solid #1976d2' : undefined,
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
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => deleteQuestion(q._id)}
                        size="small"
                      >
                        Löschen
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => resetQuestion(q._id)}
                        size="small"
                      >
                        Zurücksetzen
                      </Button>
                    </Box>
                  </ListItem>
                ))}
              </List>

              {/* Live results for active question */}
              {liveResults && (
                <Box mt={4} p={2} bgcolor="#222" borderRadius={2} color="#fff">
                  <Typography variant="h6" gutterBottom>
                    Live-Ergebnis: {liveResults.text}
                  </Typography>
                  {liveResults.options.map((opt, idx) => (
                    <Box key={opt + idx} display="flex" alignItems="center" mb={1}>
                      <Box minWidth={120}>{opt}</Box>
                      <Box
                        flex={1}
                        bgcolor="#444"
                        borderRadius={1}
                        mx={1}
                        height={24}
                        position="relative"
                      >
                        <Box
                          bgcolor="#ffb300"
                          height={24}
                          borderRadius={1}
                          width={`${
                            liveResults.results?.[idx]
                              ? (liveResults.results[idx] /
                                  Math.max(1, Math.max(...(liveResults.results ?? [1])))) *
                                100
                              : 0
                          }%`}
                          position="absolute"
                          top={0}
                          left={0}
                        />
                      </Box>
                      <Box minWidth={32} textAlign="right">
                        {liveResults.results?.[idx] ?? 0}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Container>
          );
}

