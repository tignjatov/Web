import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";

export default function Protected({ roles, children }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children ?? <Outlet />;
}
