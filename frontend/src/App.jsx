import { useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import LoginScreen from "./screens/LoginScreen/LoginScreen.jsx";
import HomeScreen from "./screens/HomeScreen/HomeScreen.jsx";

function App() {
  const [session, setSession] = useState(null);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? (
            <Navigate to="/" replace />
          ) : (
            <LoginScreen onLogin={setSession} />
          )
        }
      />

      <Route
        path="/"
        element={
          session ? (
            <HomeScreen user={session.user} onLogout={() => setSession(null)} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to={session ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
