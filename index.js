import express from "express";
import cors from "cors";
import getDb from "./db.js";

const app = express();

/* ================================
   Middleware
================================ */
app.use(cors());
app.use(express.json());

/* ================================
   Health Check
================================ */
app.get("/", (req, res) => {
  res.send("TaskAgent backend is alive ✅");
});

/* ================================
   SQLite-backed Tools (better-sqlite3)
   - Sync DB operations (simple + reliable on Render)
================================ */

function createTask(title) {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const cleanTitle = title.trim();

  const stmt = db.prepare(
    "INSERT INTO tasks (title, done, createdAt) VALUES (?, 0, ?)",
  );
  const result = stmt.run(cleanTitle, createdAt);

  return {
    id: Number(result.lastInsertRowid),
    title: cleanTitle,
    done: false,
    createdAt,
  };
}

function listTasks() {
  const db = getDb();

  const rows = db
    .prepare("SELECT id, title, done, createdAt FROM tasks ORDER BY id DESC")
    .all();

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    done: Boolean(r.done),
    createdAt: r.createdAt,
  }));
}

function completeTask(id) {
  const db = getDb();

  const task = db
    .prepare("SELECT id, title, done, createdAt FROM tasks WHERE id = ?")
    .get(id);

  if (!task) return null;

  db.prepare("UPDATE tasks SET done = 1 WHERE id = ?").run(id);

  return {
    id: task.id,
    title: task.title,
    done: true,
    createdAt: task.createdAt,
  };
}

/* ================================
   Intent Router (Brain)
================================ */
function routeIntent(message) {
  const m = message.trim();

  // add task buy milk | create task buy milk
  const addMatch = m.match(/^(add|create)\s+task\s+(.+)$/i);
  if (addMatch) {
    return { intent: "create_task", title: addMatch[2] };
  }

  // todo buy milk
  const todoMatch = m.match(/^todo\s+(.+)$/i);
  if (todoMatch) {
    return { intent: "create_task", title: todoMatch[1] };
  }

  // list tasks | show tasks
  if (/^(list|show)\s+tasks$/i.test(m)) {
    return { intent: "list_tasks" };
  }

  // complete 2 | done 2
  const completeMatch = m.match(/^(complete|done)\s+(\d+)$/i);
  if (completeMatch) {
    return { intent: "complete_task", id: Number(completeMatch[2]) };
  }

  return { intent: "unknown" };
}

/* ================================
   Helpers
================================ */
function formatTasks(tasks) {
  if (tasks.length === 0) return "No tasks yet.";

  return tasks
    .map((t) => `${t.done ? "✅" : "⬜"} [${t.id}] ${t.title}`)
    .join("\n");
}

/* ================================
   Agent API Endpoint
================================ */
app.post("/api/chat", (req, res) => {
  try {
    const { message } = req.body;

    if (typeof message !== "string" || message.trim() === "") {
      return res
        .status(400)
        .json({ error: "message must be a non-empty string" });
    }

    const action = routeIntent(message);

    if (action.intent === "create_task") {
      const task = createTask(action.title);
      const tasks = listTasks();

      return res.json({
        agent: "TaskAgent",
        intent: "create_task",
        reply: `Created task ✅: [${task.id}] ${task.title}`,
        tasks,
      });
    }

    if (action.intent === "list_tasks") {
      const tasks = listTasks();

      return res.json({
        agent: "TaskAgent",
        intent: "list_tasks",
        reply: formatTasks(tasks),
        tasks,
      });
    }

    if (action.intent === "complete_task") {
      const task = completeTask(action.id);

      if (!task) {
        return res.json({
          agent: "TaskAgent",
          intent: "complete_task",
          reply: `No task found with id ${action.id}`,
        });
      }

      const tasks = listTasks();

      return res.json({
        agent: "TaskAgent",
        intent: "complete_task",
        reply: `Completed ✅: [${task.id}] ${task.title}`,
        tasks,
      });
    }

    return res.json({
      agent: "TaskAgent",
      intent: "unknown",
      reply:
        "I can help with tasks. Try:\n" +
        "- add task <title>\n" +
        "- list tasks\n" +
        "- complete <id>",
    });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* ================================
   Start Server (Render-compatible)
================================ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on ${PORT}`);
});
