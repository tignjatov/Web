import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../api";

const fmt = (v) => {
    try {
        const d = new Date(v);
        return isNaN(d) ? v : d.toLocaleString();
    } catch {
        return v ?? "";
    }
};

export default function EventList() {
    const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const limit = 10;

    const normalize = (res, p) => {
        const items = Array.isArray(res) ? res : (res?.items ?? []);
        const page = res?.page ?? p ?? 1;
        const pages =
            res?.pages ??
            (res?.total && res?.limit
                ? Math.max(1, Math.ceil(res.total / res.limit))
                : 1);
        const total = res?.total ?? items.length;
        return { items, page, pages, total };
    };

    const load = async (p = 1) => {
        setLoading(true);
        setErr("");
        try {
            const res = await getEvents(p, limit);
            setData(normalize(res, p));
        } catch (e) {
            setErr(e?.message || "Greška pri učitavanju događaja");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load(1);
    }, []);

    const prev = () => data.page > 1 && load(data.page - 1);
    const next = () => data.page < data.pages && load(data.page + 1);

    return (
        <div className="page">
            <h2 className="mt-0">Događaji</h2>

            <div className="row space-between">
                <div className="muted">Ukupno: {data.total}</div>
                <button onClick={() => void load(data.page)} disabled={loading}>
                    ↻ Osveži
                </button>
            </div>

            {err && <div className="error mt-8">{err}</div>}

            {loading ? (
                <div className="grid cards mt-16">
                    <div className="shimmer" style={{ height: 140 }} />
                    <div className="shimmer" style={{ height: 140 }} />
                    <div className="shimmer" style={{ height: 140 }} />
                </div>
            ) : (
                <>
                    <div className="grid cards mt-16">
                        {data.items.length === 0 ? (
                            <div className="card muted">Nema događaja za prikaz.</div>
                        ) : (
                            data.items.map((ev) => (
                                <article key={ev.id} className="card">
                                    <Link className="title-link" to={`/events/${ev.id}`}>
                                        <h3 className="mt-0 mb-0">{ev.title}</h3>
                                    </Link>
                                    <div className="muted mt-8">
                                        {ev.categoryName ?? ev.category?.name ?? "Bez kategorije"} •{" "}
                                        {fmt(ev.startsAt ?? ev.scheduledAt)}
                                    </div>
                                    <p className="clamp-2 mt-8">
                                        {(ev.description || "").trim()}
                                    </p>
                                    <div className="row gap mt-8">
                                        {!!ev.viewsCount && (
                                            <span className="pill">👁 {ev.viewsCount}</span>
                                        )}
                                        {!!ev.likesCount && (
                                            <span className="pill">👍 {ev.likesCount}</span>
                                        )}
                                        {!!ev.dislikesCount && (
                                            <span className="pill">👎 {ev.dislikesCount}</span>
                                        )}
                                    </div>
                                </article>
                            ))
                        )}
                    </div>

                    {/* */}
                    {data.pages > 1 && (
                        <div className="pagination">
                            <button onClick={prev} disabled={data.page <= 1 || loading}>
                                « Prethodna
                            </button>
                            <span className="muted">
                Strana {data.page} / {data.pages}
              </span>
                            <button onClick={next} disabled={data.page >= data.pages || loading}>
                                Sledeća »
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
