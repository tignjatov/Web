import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "@/utils/apiClient";

export default function CategoriesList() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");


    const [topReact, setTopReact] = useState([]);
    const [trErr, setTrErr] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setErr("");
            try {
                const res = await api.get("/categories");
                setItems(res || []);
            } catch (e) {
                setErr(e?.message || "Greška pri učitavanju kategorija");
            } finally {
                setLoading(false);
            }
        })();

        (async () => {
            try {
                const res = await api.get("/events/top-reactions?limit=3");
                setTopReact(res?.items ?? res ?? []);
            } catch (e) {
                setTopReact([]);
                setTrErr(e?.message || "Greška pri učitavanju najviše reakcija.");
            }
        })();
    }, []);

    return (
        <div className="page">
            <h1 className="mt-0">Kategorije</h1>

            {err && <div className="error">{err}</div>}

            {loading ? (
                <div className="grid cards">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card shimmer" style={{ height: 100 }} />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="card">Nema kategorija.</div>
            ) : (
                <div className="grid cards">
                    {items.map((c) => (
                        <article key={c.id} className="card">
                            <Link className="title-link" to={`/events/category/${c.id}`}>
                                <h3 className="mt-0 mb-0">{c.name}</h3>
                            </Link>
                            {c.description && <p style={{ marginTop: 8 }}>{c.description}</p>}
                        </article>
                    ))}
                </div>
            )}

            {/* */}
            <div className="card" style={{ marginTop: 24 }}>
                <h3 className="mt-0" style={{ marginBottom: 10 }}>
                    Najviše reakcija
                </h3>

                {trErr && <div className="error">{trErr}</div>}

                {topReact.length === 0 ? (
                    <div className="muted">Nema podataka.</div>
                ) : (
                    <ul className="list" style={{ marginTop: 8 }}>
                        {topReact.map((e) => {
                            const total = (e.likesCount ?? 0) + (e.dislikesCount ?? 0);
                            return (
                                <li
                                    key={e.id}
                                    className="row space-between"
                                    style={{ alignItems: "baseline" }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <Link to={`/events/${e.id}`} className="title-link">
                                            <b>{e.title}</b>
                                        </Link>
                                        {(e.categoryName || e.category?.name) && (
                                            <div className="muted" style={{ marginTop: 4 }}>
                                                <span className="pill">
                                                    {e.categoryName || e.category?.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="muted" title="Ukupno reakcija">
                                        ⚡ {total}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
