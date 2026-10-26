import { Navigate, Route, Routes } from "react-router";
import { useAuth } from "./shared/hooks/useAuth.js";
import ProtectedRoute from "./shared/routes/ProtectedRoute.jsx";
import AppLayout from "./shared/routes/AppLayout.jsx";
import AP_Feedback from "./components/ap_feedback.jsx";
import LoginScreen from "./screens/LoginScreen/LoginScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen/RegisterScreen.jsx";
import HomeScreen from "./screens/HomeScreen/HomeScreen.jsx";
import ServicesScreen from "./screens/ServicesScreen/ServicesScreen.jsx";
import StaffScreen from "./screens/StaffScreen/StaffScreen.jsx";
import BookingScreen from "./screens/BookingScreen/BookingScreen.jsx";
import AppointmentsScreen from "./screens/AppointmentsScreen/AppointmentsScreen.jsx";
import QueueScreen from "./screens/QueueScreen/QueueScreen.jsx";
import DashboardScreen from "./screens/DashboardScreen/DashboardScreen.jsx";
export default function App() {
  const { session, setSession, settings, configError, reloadConfig } =
    useAuth();
  if (!settings)
    return (
      <main>
        <h1>Smart Appointment</h1>
        <AP_Feedback
          loading={!configError}
          error={configError}
          onRetry={reloadConfig}
        />
      </main>
    );
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
        path="/register"
        element={session ? <Navigate to="/" replace /> : <RegisterScreen />}
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomeScreen />} />
          <Route path="book" element={<BookingScreen />} />
          <Route element={<ProtectedRoute roles={["customer"]} />}>
            <Route path="my-appointments" element={<AppointmentsScreen />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin", "staff"]} />}>
            <Route path="appointments" element={<AppointmentsScreen />} />
            <Route path="queue" element={<QueueScreen />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="services" element={<ServicesScreen />} />
            <Route path="staff" element={<StaffScreen />} />
            <Route path="dashboard" element={<DashboardScreen />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="*"
        element={<Navigate to={session ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}
