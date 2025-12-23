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

// REST API
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
  io.emit("questionActivated", question);
  res.json(question);
});

app.post("/api/questions/:id/close", async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, {
    closed: true,
    active: false,
  });
  io.emit("questionClosed", question);
  res.json(question);
});

app.post("/api/questions/:id/vote", async (req, res) => {
  const { option } = req.body;
  const question = await Question.findById(req.params.id);
  if (!question || !question.active || question.closed)
    return res.status(400).json({ error: "Voting not allowed" });
  question.results[option]++;
  await question.save();
  io.emit("voteUpdate", question);
  res.json(question);
});

// WebSocket Events
io.on("connection", (socket) => {
  socket.on("getActiveQuestion", async () => {
    const question = await Question.findOne({ active: true });
    socket.emit("activeQuestion", question);
  });
  socket.on("sendEmoji", (data) => {
    io.emit("showEmoji", data);
  });
  socket.on("setResultView", (view) => {
    io.emit("resultView", view);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
