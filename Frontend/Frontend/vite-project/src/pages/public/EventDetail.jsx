import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/state/AuthProvider";
import {
    fetchEvent,
    fetchSimilarByTags,
    listComments,
    addComment,
    likeEvent as apiLikeEvent,
    dislikeEvent as apiDislikeEvent,
    removeEventReaction,
    eventTotals,
    likeComment as apiLikeComment,
    dislikeComment as apiDislikeComment,
    removeCommentReaction,
    commentTotals,
    registerView,
    getMyReaction,
    setMyReaction,
    clearMyReaction,
    rsvpCount,
    rsvpMe,
    rsvp,
    cancelRsvp
} from "@/utils/apiClient";


const GUEST_NAME_KEY = "guest_comment_name";

function fmtDateTime(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleString();
}

const toLowerArray = (arr) =>
    Array.isArray(arr)
        ? arr.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean)
        : [];

function diffCounts(prev, next) {
    if (prev === next) return { like: 0, dislike: 0 };
    if (next === 0) {
        if (prev === 1)  return { like: -1, dislike: 0 };
        if (prev === -1) return { like: 0, dislike: -1 };
        return { like: 0, dislike: 0 };
    }
    if (next === 1) return { like: 1, dislike: prev === -1 ? -1 : 0 };
    return { like: prev === 1 ? -1 : 0, dislike: 1 };
}

export default function EventDetail() {
    const { id } = useParams();
    const eventId = Number(id);

    const { user } = useAuth();

    const [ev, setEv] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadErr, setLoadErr] = useState("");

    const [similar, setSimilar] = useState([]);

    const [comments, setComments] = useState([]);
    const [cLoading, setCLoading] = useState(false);
    const [cErr, setCErr] = useState("");
    const [cPage, setCPage] = useState(1);
    const [cPages, setCPages] = useState(1);

    const [myName, setMyName] = useState("");
    const [myText, setMyText] = useState("");

    const [evLikes, setEvLikes] = useState(0);
    const [evDislikes, setEvDislikes] = useState(0);
    const [myEvRxn, setMyEvRxn] = useState(0);

    const [reactBusy, setReactBusy] = useState(false);
    const [cSubmitting, setCSubmitting] = useState(false);
    const [cBusy, setCBusy] = useState({});

    const [rsvpCnt, setRsvpCnt] = useState(0);
    const [amIn, setAmIn]       = useState(false);
    const [rsvpBusy, setRsvpBusy] = useState(false);



    const loadComments = async (page = 1) => {
        setCLoading(true);
        setCErr("");
        try {
            const res = await listComments(eventId, page, 10);
            const itemsRaw = res?.items ?? res ?? [];
            const items = itemsRaw.map((c) => ({
                ...c,
                likes: c.likesCount ?? c.likes ?? 0,
                dislikes: c.dislikesCount ?? c.dislikes ?? 0,
            }));

            const pageNo  = Number(res?.page ?? page) || 1;
            const perPage = Number(res?.limit ?? 10) || 10;
            const total   = Number(res?.total ?? res?.count ?? items.length) || items.length;
            const pages   = Number(res?.pages ?? Math.max(1, Math.ceil(total / perPage)));

            setComments(items);
            setCPage(pageNo);
            setCPages(pages);
        } catch (err) {
            setCErr(err?.message || "Greška pri učitavanju komentara");
        } finally {
            setCLoading(false);
        }
    };

    const refreshEventTotals = async () => {
        try {
            const t = await eventTotals(eventId);
            setEvLikes(t.likes || 0);
            setEvDislikes(t.dislikes || 0);
        } catch { /* */ }
    };

    const loadAll = async () => {
        setLoading(true);
        setLoadErr("");
        try {
            try { await registerView(eventId); } catch { /*  */ }

            const e = await fetchEvent(eventId);
            e.tags = toLowerArray(e.tags);
            setEv(e);

            setEvLikes(e.likesCount ?? e.likes ?? 0);
            setEvDislikes(e.dislikesCount ?? e.dislikes ?? 0);

            try {
                const s = await fetchSimilarByTags(eventId);
                setSimilar((s?.items ?? s ?? []).slice(0, 3));
            } catch {
                setSimilar([]);
            }

            await loadComments(1);

            setMyEvRxn(getMyReaction("event", eventId));

            try {
                const c = await rsvpCount(eventId);
                setRsvpCnt(Number(c?.count || 0));
            } catch {/* */}

            if (user) {
                try {
                    const mine = await rsvpMe(eventId);
                    setAmIn(!!mine?.registered);
                } catch {/*  */}
            } else {
                setAmIn(false);
            }

        } catch (err) {
            setLoadErr(err?.message || "Greška pri učitavanju događaja");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, [eventId]);


    useEffect(() => {
        if (user) {
            const full =
                [user.firstName ?? user.first_name ?? user.ime,
                    user.lastName  ?? user.last_name  ?? user.prezime]
                    .filter(Boolean)
                    .join(" ")
                    .trim() || user.email || "";
            setMyName(full);
        } else {
            setMyName("");
        }
    }, [user]);


    useEffect(() => {
        if (!user) {
            setAmIn(false);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const me = await rsvpMe(eventId);
                if (!cancelled) setAmIn(!!me?.registered);
            } catch {
                if (!cancelled) setAmIn(false);
            }
        })();
        return () => { cancelled = true; };
    }, [user, eventId]);


    const likeEventUI = async (delta) => {
        if (reactBusy) return;
        setReactBusy(true);
        const target = delta > 0 ? 1 : -1;
        const prev = myEvRxn;
        const next = prev === target ? 0 : target;
        const d = diffCounts(prev, next);

        setEvLikes((v) => Math.max(0, v + d.like));
        setEvDislikes((v) => Math.max(0, v + d.dislike));
        setMyEvRxn(next);

        try {
            if (next === 0) {
                await removeEventReaction(eventId);
                clearMyReaction("event", eventId);
            } else if (next === 1) {
                await apiLikeEvent(eventId);
                setMyReaction("event", eventId, 1);
            } else {
                await apiDislikeEvent(eventId);
                setMyReaction("event", eventId, -1);
            }
        } catch {
            const rb = diffCounts(next, prev);
            setEvLikes((v) => Math.max(0, v + rb.like));
            setEvDislikes((v) => Math.max(0, v + rb.dislike));
            setMyEvRxn(prev);
        } finally {
            await refreshEventTotals();
            setReactBusy(false);
        }
    };

    const reactToCommentUI = async (commentId, delta) => {
        if (cBusy[commentId]) return;
        setCBusy((m) => ({ ...m, [commentId]: true }));

        const prev   = getMyReaction("comment", commentId);
        const target = delta > 0 ? 1 : -1;
        const next   = prev === target ? 0 : target;
        const d      = diffCounts(prev, next);


        setComments((list) =>
            list.map((c) =>
                c.id === commentId
                    ? {
                        ...c,
                        likes: Math.max(0, (c.likes ?? 0) + d.like),
                        dislikes: Math.max(0, (c.dislikes ?? 0) + d.dislike),
                    }
                    : c
            )
        );

        try {
            if (next === 0) {
                await removeCommentReaction(eventId, commentId);
                clearMyReaction("comment", commentId);
            } else if (next === 1) {
                await apiLikeComment(eventId, commentId);
                setMyReaction("comment", commentId, 1);
            } else {
                await apiDislikeComment(eventId, commentId);
                setMyReaction("comment", commentId, -1);
            }

            const t = await commentTotals(eventId, commentId);
            setComments((list) =>
                list.map((c) =>
                    c.id === commentId ? { ...c, likes: t.likes ?? 0, dislikes: t.dislikes ?? 0 } : c
                )
            );
        } catch (e) {
            const rb = diffCounts(next, prev);
            setComments((list) =>
                list.map((c) =>
                    c.id === commentId
                        ? {
                            ...c,
                            likes: Math.max(0, (c.likes ?? 0) + rb.like),
                            dislikes: Math.max(0, (c.dislikes ?? 0) + rb.dislike),
                        }
                        : c
                )
            );
            setCErr(e?.message || "Greška pri reakciji na komentar");
        } finally {
            setCBusy((m) => {
                const { [commentId]: _, ...rest } = m;
                return rest;
            });
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (cSubmitting) return;
        setCErr("");

        const name = myName.trim();
        const text = myText.trim();
        if (!name || !text) {
            setCErr("Ime i tekst su obavezni");
            return;
        }

        setCSubmitting(true);
        try {
            if (cPage === 1) {
                setComments((list) => [
                    {
                        id: `tmp-${Date.now()}`,
                        authorName: name,
                        text,
                        createdAt: new Date().toISOString(),
                        likes: 0,
                        dislikes: 0,
                        _tmp: true,
                    },
                    ...list,
                ]);
            }

            await addComment(eventId, { authorName: name, text });

            setMyText("");
            await loadComments(1);
        } catch (err) {
            setCErr(err?.message || "Greška pri dodavanju komentara");
            setComments((list) => list.filter((c) => !c._tmp));
        } finally {
            setCSubmitting(false);
        }
    };

    if (loading) return <div className="page"><div className="card shimmer" style={{height:140}}/></div>;
    if (loadErr) return <div className="page"><div className="error">{loadErr}</div></div>;
    if (!ev) return <div className="page">Nema podataka o događaju.</div>;

    const when  = ev.startsAt || ev.scheduledAt;
    const views = ev.viewsCount ?? ev.views ?? 0;

    const capacity    = ev.maxCapacity ?? 0;
    const isUnlimited = !capacity || capacity <= 0;
    const isFull      = !isUnlimited && rsvpCnt >= capacity;

    const Stat = ({ icon, label }) => (
        <span className="pill" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true">{icon}</span> {label}
        </span>
    );

    const onRsvp = async () => {
        if (rsvpBusy) return;
        setRsvpBusy(true);
        try {
            await rsvp(eventId);
            setAmIn(true);
            setRsvpCnt((n) => n + 1);
        } catch (e) {
            alert(e?.message || "Neuspešna prijava.");
        } finally {
            setRsvpBusy(false);
        }
    };

    const onCancelRsvp = async () => {
        if (rsvpBusy) return;
        setRsvpBusy(true);
        try {
            await cancelRsvp(eventId);
            setAmIn(false);
            setRsvpCnt((n) => Math.max(0, n - 1));
        } catch (e) {
            alert(e?.message || "Neuspešna odjava.");
        } finally {
            setRsvpBusy(false);
        }
    };

    return (
        <div className="page">
            {}
            <div className="card" style={{marginBottom: 16}}>
                <h1 className="mt-0" style={{marginBottom: 6}}>{ev.title}</h1>

                <div className="muted" style={{marginBottom: 8}}>
                    {ev.categoryName ?? ev.category?.name ?? "Bez kategorije"} • {fmtDateTime(when)} • {ev.location}
                    {ev.authorEmail && <> • Kreirao: {ev.authorEmail}</>}
                </div>

                {Array.isArray(ev.tags) && ev.tags.length > 0 && (
                    <div className="tags-row" style={{marginBottom: 8, display: "flex", gap: 8, flexWrap: "wrap"}}>
                        {ev.tags.map((t) => (
                            <Link
                                key={t}
                                to={`/tags/${encodeURIComponent(t)}`}
                                className="tag-chip"
                                style={{
                                    fontSize: 14,
                                    background: "rgba(30,144,255,.12)",
                                    color: "#0b6bcb",
                                    border: "1px solid rgba(30,144,255,.35)",
                                    borderRadius: 9999,
                                    padding: "4px 10px",
                                    textDecoration: "none",
                                }}
                            >
                                #{t}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="row gap wrap" style={{marginBottom: 12}}>
                    <Stat icon="👁️" label={`${views} ${views === 1 ? "pregled" : "pregleda"}`}/>
                    <Stat icon="👍" label={`${evLikes} like`}/>
                    <Stat icon="👎" label={`${evDislikes} dislike`}/>
                </div>

                <p style={{marginTop: 12}}>{ev.description}</p>

                <div className="row gap" style={{marginTop: 16}}>
                    <button
                        className={`primary ${myEvRxn === 1 ? "active" : ""}`}
                        disabled={reactBusy}
                        onClick={() => likeEventUI(+1)}
                        title={myEvRxn === 1 ? "Poništi like" : "Like"}
                    >
                        👍 {myEvRxn === 1 ? "Liked" : "Like"}
                    </button>
                    <button
                        disabled={reactBusy}
                        onClick={() => likeEventUI(-1)}
                        className={`${myEvRxn === -1 ? "active" : ""}`}
                        title={myEvRxn === -1 ? "Poništi dislike" : "Dislike"}
                    >
                        👎 {myEvRxn === -1 ? "Disliked" : "Dislike"}
                    </button>
                </div>
            </div>

            {}
            <div className="card" style={{marginBottom: 16}}>
                <h3 className="mt-0" style={{ marginBottom: 8 }}>Prijava na događaj</h3>

                <div className="row space-between wrap">
                    <div>
            <span className="pill" style={{ fontSize: 14 }}>
                🙋 {rsvpCnt} {rsvpCnt === 1 ? "prijavljen" : "prijavljenih"}
                {ev.maxCapacity ? ` / ${ev.maxCapacity}` : ""}
            </span>
                    </div>

                    <div>
                        {user ? (
                            amIn ? (
                                <button onClick={onCancelRsvp} disabled={rsvpBusy} title="Otkaži prijavu">
                                    ❌ Otkaži prijavu
                                </button>
                            ) : (
                                <button
                                    onClick={onRsvp}
                                    disabled={rsvpBusy || isFull}
                                    className="primary"
                                    title={isFull ? "Popunjeno" : "Prijavi se"}
                                >
                                    ✅ Prijavi se
                                </button>
                            )
                        ) : (
                            <span className="muted">(Uloguj se da bi se prijavio/la)</span>
                        )}
                    </div>
                </div>
            </div>


            {/* */}
            <div className="card" style={{ marginBottom: 16 }}>
                <h3 className="mt-0">Dodaj komentar</h3>
                <form onSubmit={onSubmit} className="col" style={{ maxWidth: 680 }}>
                    <div className="row gap">
                        <input
                            placeholder="Vaše ime"
                            value={myName}
                            onChange={(e) => setMyName(e.target.value)}
                            disabled={!!user}
                        />
                    </div>
                    <textarea
                        placeholder="Tekst..."
                        value={myText}
                        onChange={(e) => setMyText(e.target.value)}
                    />
                    {cErr && <div className="error">{cErr}</div>}
                    <div className="row gap">
                        <button className="primary" disabled={cLoading || cSubmitting}>
                            {cSubmitting ? "Dodajem..." : "Dodaj"}
                        </button>
                    </div>
                </form>
            </div>

            {/* */}
            <h3 className="mt-0" style={{ marginTop: 24, marginBottom: 12 }}>Komentari</h3>
            {cLoading && <div className="muted" style={{ marginBottom: 12 }}>Učitavam komentare…</div>}

            <ul className="list">
                {!cLoading && comments.length === 0 && <li className="muted">Još uvek nema komentara.</li>}
                {comments.map((c) => (
                    <li key={c.id} className="card">
                        <div className="row space-between">
                            <div>
                                <b>{c.authorName}</b>{" "}
                                <span className="muted">{fmtDateTime(c.createdAt)}</span>
                            </div>
                            <div className="row gap">
                                <span className="pill">👍 {c.likes ?? 0}</span>
                                <span className="pill">👎 {c.dislikes ?? 0}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: 6 }}>{c.text}</div>

                        <div className="row gap" style={{ marginTop: 8 }}>
                            <button
                                onClick={() => reactToCommentUI(c.id, +1)}
                                disabled={!!cBusy[c.id]}
                                aria-label="Like komentar"
                            >
                                👍 Like
                            </button>
                            <button
                                onClick={() => reactToCommentUI(c.id, -1)}
                                disabled={!!cBusy[c.id]}
                                aria-label="Dislike komentar"
                            >
                                👎 Dislike
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {cPages > 1 && (
                <div className="pagination">
                    <button onClick={() => loadComments(Math.max(1, cPage - 1))} disabled={cPage <= 1 || cLoading}>
                        ← Prethodna
                    </button>
                    <span className="muted">Strana {cPage} / {cPages}</span>
                    <button onClick={() => loadComments(Math.min(cPages, cPage + 1))} disabled={cPage >= cPages || cLoading}>
                        Sledeća →
                    </button>
                </div>
            )}

            {similar.length > 0 && (
                <>
                    <h3 className="mt-0" style={{ marginTop: 24, marginBottom: 12 }}>Pročitaj još…</h3>
                    <div className="grid cards">
                        {similar.map((s) => (
                            <article key={s.id} className="card">
                                <Link to={`/events/${s.id}`} className="title-link">
                                    <h4 className="mt-0 mb-0">{s.title}</h4>
                                </Link>
                                <div className="muted" style={{ marginTop: 6 }}>
                                    {(s.categoryName || s.category?.name) && (
                                        <span className="pill">{s.categoryName || s.category?.name}</span>
                                    )}{" "}
                                    {s.startsAt && <span>{new Date(s.startsAt).toLocaleString()}</span>}
                                </div>
                                {Array.isArray(s.tags) && s.tags.length > 0 && (
                                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {s.tags.slice(0, 4).map((t) => (
                                            <span key={t} className="pill">#{t}</span>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
