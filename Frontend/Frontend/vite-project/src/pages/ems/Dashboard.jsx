import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../state/AuthProvider.jsx";

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="page row gap">
            {/* */}
            <aside
                className="card"
                style={{ width: 240, alignSelf: "flex-start", position: "sticky", top: 80, padding: 12 }}
            >
                <div className="row gap center" style={{ marginBottom: 10 }}>
                    <div className="pill" title="Event Management System" style={{ fontWeight: 600 }}>
                        EMS panel
                    </div>
                </div>

                <nav className="col" style={{ gap: 6 }}>
                    <NavLink
                        to="events"
                        className={({ isActive }) => "row gap" + (isActive ? " active" : "")}
                        style={({ isActive }) => ({
                            padding: "10px 12px",
                            borderRadius: 10,
                            textDecoration: "none",
                            color: "inherit",
                            background: isActive ? "rgba(11,107,203,.08)" : "transparent",
                            border: isActive ? "1px solid rgba(11,107,203,.25)" : "1px solid transparent",
                            transition: "background .15s ease, border-color .15s ease",
                        })}
                    >
                        <span>📅</span>
                        <span>Događaji</span>
                    </NavLink>

                    <NavLink
                        to="categories"
                        className={({ isActive }) => "row gap" + (isActive ? " active" : "")}
                        style={({ isActive }) => ({
                            padding: "10px 12px",
                            borderRadius: 10,
                            textDecoration: "none",
                            color: "inherit",
                            background: isActive ? "rgba(11,107,203,.08)" : "transparent",
                            border: isActive ? "1px solid rgba(11,107,203,.25)" : "1px solid transparent",
                            transition: "background .15s ease, border-color .15s ease",
                        })}
                    >
                        <span>🏷️</span>
                        <span>Kategorije</span>
                    </NavLink>

                    {/* */}
                    {user?.role === "ADMIN" && (
                        <NavLink
                            to="users"
                            className={({ isActive }) => "row gap" + (isActive ? " active" : "")}
                            style={({ isActive }) => ({
                                padding: "10px 12px",
                                borderRadius: 10,
                                textDecoration: "none",
                                color: "inherit",
                                background: isActive ? "rgba(11,107,203,.08)" : "transparent",
                                border: isActive ? "1px solid rgba(11,107,203,.25)" : "1px solid transparent",
                                transition: "background .15s ease, border-color .15s ease",
                            })}
                        >
                            <span>👤</span>
                            <span>Korisnici</span>
                        </NavLink>
                    )}
                </nav>
            </aside>

            {/* */}
            <main className="grow">
                <div className="row space-between center" style={{ marginBottom: 12 }}>
                    <h1 className="mt-0" style={{ marginBottom: 0 }}>Kontrolna tabla</h1>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: 16 }}>
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
