import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";
import logo from "@/assets/logo.png";

const canUseEMS = (user) =>
    !!user && (user.role === "ADMIN" || user.role === "EVENT_CREATOR");

export default function NavBar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    return (
        <header className="navbar">
            {/* */}
            <div className="navbar-left">
                <Link to="/" className="brand">
                    <img src={logo} alt="Logo" />
                    <span>RAF Event Booker</span>
                </Link>
            </div>

            {/* */}
            <nav className="navbar-center">
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/top">Najposećeniji</NavLink>
                <NavLink to="/categories">Kategorije</NavLink>
                <NavLink to="/search">Pretraga</NavLink>
                {canUseEMS(user) && <NavLink to="/ems">EMS</NavLink>}
            </nav>

            {/* */}
            <div className="navbar-right">
                {!user ? (
                    <NavLink to="/login" className="btn primary">Login</NavLink>
                ) : (
                    <>
                        <span className="muted">
                            {user.email}{" "}
                        </span>
                        <span className="pill" title="Uloga">{user.role}</span>

                        <button className="primary" onClick={onLogout}>Logout</button>
                    </>
                )}
            </div>
        </header>
    );
}
