import { useRef, useState } from "react";
export function useAction() {
  const active = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function run(action, message = "Saved successfully.") {
    if (active.current) return null;
    active.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await action();
      setSuccess(message);
      return result;
    } catch (failure) {
      setError(failure.userMessage || failure.message || "The action failed.");
      return null;
    } finally {
      active.current = false;
      setBusy(false);
    }
  }
  return { run, busy, error, success };
}
