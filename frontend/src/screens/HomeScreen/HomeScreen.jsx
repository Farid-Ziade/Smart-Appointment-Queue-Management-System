function HomeScreen({ user, onLogout }) {
  return (
    <main>
      <h1>Smart Appointment System</h1>

      <p>Welcome, {user.fullName}!</p>
      <p>Email: {user.email}</p>

      <button type="button" onClick={onLogout}>
        Log out
      </button>
    </main>
  );
}

export default HomeScreen;
