import { useState } from "react";
import { getHealth } from "../../shared/sharedServer/healthApi.js";

function HomeScreen() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCheckBackend() {
    setLoading(true);
    setMessage("Checking...");

    try {
      const data = await getHealth();
      setMessage(data.message);
    } catch (error) {
      setMessage(error.userMessage || "Could not complete the check.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Smart Appointment System</h1>

      <button type="button" onClick={handleCheckBackend} disabled={loading}>
        Check backend
      </button>

      <p>{message}</p>
    </main>
  );
}

export default HomeScreen;
