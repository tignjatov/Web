import { useEffect, useMemo, useState } from "react";
import * as api from "../../utils/apiClient.js";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../components/Pagination.jsx";
import { useAuth } from "@/state/AuthProvider";

function highlight(text, q) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match  = text.slice(idx, idx + q.length);
    const after  = text.slice(idx + q.length);
    return (
        <>
            {before}
            <mark style={{ background: "rgba(11,107,203,.15)", padding: "0 2px", borderRadius: 4 }}>{match}</mark>
            {after}
        </>
    );
}

export default function Search() {
    const {ready} = useAuth();
    const [sp, setSp] = useSearchParams();
    const q = sp.get("q") || "";

    const [data, setData] = useState({items: [], page: 1, pages: 1, total: 0, limit: 10});
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [topReact, setTopReact] = useState([]);

    const fetchPage = async (p = 1) => {
        if (!q) return;
        setLoading(true);
        setErr("");
        try {
            const res = await api.searchEvents(q, p, 10);
            setData({
                items: res.items || [],
                page: res.page || p,
                pages: res.pages || Math.max(1, Math.ceil((res.total || 0) / (res.limit || 10))),
                total: res.total || (res.items?.length ?? 0),
                limit: res.limit || 10
            });
        } catch (e) {
            setErr(e.message || "Greška pri pretrazi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!ready) return;
        if (q) fetchPage(1);
    }, [q, ready]);

    useEffect(() => {
        api.get("/events/top-reactions?limit=3")
            .then(res => setTopReact(res.items ?? res ?? []))
            .catch(() => setTopReact([]));
    }, []);

    const onSubmit = (e) => {
        e.preventDefault();
        const nv = e.target.q.value.trim();
        setSp(nv ? {q: nv} : {});
    };

    const showEmpty = useMemo(
        () => ready && !loading && !err && q && data.items.length === 0,
        [ready, loading, err, q, data.items]
    );

    if (!ready) {
        return (
            <div className="page" style={{paddingTop: 72}}>
                <div className="card shimmer" style={{height: 110}}/>
            </div>
        );
    }

    return (
        <div className="home-grid page">
            {/* */}
            <div>
                <h1 className="mt-0">Pretraga događaja</h1>

                <form onSubmit={onSubmit} className="row gap card w800" style={{margin: "16px 0"}}>
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Naslov ili opis…"
                        aria-label="Tekst pretrage"
                    />
                    <button className="primary" type="submit">Traži</button>
                </form>

                {err && <div className="error w800" style={{margin: "12px 0"}}>{err}</div>}

                {!q && !loading && (
                    <div className="muted">Unesi pojam u polje iznad i pokreni pretragu.</div>
                )}

                {loading && (
                    <div className="grid cards">
                        {Array.from({length: 6}).map((_, i) => (
                            <div key={i} className="card shimmer" style={{height: 110}}/>
                        ))}
                    </div>
                )}

                {showEmpty && (
                    <div className="card w800">
                        <div className="row gap center">
                            <div className="pill">0 rezultata</div>
                            <div className="muted">Nije pronađen nijedan događaj za „{q}“.</div>
                        </div>
                    </div>
                )}

                {!loading && !err && data.items.length > 0 && (
                    <>
                        <div className="muted" style={{marginBottom: 8}}>
                            Pronađeno: <b>{data.total}</b> rezultat(a) za „{q}“
                        </div>

                        <div className="grid cards">
                            {data.items.map((e) => (
                                <article key={e.id} className="card">
                                    <Link to={`/events/${e.id}`} className="title-link">
                                        <h3 className="mt-0 mb-0">{highlight(e.title || "", q)}</h3>
                                    </Link>
                                    <div className="muted" style={{marginTop: 6}}>
                                        {(e.categoryName || e.category?.name) && (
                                            <span className="pill">{e.categoryName || e.category?.name}</span>
                                        )}{" "}
                                        {e.startsAt && <span>{new Date(e.startsAt).toLocaleString()}</span>}
                                        {e.location && <span> • {e.location}</span>}
                                    </div>
                                    {e.description && (
                                        <p className="clamp-2" style={{marginTop: 10}}>
                                            {highlight(e.description, q)}
                                        </p>
                                    )}
                                </article>
                            ))}
                        </div>

                        <div className="pagination">
                            <Pagination page={data.page} pages={data.pages} onPage={fetchPage}/>
                        </div>
                    </>
                )}
            </div>

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
                                                    <span className="pill">{e.categoryName || e.category?.name}</span>
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
    )
}
