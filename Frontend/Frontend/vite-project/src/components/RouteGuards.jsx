import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/state/AuthProvider";

export function GuestOnly({ children }) {
    const { ready, user } = useAuth();
    const loc = useLocation();

    if (!ready) return null;
    if (user) return <Navigate to={loc.state?.from ?? "/"} replace />;
    return children;
}

export function RequireAuth({ roles, children }) {
    const { ready, user } = useAuth();
    const loc = useLocation();

    if (!ready) return null;
    if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}
