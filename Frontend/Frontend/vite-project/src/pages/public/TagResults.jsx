import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Pagination from "../../components/Pagination.jsx";
import * as api from "../../utils/apiClient.js";

export default function TagResults() {
    const { tag } = useParams();
    const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0, limit: 10 });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const fetchPage = async (p = 1) => {
        setLoading(true);
        setErr("");
        try {
            const res = await api.getPublic(`/events/tag/${encodeURIComponent(tag)}?page=${p}&limit=10`);
            setData({
                items: res.items || [],
                page: res.page || p,
                pages: res.pages || Math.max(1, Math.ceil((res.total || 0) / (res.limit || 10))),
                total: res.total || (res.items?.length ?? 0),
                limit: res.limit || 10
            });
        } catch (e) {
            setErr(e.message || "Greška pri učitavanju po tagu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPage(1); }, [tag]);

    return (
        <div className="page">
            <h1 className="mt-0"># {tag}</h1>

            {err && <div className="error">{err}</div>}

            {loading && (
                <div className="grid cards">
                    {Array.from({length: 6}).map((_, i) => (
                        <div key={i} className="card shimmer" style={{height: 110}}/>
                    ))}
                </div>
            )}

            {!loading && data.items.length === 0 && (
                <div className="card">Nema događaja sa ovim tagom.</div>
            )}

            {!loading && data.items.length > 0 && (
                <>
                    <div className="grid cards">
                        {data.items.map((e) => (
                            <article key={e.id} className="card">
                                <Link to={`/events/${e.id}`} className="title-link">
                                    <h3 className="mt-0 mb-0">{e.title}</h3>
                                </Link>
                                <div className="muted" style={{marginTop: 6}}>
                                    {(e.categoryName || e.category?.name) && (
                                        <span className="pill">{e.categoryName || e.category?.name}</span>
                                    )}{" "}
                                    {e.startsAt && <span>{new Date(e.startsAt).toLocaleString()}</span>}{" "}
                                    {e.location && <span>• {e.location}</span>}
                                </div>
                                {e.description && <p className="clamp-2" style={{marginTop: 10}}>{e.description}</p>}
                            </article>
                        ))}
                    </div>

                    <div className="pagination">
                        <Pagination page={data.page} pages={data.pages} onPage={fetchPage}/>
                    </div>
                </>
            )}
        </div>
    );
}
