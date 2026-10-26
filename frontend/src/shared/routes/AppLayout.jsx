import { NavLink, Outlet } from "react-router";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import AP_Button from "../../components/ap_button.jsx";
function AppLayout() {
  const { session, logout, settings } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const role = session.user.role;
  async function handleLogout() {
    setLeaving(true);
    await logout();
    setLeaving(false);
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <strong>Smart Appointment</strong>
        <span>
          {session.user.fullName} · {role}
        </span>
        <AP_Button disabled={leaving} onClick={handleLogout}>
          {leaving ? "Logging out…" : "Log out"}
        </AP_Button>
      </header>
      <nav aria-label="Main navigation">
        <NavLink to="/" end>
          Home
        </NavLink>
        {role === "customer" && (
          <>
            <NavLink to="/book">Book appointment</NavLink>
            <NavLink to="/my-appointments">My appointments</NavLink>
          </>
        )}
        {role !== "customer" && (
          <>
            <NavLink to="/appointments">Appointments</NavLink>
            <NavLink to="/queue">Live queue</NavLink>
          </>
        )}
        {role === "admin" && (
          <>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/staff">Staff & schedules</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </>
        )}
      </nav>
      <p className="timezone">All appointment times: {settings.timeZone}</p>
      <Outlet />
    </div>
  );
}
export default AppLayout;
