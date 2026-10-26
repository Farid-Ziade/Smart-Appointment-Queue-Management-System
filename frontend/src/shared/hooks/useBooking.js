import { useRef, useState } from "react";
import { appointmentApi } from "../sharedServer/appointmentApi.js";
export function useBooking() {
  const request = useRef(null),
    active = useRef(false);
  const [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  async function submit(data, appointmentId, onConflict) {
    if (active.current) return null;
    const fingerprint = JSON.stringify({ ...data, appointmentId });
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, key: crypto.randomUUID() };
    active.current = true;
    setLoading(true);
    setError("");
    try {
      const result = appointmentId
        ? await appointmentApi.reschedule(appointmentId, {
            staffId: data.staffId,
            startAt: data.startAt,
          })
        : await appointmentApi.book(data, request.current.key);
      request.current = null;
      return result.appointment;
    } catch (failure) {
      setError(failure.userMessage || "Could not submit the booking.");
      if (failure.errorCode === "SLOT_UNAVAILABLE") onConflict();
      return null;
    } finally {
      active.current = false;
      setLoading(false);
    }
  }
  return { submit, loading, error };
}
