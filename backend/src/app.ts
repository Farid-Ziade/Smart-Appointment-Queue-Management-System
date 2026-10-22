import express from "express";

const app = express();

app.get("/api/health", (req, res) => {
  res.json({
    message: "Appointment API is running",
  });
});

export default app;
