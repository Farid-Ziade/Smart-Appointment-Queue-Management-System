import AP_Button from "../../components/ap_button.jsx";

function HomeScreen({ user, onLogout }) {
  return (
    <main>
      <h1>Smart Appointment System</h1>

      <p>Welcome, {user.fullName}!</p>
      <p>Email: {user.email}</p>

      <AP_Button onClick={onLogout}>Log out</AP_Button>
    </main>
  );
}

export default HomeScreen;
