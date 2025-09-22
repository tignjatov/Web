import { useEffect, useState } from "react";
import * as api from "../../utils/apiClient.js";

const BLANK = {
    firstName: "",
    lastName: "",
    email: "",
    role: "EVENT_CREATOR",
    password: "",
};

export default function EMS_Users() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(BLANK);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [listErr, setListErr] = useState("");

    const load = async () => {
        setLoading(true);
        setListErr("");
        try {
            const res = await api.listUsers(1, 50);
            setItems(res.items ?? res ?? []);
        } catch (e) {
            setListErr(e?.message || "Greška pri učitavanju korisnika");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const validate = (f) => {
        if (!f.firstName.trim()) return "Ime je obavezno";
        if (!f.lastName.trim()) return "Prezime je obavezno";
        if (!f.email.trim()) return "Email je obavezan";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
            return "Neispravan email";
        if (!f.password.trim()) return "Lozinka je obavezna";
        return "";
    };

    const add = async (e) => {
        e.preventDefault();
        setErr("");

        const v = validate(form);
        if (v) {
            setErr(v);
            return;
        }

        try {
            setSaving(true);
            await api.createUser({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                role: form.role,
                password: form.password,
            });
            setForm(BLANK);
            await load();
        } catch (e2) {
            setErr(e2?.message || "Greška pri dodavanju korisnika");
        } finally {
            setSaving(false);
        }
    };

    const toggle = async (u) => {
        if (u.role === "ADMIN") return;
        try {
            if (u.status === "ACTIVE") await api.deactivateUser(u.id);
            else await api.activateUser(u.id);
            await load();
        } catch (e) {
            setListErr(e?.message || "Greška pri promeni statusa");
        }
    };


    return (
        <div className="col gap">
            <h2 className="mt-0">Korisnici</h2>

            {/* */}
            <form onSubmit={add} className="card col w800">
                <div className="row gap wrap">
                    <input
                        placeholder="Ime"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                    <input
                        placeholder="Prezime"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                </div>

                <div className="row gap wrap">
                    <input
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="EVENT_CREATOR">EVENT_CREATOR</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>
                </div>

                <input
                    type="password"
                    placeholder="Lozinka"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                {err && <div className="error">{err}</div>}

                <div className="row gap">
                    <button className="primary" type="submit" disabled={saving}>
                        {saving ? "Dodajem…" : "Dodaj korisnika"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setForm(BLANK);
                            setErr("");
                        }}
                        disabled={saving}
                    >
                        Očisti
                    </button>
                </div>
            </form>

            {/* */}
            <div className="row space-between">
                <div className="muted">Ukupno: {items.length}</div>
                <button onClick={() => void load()} disabled={loading}>
                    ↻ Osveži
                </button>
            </div>

            {listErr && <div className="error">{listErr}</div>}

            {loading ? (
                <div className="shimmer" style={{ height: 120, marginTop: 12 }} />
            ) : (
                <ul className="list">
                    {items.length === 0 ? (
                        <li className="muted">Nema korisnika za prikaz.</li>
                    ) : (
                        items.map((u) => (
                            <li key={u.id} className="card row space-between center">
                                <div>
                                    <div style={{fontWeight: 600}}>
                                        {u.firstName} {u.lastName}
                                    </div>
                                    <div className="muted">{u.email}</div>
                                </div>

                                <div className="row gap">
                  <span className="pill" title="Uloga">
                    {u.role}
                  </span>
                                    <span
                                        className="pill"
                                        title="Status"
                                        style={{
                                            background:
                                                u.status === "ACTIVE"
                                                    ? "rgba(16,185,129,.15)"
                                                    : "rgba(239,68,68,.12)",
                                            color: u.status === "ACTIVE" ? "#065f46" : "#7f1d1d",
                                        }}
                                    >
                    {u.status}
                  </span>
                                </div>

                                <div className="row gap">
                                    {u.role === "ADMIN" ? (
                                        <span className="muted">Admin je uvek aktivan</span>
                                    ) : (
                                        <button onClick={() => void toggle(u)}>
                                            {u.status === "ACTIVE" ? "Deaktiviraj" : "Aktiviraj"}
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
