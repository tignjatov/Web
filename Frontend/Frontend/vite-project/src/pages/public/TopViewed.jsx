import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../../utils/apiClient";

function fmtDate(iso) {
    try {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleString();
    } catch {
        return iso || "";
    }
}

export default function TopViewed() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [topReact, setTopReact] = useState([]);
    const [trErr, setTrErr] = useState("");

    useEffect(() => {
        let alive = true;

        setLoading(true);
        setErr("");
        (async () => {
            try {
                const data = await (api.fetchTopViewed
                    ? api.fetchTopViewed()
                    : api.get("/views/top"));
                if (!alive) return;
                const list = Array.isArray(data?.items)
                    ? data.items
                    : Array.isArray(data)
                        ? data
                        : [];
                setItems(list);
            } catch (e) {
                if (!alive) return;
                setErr(e.message || "Greška prilikom učitavanja najposećenijih događaja.");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        (async () => {
            try {
                const res = await api.get("/events/top-reactions?limit=3");
                if (!alive) return;
                setTopReact(res?.items ?? res ?? []);
            } catch (e) {
                if (!alive) return;
                setTopReact([]);
                setTrErr(e?.message || "Greška pri učitavanju najviše reakcija.");
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    return (
        <div className="page">
            <div className="row space-between center">
                <h1 style={{ margin: 0 }}>Najposećeniji (30 dana)</h1>
                <Link to="/" className="link">
                    ⟵ Početna
                </Link>
            </div>

            {loading && (
                <div className="grid cards">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="card shimmer" style={{ height: 140 }} />
                    ))}
                </div>
            )}

            {!loading && err && (
                <div className="card error" style={{ marginTop: 16 }}>
                    {err}
                </div>
            )}

            {!loading && !err && items.length === 0 && (
                <div className="card" style={{ marginTop: 16 }}>
                    Nema događaja sa većim brojem poseta u poslednjih 30 dana.
                </div>
            )}

            {!loading && !err && items.length > 0 && (
                <div className="grid cards" style={{ marginTop: 16 }}>
                    {items.map((ev) => (
                        <article key={ev.id} className="card col" style={{ gap: 8 }}>
                            <Link to={`/events/${ev.id}`} className="title-link">
                                <h3 style={{ margin: 0 }}>{ev.title}</h3>
                            </Link>

                            <div className="muted" style={{ fontSize: 14 }}>
                                {ev.categoryName || "Bez kategorije"}
                                {ev.startsAt ? <> • {fmtDate(ev.startsAt)}</> : null}
                                {ev.location ? <> • {ev.location}</> : null}
                            </div>

                            {ev.description && (
                                <p className="clamp-2" style={{ margin: 0 }}>
                                    {ev.description}
                                </p>
                            )}

                            <div className="row space-between center" style={{ marginTop: "auto" }}>
                                <div className="row wrap gap-s">
                                    {(ev.tags || []).slice(0, 4).map((t, i) => (
                                        <span key={i} className="pill">
                      {t}
                    </span>
                                    ))}
                                </div>
                                <div className="muted" title="Broj pregleda">
                                    👁️ {ev.viewsCount ?? ev.views ?? 0}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* */}
            <div className="card" style={{ marginTop: 20 }}>
                <h3 className="mt-0" style={{ marginBottom: 10 }}>
                    Najviše reakcija
                </h3>

                {trErr && <div className="error" style={{ marginBottom: 10 }}>{trErr}</div>}

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
