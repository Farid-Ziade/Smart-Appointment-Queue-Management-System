import { useState } from "react";
import { Link } from "react-router";
import { registerUser } from "../../shared/sharedServer/authApi.js";
import AP_Textbox from "../../components/ap_textbox.jsx";
import AP_Button from "../../components/ap_button.jsx";
import { ValidationError } from "yup";
import { registerSchema } from "./registerSchema.js";
function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registered, setRegistered] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      const validData = await registerSchema.validate(
        {
          fullName,
          email,
          phone,
          password,
        },
        { abortEarly: false },
      );

      await registerUser(validData);

      setPassword("");
      setRegistered(true);
    } catch (error) {
      if (error instanceof ValidationError) {
        const errors = {};

        for (const issue of error.inner) {
          if (issue.path && !errors[issue.path]) {
            errors[issue.path] = issue.message;
          }
        }

        setFieldErrors(errors);
      } else {
        setErrorMessage(
          error?.userMessage ||
            "Could not create your account. Please try again.",
        );
      }
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

      <form onSubmit={handleSubmit} noValidate>
        <AP_Textbox
          id="register-full-name"
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          error={fieldErrors.fullName}
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
          error={fieldErrors.email}
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
          error={fieldErrors.phone}
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
          error={fieldErrors.password}
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
