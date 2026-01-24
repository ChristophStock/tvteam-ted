
import React, { useEffect, useState, useCallback, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import MaskedSingerLogo from "../MaskedSingerLogo";
import OptionImageUpload from "../OptionImageUpload";
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
  LinearProgress,
} from "@mui/material";
import { io } from "socket.io-client";
import { RESULT_VIDEOS } from "../videoManifest";

const socket = io({ path: "/socket.io" });

const AUTH_STATUS_KEY = "controlAuthStatus";
const AUTH_SIGNATURE_KEY = "controlAuthSignature";

// Simple deterministic hash avoids storing the raw password in localStorage
const computePasswordSignature = (value) => {
  if (!value) return "";
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
};

export default function ControlPage() {
  const [questions, setQuestions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [liveResults, setLiveResults] = useState(null);
  const [newText, setNewText] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [optionImages, setOptionImages] = useState([]); // Array of File or null
  const [newOptions, setNewOptions] = useState([]); // Array of { text, imageUrl }
  const [loading, setLoading] = useState(false);
  const [resultView, setResultView] = useState("default"); // "default" | "results" | "singing"
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [config, setConfig] = useState({ controlPassword: "", allowedHosts: "" });
  const [videoCacheStatus, setVideoCacheStatus] = useState(null);
  const activeIdRef = useRef(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [editOptions, setEditOptions] = useState([]); // Array of { text, imageUrl }
  const [editOptionImages, setEditOptionImages] = useState([]); // Array of File or null
  const [editQuestionId, setEditQuestionId] = useState(null);

  // Open edit dialog for a question
  const openEdit = (q) => {
    setEditQuestionId(q._id);
    setEditText(q.text);
    setEditOptions(q.options.map(opt => ({ ...opt })));
    setEditOptionImages(q.options.map(() => null));
    setEditOpen(true);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditOpen(false);
    setEditText("");
    setEditOptions([]);
    setEditOptionImages([]);
    setEditQuestionId(null);
  };

  // Handle edit text change
  const handleEditTextChange = (e) => {
    setEditText(e.target.value);
  };

  // Handle edit option text change
  const handleEditOptionTextChange = (idx, value) => {
    setEditOptions((opts) => {
      const updated = [...opts];
      updated[idx] = { ...updated[idx], text: value };
      return updated;
    });
  };

  // Handle edit option image change
  const handleEditOptionImageChange = (idx, file) => {
    const newImgs = [...editOptionImages];
    newImgs[idx] = file;
    setEditOptionImages(newImgs);
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditOptions((opts) => {
        const updated = [...opts];
        updated[idx] = { ...updated[idx], imageUrl: e.target.result };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  // Save edit
  const saveEdit = async () => {
    // 1. Update question text and options (without images)
    await fetch(`/api/questions/${editQuestionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: editText,
        options: editOptions.map(opt => ({ text: opt.text, imageUrl: opt.imageUrl || null }))
      }),
    });
    // 2. Upload images for each option if present
    await Promise.all(editOptionImages.map(async (file, idx) => {
      if (file) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("questionId", editQuestionId);
        formData.append("optionIndex", idx);
        await fetch("/api/upload-option-image", {
          method: "POST",
          body: formData,
        });
      }
    }));
    cancelEdit();
    fetchQuestions();
  };


  // Result view control
  const setResultScreen = (view) => {
    setResultView(view);
    socket.emit("setResultView", view);
  };

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Hole globalen Status beim Laden
  useEffect(() => {
    fetch("/api/global-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.view === "string") setResultView(data.view);
      });
  }, []);

  useEffect(() => {
    const handleCacheStatus = (payload) => setVideoCacheStatus(payload);
    socket.on("resultVideoCacheStatus", handleCacheStatus);
    return () => {
      socket.off("resultVideoCacheStatus", handleCacheStatus);
    };
  }, []);

  // Hole Config (Passwort, Domain) zur Laufzeit
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then(setConfig);
  }, []);

  useEffect(() => {
    if (!config.controlPassword) return;
    if (typeof window === "undefined" || !window.localStorage) return;
    const storedStatus = window.localStorage.getItem(AUTH_STATUS_KEY);
    const storedSignature = window.localStorage.getItem(AUTH_SIGNATURE_KEY);
    const currentSignature = computePasswordSignature(config.controlPassword);
    if (storedStatus === "true" && storedSignature === currentSignature) {
      setAuthenticated(true);
    } else if (storedStatus || storedSignature) {
      window.localStorage.removeItem(AUTH_STATUS_KEY);
      window.localStorage.removeItem(AUTH_SIGNATURE_KEY);
    }
  }, [config.controlPassword]);

  const fetchQuestions = useCallback(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        const activeQuestion = data.find((q) => q.active && !q.closed);
        if (activeQuestion) {
          setActiveId(activeQuestion._id);
          setLiveResults(activeQuestion);
          activeIdRef.current = activeQuestion._id;
        } else if (activeIdRef.current) {
          setLiveResults(null);
          setActiveId(null);
          activeIdRef.current = null;
        }
      })
      .catch((err) => {
        console.warn("Fragen konnten nicht geladen werden", err);
      });
  }, []);

  const mergeQuestionUpdate = useCallback((updatedQuestion) => {
    if (!updatedQuestion || !updatedQuestion._id) return;
    setQuestions((prev) => {
      if (!Array.isArray(prev)) return prev;
      const idx = prev.findIndex((q) => q._id === updatedQuestion._id);
      if (idx === -1) {
        return [...prev, updatedQuestion];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], ...updatedQuestion };
      return next;
    });
  }, []);

  useEffect(() => {
    fetchQuestions();

    const handleQuestionActivated = (question) => {
      if (!question) return;
      mergeQuestionUpdate(question);
      setActiveId(question._id);
      setLiveResults(question);
      activeIdRef.current = question._id;
    };

    const handleQuestionClosed = (question) => {
      if (question) {
        mergeQuestionUpdate(question);
        setLiveResults(question);
      } else {
        setLiveResults(null);
      }
      setActiveId(null);
      activeIdRef.current = null;
    };

    const handleVoteUpdate = (question) => {
      if (!question) return;
      mergeQuestionUpdate(question);
      if (activeIdRef.current === question._id || question.active) {
        setActiveId(question._id);
        setLiveResults(question);
        activeIdRef.current = question._id;
      }
    };

    socket.on("questionActivated", handleQuestionActivated);
    socket.on("questionClosed", handleQuestionClosed);
    socket.on("voteUpdate", handleVoteUpdate);

    return () => {
      socket.off("questionActivated", handleQuestionActivated);
      socket.off("questionClosed", handleQuestionClosed);
      socket.off("voteUpdate", handleVoteUpdate);
    };
  }, [fetchQuestions, mergeQuestionUpdate]);

  useEffect(() => {
    if (!activeId) return undefined;
    const refreshInterval = setInterval(fetchQuestions, 4000);
    return () => clearInterval(refreshInterval);
  }, [activeId, fetchQuestions]);

  // Update liveResults when activeId or questions change
  useEffect(() => {
    if (activeId) {
      const q = questions.find((q) => q._id === activeId);
      setLiveResults(q || null);
    } else {
      setLiveResults(null);
    }
  }, [activeId, questions]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === config.controlPassword) {
      setAuthenticated(true);
      if (typeof window !== "undefined" && window.localStorage) {
        const signature = computePasswordSignature(config.controlPassword);
        window.localStorage.setItem(AUTH_STATUS_KEY, "true");
        window.localStorage.setItem(AUTH_SIGNATURE_KEY, signature);
      }
      setPassword("");
    } else {
      alert("Falsches Passwort");
    }
  };

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
      setNewOptions([...newOptions, { text: optionInput.trim(), imageUrl: null }]);
      setOptionImages([...optionImages, null]);
      setOptionInput("");
    }
  };

  const removeOption = (idx) => {
    setNewOptions(newOptions.filter((_, i) => i !== idx));
    setOptionImages(optionImages.filter((_, i) => i !== idx));
  };

  // Handle image file selection for an option
  const handleOptionImageChange = (idx, file) => {
    const newImgs = [...optionImages];
    newImgs[idx] = file;
    setOptionImages(newImgs);
    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewOptions((opts) => {
        const updated = [...opts];
        updated[idx] = { ...updated[idx], imageUrl: e.target.result };
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const createQuestion = async (e) => {
    e.preventDefault();
    if (!newText.trim() || newOptions.length < 2) return;
    setLoading(true);
    // 1. Create question with text and options (without images)
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: newText,
        options: newOptions.map(opt => ({ text: opt.text, imageUrl: null }))
      }),
    });
    const question = await res.json();
    // 2. Upload images for each option if present
    if (question && question._id) {
      await Promise.all(optionImages.map(async (file, idx) => {
        if (file) {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("questionId", question._id);
          formData.append("optionIndex", idx);
          const uploadRes = await fetch("/api/upload-option-image", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            // Optionally update UI with new imageUrl
          }
        }
      }));
    }
    setNewText("");
    setNewOptions([]);
    setOptionImages([]);
    setLoading(false);
    fetchQuestions();
  };

  if (!authenticated) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h4" gutterBottom>Kontrollseite</Typography>
        <form onSubmit={handlePasswordSubmit} style={{ marginTop: 32 }}>
          <TextField
            label="Passwort"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            variant="outlined"
            size="small"
            style={{ marginRight: 8 }}
          />
          <Button type="submit" variant="contained" color="primary">Login</Button>
        </form>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom>Kontrollseite</Typography>
      {/* Result view control */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>Gesamtstatus einstellen:</Typography>
        <Stack direction="row" spacing={2}>
                  <Button
                    variant={resultView === "not_started" ? "contained" : "outlined"}
                    color="info"
                    onClick={() => setResultScreen("not_started")}
                  >
                    Show nicht gestartet
                  </Button>
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
            Singen
          </Button>
        </Stack>
        {resultView === "singing" && (
          <Box mt={2}>
            <MaskedSingerLogo style={{ width: '100%', margin: '0 auto' }} imgStyle={{ maxWidth: 400, width: '80vw', height: 'auto' }} />
          </Box>
        )}
        {RESULT_VIDEOS.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>Video-Einspieler</Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {RESULT_VIDEOS.map((video) => (
                <Button
                  key={video.id}
                  variant={resultView === video.id ? "contained" : "outlined"}
                  color={resultView === video.id ? "secondary" : "inherit"}
                  onClick={() => setResultScreen(video.id)}
                >
                  {video.label}
                </Button>
              ))}
            </Stack>
            <Box mt={2} p={2} sx={{ background: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2">
                Cache-Status: {videoCacheStatus ? `${videoCacheStatus.readyCount}/${videoCacheStatus.total} Clips bereit${videoCacheStatus.allReady ? " · vollständig" : ""}` : "Wartet auf Rückmeldung von Ergebnis-Display"}
              </Typography>
              {videoCacheStatus?.details && (
                <Stack spacing={1} mt={2}>
                  {videoCacheStatus.details.map((detail) => {
                    const progress = Math.round((detail.progress || (detail.status === 'ready' ? 1 : 0)) * 100);
                    const statusLabel = detail.status === 'ready'
                      ? 'bereit'
                      : detail.status === 'error'
                        ? `Fehler (${detail.error || 'unbekannt'})`
                        : `${progress}%`;
                    return (
                      <Box key={detail.id}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                          {detail.label}: {statusLabel}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={detail.status === 'ready' ? 100 : detail.status === 'error' ? 0 : progress}
                          color={detail.status === 'error' ? 'error' : 'primary'}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </Box>
      {/* Neue Frage erstellen */}
      <Box component="form" onSubmit={createQuestion} mb={4}>
        <Typography variant="h6" gutterBottom>Neue Frage erstellen</Typography>
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
        <Stack direction="column" spacing={1} mb={2}>
          {newOptions.map((opt, idx) => (
            <Box key={idx} display="flex" alignItems="center" gap={2}>
              <Chip label={opt.text} onDelete={() => removeOption(idx)} />
              <OptionImageUpload
                optionIdx={idx}
                imageUrl={opt.imageUrl}
                onImageChange={handleOptionImageChange}
              />
            </Box>
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
      <Typography variant="h6" gutterBottom>Fragen zur Aktivierung</Typography>
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
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <Box display="flex" alignItems="center" width="100%">
              <ListItemText
                primary={q.text}
                secondary={
                  <Box display="flex" flexWrap="wrap" gap={2}>
                    {q.options.map((opt, idx) => (
                      <Box key={idx} display="flex" alignItems="center" gap={1}>
                        <span>{opt.text}</span>
                        {opt.imageUrl && (
                          <img src={opt.imageUrl} alt="Option" style={{ maxHeight: 32, maxWidth: 48, borderRadius: 4 }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                }
              />
              <IconButton aria-label="Bearbeiten" onClick={() => openEdit(q)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
                  {/* Edit Question Dialog */}
                  <Dialog open={editOpen} onClose={cancelEdit} maxWidth="sm" fullWidth>
                    <DialogTitle>Frage bearbeiten</DialogTitle>
                    <DialogContent>
                      <TextField
                        label="Fragetext"
                        value={editText}
                        onChange={handleEditTextChange}
                        fullWidth
                        margin="normal"
                      />
                      <Stack direction="column" spacing={2} mt={2}>
                        {editOptions.map((opt, idx) => (
                          <Box key={idx} display="flex" alignItems="center" gap={2}>
                            <TextField
                              label={`Antwortoption ${idx + 1}`}
                              value={opt.text}
                              onChange={e => handleEditOptionTextChange(idx, e.target.value)}
                              size="small"
                            />
                            <OptionImageUpload
                              optionIdx={idx}
                              imageUrl={opt.imageUrl}
                              onImageChange={handleEditOptionImageChange}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={cancelEdit}>Abbrechen</Button>
                      <Button onClick={saveEdit} variant="contained" color="primary">Speichern</Button>
                    </DialogActions>
                  </Dialog>
            {/* Ergebnisse je Option anzeigen */}
            {Array.isArray(q.results) && q.results.length === q.options.length && (
              <Box display="flex" flexWrap="wrap" gap={1} mb={1} mt={0.5}>
                {q.options.map((opt, idx) => (
                  <Chip
                    key={opt.text + idx}
                    label={
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{opt.text}</span>
                        {opt.imageUrl && (
                          <img src={opt.imageUrl} alt="Option" style={{ maxHeight: 20, maxWidth: 32, borderRadius: 3 }} />
                        )}
                        <span>: {q.results[idx] ?? 0}</span>
                      </Box>
                    }
                    color="default"
                    size="small"
                    sx={{ background: '#fff1f7', color: '#6a0572', fontWeight: 700, fontFamily: 'Luckiest Guy, Comic Sans MS, cursive, sans-serif' }}
                  />
                ))}
              </Box>
            )}
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
          {(() => {
            const resultValues = liveResults.results ?? [];
            const totalVotes = resultValues.reduce((sum, val) => sum + (val || 0), 0);
            return liveResults.options.map((opt, idx) => {
              const votes = resultValues[idx] ?? 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              const roundedPercentage = Math.round(percentage);
              return (
                <Box key={opt._id || idx} display="flex" alignItems="center" mb={1}>
                  <Box minWidth={120} display="flex" alignItems="center" gap={1}>
                    <span>{opt.text}</span>
                    {opt.imageUrl && (
                      <img src={opt.imageUrl} alt="Option" style={{ maxHeight: 24, maxWidth: 36, borderRadius: 3 }} />
                    )}
                  </Box>
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
                      width={`${percentage}%`}
                      position="absolute"
                      top={0}
                      left={0}
                    />
                  </Box>
                  <Box minWidth={60} textAlign="right" display="flex" justifyContent="flex-end" gap={1}>
                    <span>{votes}</span>
                    <span style={{ opacity: 0.8 }}>{roundedPercentage}%</span>
                  </Box>
                </Box>
              );
            });
          })()}
        </Box>
      )}
    </Container>
  );
}

