import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import {
  getAccessToken,
  onAuthenticationLost,
  setAccessToken,
} from "./tokenMemory.js";
import apiClient from "../sharedServer/apiClient.js";
function AuthProvider({ children }) {
  const [session, updateSession] = useState(null);
  const [settings, setSettings] = useState(null);
  const [configError, setConfigError] = useState("");
  const [revision, setRevision] = useState(0);
  const reloadConfig = useCallback(() => {
    setConfigError("");
    setRevision((value) => value + 1);
  }, []);
  const setSession = useCallback((value) => {
    setAccessToken(value?.accessToken ?? null);
    updateSession(value);
  }, []);
  useEffect(
    () =>
      onAuthenticationLost((token) => {
        updateSession((current) =>
          current?.accessToken === token ? null : current,
        );
      }),
    [],
  );
  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get("/config", { signal: controller.signal })
      .then((response) => setSettings(response.data))
      .catch((error) => {
        if (!controller.signal.aborted)
          setConfigError(
            error.userMessage || "Could not load application settings.",
          );
      });
    return () => controller.abort();
  }, [revision]);
  const logout = useCallback(async () => {
    const token = getAccessToken();
    try {
      if (token) await apiClient.post("/auth/logout");
    } catch (error) {
      if (error.response?.status !== 401)
        console.warn(
          "Server logout could not be confirmed. The local session was cleared.",
        );
    } finally {
      if (getAccessToken() === token) setSession(null);
    }
  }, [setSession]);
  const auth = useMemo(
    () => ({
      session,
      setSession,
      logout,
      settings,
      configError,
      reloadConfig,
    }),
    [session, setSession, logout, settings, configError, reloadConfig],
  );
  return <AuthContext value={auth}>{children}</AuthContext>;
}
export default AuthProvider;
