import { useState } from "react";
import { AuthContext } from "./AuthContext.js";

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  const auth = {
    session,
    setSession,
  };

  return <AuthContext value={auth}>{children}</AuthContext>;
}

export default AuthProvider;
