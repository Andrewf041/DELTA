const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("DELTA is online 🚀");
});

app.listen(PORT, () => {
  console.log("DELTA server running on port", PORT);
});
