import { useState } from "react";
import LoginScreen from "./screens/LoginScreen/LoginScreen.jsx";

function App() {
  const [session, setSession] = useState(null);

  if (session === null) {
    return <LoginScreen onLogin={setSession} />;
  }

  return (
    <main>
      <h1>Smart Appointment System</h1>

      <p>Welcome, {session.user.fullName}!</p>
      <p>Email: {session.user.email}</p>

      <button type="button" onClick={() => setSession(null)}>
        Log out
      </button>
    </main>
  );
}

export default App;
