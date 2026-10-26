import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./useAuth.js";
export function useQueueSocket(reload) {
  const { session } = useAuth();
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!session || !["admin", "staff"].includes(session.user.role)) return;
    const socket = io({ auth: { token: session.accessToken } });
    socket.on("connect", () => {
      setConnected(true);
      reload();
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    socket.on("queue:changed", reload);
    // A periodic refresh also recovers a missed event or a worker restart.
    const timer = setInterval(reload, 20000);
    return () => {
      clearInterval(timer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [session, reload]);
  return connected;
}
