import "dotenv/config";
import app from "./app.js";
import { connectDatabase } from "./shared/config/database.js";
import { initializeUserStorage } from "./compositionRoot.js";

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await connectDatabase();
    await initializeUserStorage();

    app.listen(PORT, (error) => {
      if (error) {
        console.error("Could not start the server:", error);
        process.exit(1);
      }

      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not start the application:", error);
    process.exit(1);
  }
}

startServer();
