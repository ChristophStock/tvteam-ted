require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// MongoDB Verbindung
mongoose
  .connect("mongodb://mongo:27017/voting", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB verbunden!");
    // Initialisiere GlobalStatus falls nicht vorhanden
    const status = await GlobalStatus.findOne();
    if (!status) {
      await new GlobalStatus({ view: "default" }).save();
      console.log("GlobalStatus initialisiert: default");
    }
    // Test-Insert: Beispiel-Frage anlegen, falls keine vorhanden
    const count = await Question.countDocuments();
    if (count === 0) {
      const testQ = new Question({
        text: "Testfrage: Was ist 2+2?",
        options: ["3", "4", "5"],
        active: false,
        closed: false,
        results: [0, 0, 0],
      });
      await testQ.save();
      console.log("Testfrage angelegt:", testQ);
    }
  })
  .catch((err) => {
    console.error("MongoDB Fehler:", err);
  });

// Models
const QuestionSchema = new mongoose.Schema({
  text: String,
  options: [String],
  active: Boolean,
  closed: Boolean,
  results: [Number],
});
const Question = mongoose.model("Question", QuestionSchema);

// GlobalStatus Model
const GlobalStatusSchema = new mongoose.Schema({
  view: { type: String, default: "default" }, // "default" | "results" | "singing"
});
const GlobalStatus = mongoose.model("GlobalStatus", GlobalStatusSchema);

// REST API

// API-Route für Konfigurationswerte (Passwort, Domain)
app.get("/api/config", (req, res) => {
  res.json({
    controlPassword: process.env.VITE_CONTROL_PASSWORD || "",
    allowedHosts: process.env.VITE_ALLOWED_HOSTS || "",
    title: process.env.VITE_VOTING_TITLE || "Voting App",
  });
});

// API: Get global status
app.get("/api/global-status", async (req, res) => {
  const status = await GlobalStatus.findOne();
  res.json({ view: status?.view || "default" });
});
app.get("/api/questions", async (req, res) => {
  try {
    const questions = await Question.find();
    console.log("[GET /api/questions]", questions);
    res.json(questions);
  } catch (err) {
    console.error("[GET /api/questions] Error:", err);
    res.status(500).json({ error: "Fehler beim Laden der Fragen" });
  }
});

// Delete a question
app.delete("/api/questions/:id", async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Löschen der Frage" });
  }
});

// Reset results for a question
app.post("/api/questions/:id/reset", async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question)
      return res.status(404).json({ error: "Frage nicht gefunden" });
    question.results = Array(question.options.length).fill(0);
    question.closed = false;
    await question.save();
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: "Fehler beim Zurücksetzen der Frage" });
  }
});

app.post("/api/questions", async (req, res) => {
  try {
    const { text, options } = req.body;
    const question = new Question({
      text,
      options,
      active: false,
      closed: false,
      results: Array(options.length).fill(0),
    });
    await question.save();
    console.log("[POST /api/questions] Neue Frage gespeichert:", question);
    res.json(question);
  } catch (err) {
    console.error("[POST /api/questions] Error:", err);
    res.status(500).json({ error: "Fehler beim Speichern der Frage" });
  }
});

app.post("/api/questions/:id/activate", async (req, res) => {
  await Question.updateMany({}, { active: false });
  const question = await Question.findByIdAndUpdate(req.params.id, {
    active: true,
    closed: false,
  });
  console.log(
    `[STATUS] Frage aktiviert: id=${req.params.id}, text='${
      question?.text || "?"
    }'`
  );
  io.emit("questionActivated", question);
  res.json(question);
});

app.post("/api/questions/:id/close", async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, {
    closed: true,
    active: false,
  });
  console.log(
    `[STATUS] Frage geschlossen: id=${req.params.id}, text='${
      question?.text || "?"
    }'`
  );
  io.emit("questionClosed", question);
  res.json(question);
});

// Vote endpoint: block if not active
app.post("/api/questions/:id/vote", async (req, res) => {
  const { option } = req.body;
  const question = await Question.findById(req.params.id);
  if (!question) {
    console.warn(`[VOTE] No question found for id ${req.params.id}`);
    return res.status(404).json({ error: "No such question" });
  }
  if (!question.active || question.closed) {
    console.warn(
      `[VOTE] Vote blocked: not active or closed. id=${req.params.id}`
    );
    return res.status(400).json({ error: "Voting not allowed: not active" });
  }
  question.results[option]++;
  await question.save();
  io.emit("voteUpdate", question);
  res.json(question);
});

// New: Get current voting status (active question or not)
app.get("/api/voting-status", async (req, res) => {
  const question = await Question.findOne({ active: true });
  if (question && !question.closed) {
    res.json({ active: true, question });
  } else {
    res.json({ active: false, question: null });
  }
});

// WebSocket Events
io.on("connection", async (socket) => {
  // Sende aktuellen globalen Status direkt nach Verbindung
  const status = await GlobalStatus.findOne();
  socket.emit("resultView", status?.view || "default");

  socket.on("getActiveQuestion", async () => {
    const question = await Question.findOne({ active: true });
    socket.emit("activeQuestion", question);
  });
  socket.on("sendEmoji", (data) => {
    io.emit("showEmoji", data);
  });
  socket.on("setResultView", async (view) => {
    let statusText = "[STATUS] Globaler Status geändert: ";
    if (view === "question") {
      statusText += "Fragerunde aktiv";
    } else if (view === "results") {
      statusText += "Ergebnisse anzeigen";
    } else if (view === "singing") {
      statusText += "Singen";
    } else {
      statusText += `Unbekannt (${view})`;
    }
    console.log(statusText);
    // Speichere neuen Status in DB
    let statusDoc = await GlobalStatus.findOne();
    if (!statusDoc) {
      statusDoc = new GlobalStatus({ view });
    } else {
      statusDoc.view = view;
    }
    await statusDoc.save();
    io.emit("resultView", view);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
