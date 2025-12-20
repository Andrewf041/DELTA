import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Ты DELTA — персональный ИИ-ассистент. Ты умный, спокойный, логичный. Отвечай по-русски."
        },
        { role: "user", content: userMessage }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка ИИ" });
  }
});

app.listen(PORT, () => {
  console.log("DELTA AI server running on port", PORT);
});

