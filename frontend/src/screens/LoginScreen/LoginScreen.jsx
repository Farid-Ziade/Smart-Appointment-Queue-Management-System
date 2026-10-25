import { useState } from "react";
import {
  loginUser,
  getCurrentUser,
} from "../../shared/sharedServer/authApi.js";
import AP_Textbox from "../../components/ap_textbox.jsx";
import AP_Button from "../../components/ap_button.jsx";

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
      const loginData = await loginUser(email, password);

      const user = await getCurrentUser(loginData.accessToken);

      onLogin({
        accessToken: loginData.accessToken,
        user,
      });
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
        <AP_Textbox
          id="login-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          required
        />

        <AP_Textbox
          id="login-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          required
        />

        <AP_Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </AP_Button>

        {errorMessage && <p role="alert">{errorMessage}</p>}
      </form>
    </main>
  );
}

export default LoginScreen;
