import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [capsOn, setCapsOn] = useState(false);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();

    const redirect = useMemo(() => {
        const r = new URLSearchParams(loc.search).get("r");
        return r && r.startsWith("/") ? r : "/";
    }, [loc.search]);

    useEffect(() => {
        document.getElementById("login-email")?.focus();
    }, []);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setErr("");
        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            setErr("Unesite e-mail i lozinku.");
            return;
        }

        setLoading(true);
        try {
            await login(trimmedEmail, password);
            nav(redirect, { replace: true });
        } catch (e) {
            setErr(e?.message || "Login nije uspeo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrap">
            <div className="card auth-card" style={{ padding: 24 }}>
                <h2 style={{ marginBottom: 16 }}>Prijava</h2>

                <form onSubmit={onSubmit} className="col" style={{ gap: 12 }}>
                    <label htmlFor="login-email" className="muted" style={{ fontSize: 14 }}>
                        E‑mail
                    </label>
                    <input
                        id="login-email"
                        type="email"
                        placeholder="npr. admin@raf.rs"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (err) setErr("");
                        }}
                        autoComplete="email"
                        disabled={loading}
                    />

                    <div className="row space-between" style={{ marginTop: 8 }}>
                        <label htmlFor="login-pass" className="muted" style={{ fontSize: 14 }}>
                            Lozinka
                        </label>
                        <button
                            type="button"
                            className="link"
                            onClick={() => setShowPass((s) => !s)}
                            style={{ fontSize: 13 }}
                            disabled={loading}
                        >
                            {showPass ? "Sakrij" : "Prikaži"}
                        </button>
                    </div>

                    <input
                        id="login-pass"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                            setPass(e.target.value);
                            if (err) setErr("");
                        }}
                        onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
                        autoComplete="current-password"
                        disabled={loading}
                    />

                    {capsOn && (
                        <div className="muted" style={{ fontSize: 12, marginTop: -4 }}>
                            Upozorenje: Uključen je Caps Lock.
                        </div>
                    )}

                    {err && (
                        <div className="error" role="alert" style={{ marginTop: 6 }}>
                            {err}
                        </div>
                    )}

                    <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
                        {loading ? "Prijavljivanje…" : "Login"}
                    </button>
                </form>

                <div className="muted" style={{ fontSize: 12, marginTop: 16 }}>
                    Savet: koristite admin npr. <code>admin@raf.rs</code> / <code>admin</code>
                </div>
            </div>
        </div>
    );
}
