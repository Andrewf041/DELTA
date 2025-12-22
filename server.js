import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

/**
 * Простейшая память диалога (на сессию сервера)
 * позже можно заменить на БД
 */
let memory = [];

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Пустое сообщение" });
    }

    // сохраняем в память
    memory.push({ role: "user", content: message });

    // === ВРЕМЕННАЯ ЛОГИКА (пока без OpenAI) ===
    let reply = "";

    if (/привет|здрав|hello/i.test(message)) {
      reply = "Привет. Я на связи.";
    } else if (/кто ты/i.test(message)) {
      reply = "Я DELTA. Серверный интеллект.";
    } else if (/кто я/i.test(message)) {
      reply = "Ты мой создатель.";
    } else {
      reply = "Я получил сообщение: «" + message + "»";
    }

    memory.push({ role: "assistant", content: reply });

    // ❗ КЛЮЧЕВОЕ МЕСТО
    return res.json({
      reply: reply
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      reply: "Ошибка сервера"
    });
  }
});

app.get("/", (req, res) => {
  res.send("DELTA AI server is running");
});

app.listen(PORT, () => {
  console.log(`DELTA AI работает на порту ${PORT}`);
});


