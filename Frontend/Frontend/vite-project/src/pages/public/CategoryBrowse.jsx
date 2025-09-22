import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../../utils/apiClient.js";
import Pagination from "../../components/Pagination.jsx";

function snippet(txt = "", n = 160) {
    const s = String(txt || "");
    return s.length > n ? s.slice(0, n) + "…" : s;
}

function fmt(dt) {
    try {
        const d = new Date(dt);
        return isNaN(d) ? "" : d.toLocaleString();
    } catch { return ""; }
}

export default function CategoryBrowse() {
    const { categoryId } = useParams();

    const [data, setData] = useState({ items: [], page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const fetchPage = async (p = 1) => {
        setLoading(true);
        setErr("");
        try {
            const res = await api.get(`/events/category/${categoryId}?page=${p}&limit=10`);
            setData(res);
        } catch (e) {
            setErr(e?.message || "Greška pri učitavanju događaja iz kategorije");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPage(1); /* */ }, [categoryId]);

    const categoryName = useMemo(() => {
        const first = data.items?.[0];
        return first?.categoryName || first?.category?.name || null;
    }, [data.items]);

    return (
        <div className="page">
            <h1 className="mt-0" style={{marginBottom: 12}}>
                {categoryName ? categoryName : `Kategorija #${categoryId}`}
            </h1>

            {err && <div className="error" style={{marginBottom: 12}}>{err}</div>}

            {/* */}
            {loading ? (
                <div className="grid cards">
                    {Array.from({length: 6}).map((_, i) => (
                        <div key={i} className="card shimmer" style={{height: 140}}/>
                    ))}
                </div>
            ) : (
                <>
                    {(!data.items || data.items.length === 0) ? (
                        <div className="card">Nema događaja u ovoj kategoriji.</div>
                    ) : (
                        <div className="grid cards">
                            {data.items.map(ev => (
                                <article key={ev.id} className="card">
                                    <Link className="title-link" to={`/events/${ev.id}`}>
                                        <h3 className="mt-0" style={{marginBottom: 6}}>{ev.title}</h3>
                                    </Link>
                                    <div className="muted" style={{marginBottom: 8}}>
                                        {(ev.categoryName || categoryName || "Kategorija")} • {fmt(ev.createdAt)}
                                    </div>
                                    <p className="clamp-2" style={{marginTop: 0}}>{snippet(ev.description)}</p>
                                    <div className="row wrap gap" style={{marginTop: 10}}>
                                        {ev.location && <span className="pill">{ev.location}</span>}
                                        {(ev.tags || []).slice(0, 3).map((t, idx) => (
                                            <span className="pill" key={idx}>#{t}</span>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="pagination">
                        <Pagination page={data.page} pages={data.pages} onPage={fetchPage}/>
                    </div>
                </>
            )}
        </div>
    );
}
