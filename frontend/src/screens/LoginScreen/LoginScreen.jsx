import { useState } from "react";
import { loginUser } from "../../shared/sharedServer/authApi.js";

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await loginUser(email, password);
      onLogin(data);
    } catch (error) {
      setErrorMessage(
        error?.userMessage || "Could not log in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Log in</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div>
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        {errorMessage && <p role="alert">{errorMessage}</p>}
      </form>
    </main>
  );
}

export default LoginScreen;
