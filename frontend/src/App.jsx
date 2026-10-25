import { useAuth } from "./shared/hooks/useAuth.js";
import { Navigate, Route, Routes } from "react-router";
import LoginScreen from "./screens/LoginScreen/LoginScreen.jsx";
import HomeScreen from "./screens/HomeScreen/HomeScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen/RegisterScreen.jsx";
function App() {
  const { session, setSession } = useAuth();

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
        path="/register"
        element={session ? <Navigate to="/" replace /> : <RegisterScreen />}
      />

      <Route
        path="*"
        element={<Navigate to={session ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;
