import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("TaskAgent backend is alive ✅"));

app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message must be a string" });
  }
  return res.json({ agent: "TaskAgent", reply: `Received: ${message}` });
});

const PORT = process.env.PORT || 3000;

// bind 0.0.0.0 is safe on Render
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on ${PORT}`);
});
