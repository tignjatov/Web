import { useEffect, useState } from "react";
import * as api from "../../utils/apiClient.js";
import { Link } from "react-router-dom";
import Pagination from "../../components/Pagination.jsx";
import { useAuth } from "@/state/AuthProvider";

export default function Home() {
    const { ready } = useAuth();
    const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0, limit: 10 });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [topReact, setTopReact] = useState([]);

    const fetchPage = async (page = 1) => {
        setLoading(true);
        setErr("");
        try {
            const res = await api.fetchHome(page, 10);
            const base = {
                items: res.items || [],
                page:  res.page  || page,
                pages: res.pages || Math.max(1, Math.ceil((res.total || 0) / (res.limit || 10))),
                total: res.total || (res.items?.length ?? 0),
                limit: res.limit || 10,
            };

            const needHydrate = (base.items || []).filter(
                (e) => !(e.categoryName || e.category?.name) && e.id
            );
            if (needHydrate.length > 0) {
                const enriched = await Promise.all(
                    needHydrate.map(async (e) => {
                        try {
                            const full = await api.fetchEvent(e.id);
                            return {
                                ...e,
                                categoryName:
                                    full.categoryName ||
                                    full.category?.name ||
                                    e.categoryName ||
                                    e.category?.name ||
                                    null,
                            };
                        } catch {
                            return e;
                        }
                    })
                );
                const byId = new Map(enriched.map((x) => [x.id, x]));
                base.items = base.items.map((x) => byId.get(x.id) || x);
            }

            setData(base);
        } catch (e) {
            setErr(e.message || "Greška pri učitavanju događaja");
        } finally {
            setLoading(false);
        }
    };

    const loadTopReact = async () => {
        try {
            let res;
            if (typeof api.fetchTopByReactions === "function") {
                res = await api.fetchTopByReactions(3);
            } else {
                res = await api.getPublic("/views/most-reacted");
            }
            setTopReact(res?.items ?? res ?? []);
        } catch {
            setTopReact([]);
        }
    };

    useEffect(() => {
        if (!ready) return;
        fetchPage(1);
        loadTopReact();
    }, [ready]);

    if (!ready) {
        return (
            <div className="page">
                <div className="card shimmer" style={{ height: 120 }} />
            </div>
        );
    }

    return (
        <div className="page">
            <h1 className="mt-0" style={{textAlign: "center", marginBottom: 18}}>
                Najnoviji događaji
            </h1>

            {err && <div className="error">{err}</div>}

            <div
                className="home-grid"
                style={{
                    display: "grid",
                    gap: 28,
                    alignItems: "start",
                    gridTemplateColumns: "1fr",
                }}
            >
                <style>{`
          @media (min-width: 1100px){
            .home-grid { grid-template-columns: 2.6fr 1fr; }
            .home-aside > .card { position: sticky; top: 18px; }
          }
        `}</style>

                {/* */}
                <section>
                    {loading && (
                        <div className="grid cards">
                            {Array.from({length: 6}).map((_, i) => (
                                <div key={i} className="card shimmer" style={{height: 120}}/>
                            ))}
                        </div>
                    )}

                    {!loading && data.items.length === 0 && (
                        <div className="card center">Nema nijednog događaja za prikaz.</div>
                    )}

                    {!loading && data.items.length > 0 && (
                        <>
                            <div className="grid cards">
                                {data.items.map((ev) => (
                                    <article key={ev.id} className="card">
                                        <Link to={`/events/${ev.id}`} className="title-link">
                                            <h3 className="mt-0 mb-0">{ev.title}</h3>
                                        </Link>

                                        <div
                                            className="muted"
                                            style={{
                                                marginTop: 6,
                                                display: "flex",
                                                gap: 10,
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {(ev.categoryName || ev.category?.name) && (
                                                <span className="pill">{ev.categoryName || ev.category?.name}</span>
                                            )}
                                            {ev.createdAt && (
                                                <span>{new Date(ev.createdAt).toLocaleString()}</span>
                                            )}
                                            {typeof ev.viewsCount === "number" && (
                                                <span>• 👁 {ev.viewsCount}</span>
                                            )}
                                        </div>

                                        {ev.description && (
                                            <p className="clamp-2" style={{marginTop: 10}}>
                                                {ev.description.slice(0, 160)}...
                                            </p>
                                        )}

                                        <div style={{marginTop: 10}}>
                                            <Link to={`/events/${ev.id}`} className="title-link"
                                                  style={{fontWeight: 600}}>
                                                Pogledaj više →
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            <div className="pagination">
                                <Pagination page={data.page} pages={data.pages} onPage={fetchPage}/>
                            </div>
                        </>
                    )}
                </section>

                {/* */}
                <aside className="home-aside">
                    <div className="card">
                        <h3 className="mt-0" style={{marginBottom: 10}}>Najviše reakcija</h3>
                        {topReact.length === 0 && <div className="muted">Nema podataka.</div>}
                        {topReact.length > 0 && (
                            <ul className="list" style={{marginTop: 8}}>
                                {topReact.map((e) => {
                                    const total = (e.likesCount ?? 0) + (e.dislikesCount ?? 0);
                                    return (
                                        <li key={e.id} className="row space-between" style={{alignItems: "baseline"}}>
                                            <div style={{minWidth: 0}}>
                                                <Link to={`/events/${e.id}`} className="title-link">
                                                    <b>{e.title}</b>
                                                </Link>
                                                {(e.categoryName || e.category?.name) && (
                                                    <div className="muted" style={{marginTop: 4}}>
                                                        <span
                                                            className="pill">{e.categoryName || e.category?.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="muted" title="Ukupno reakcija">⚡ {total}</div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
