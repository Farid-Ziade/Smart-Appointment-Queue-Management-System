import { Navigate, Outlet, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";
function ProtectedRoute({ roles }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.user.role))
    return (
      <main>
        <h1>Access denied</h1>
        <Link to="/">Return home</Link>
      </main>
    );
  return <Outlet />;
}
export default ProtectedRoute;
