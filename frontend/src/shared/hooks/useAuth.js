import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext.js";

export function useAuth() {
  const auth = useContext(AuthContext);

  if (auth === null) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return auth;
}
