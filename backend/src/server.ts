import app from "./app.js";

const PORT = 5000;

app.listen(PORT, (error) => {
  if (error) {
    console.error("Could not start the server:", error);
    return;
  }

  console.log(`Server running at http://localhost:${PORT}`);
});
