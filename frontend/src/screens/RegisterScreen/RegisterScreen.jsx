import { useState } from "react";
import { Link } from "react-router";
import { registerUser } from "../../shared/sharedServer/authApi.js";
import AP_Textbox from "../../components/ap_textbox.jsx";
import AP_Button from "../../components/ap_button.jsx";

function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      await registerUser({
        fullName,
        email,
        phone,
        password,
      });

      setPassword("");
      setRegistered(true);
    } catch (error) {
      setErrorMessage(
        error?.userMessage ||
          "Could not create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <main>
        <h1>Account created</h1>
        <p>You can now log in with your email and password.</p>
        <Link to="/login">Go to login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Create an account</h1>

      <form onSubmit={handleSubmit}>
        <AP_Textbox
          id="register-full-name"
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={loading}
          required
        />

        <AP_Textbox
          id="register-email"
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          required
        />

        <AP_Textbox
          id="register-phone"
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          disabled={loading}
          required
        />

        <AP_Textbox
          id="register-password"
          label="Password (at least 8 characters)"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          disabled={loading}
          required
        />

        <AP_Button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </AP_Button>

        {errorMessage && <p role="alert">{errorMessage}</p>}
      </form>

      <p>
        <Link to="/login">Back to login</Link>
      </p>
    </main>
  );
}

export default RegisterScreen;
