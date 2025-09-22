import { useEffect, useState, useRef } from "react";
import * as api from "../../utils/apiClient.js";

function toISOFromInput(val) {
    if (val && val.includes("T")) return val.length === 16 ? val + ":00" : val;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? val : d.toISOString().slice(0, 19);
}

function normalizeTags(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw
            .map((x) => (x == null ? "" : String(x)))
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return String(raw)
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function uniqLower(arr) {
    const out = [];
    const seen = new Set();
    for (const s of arr.map((x) => x.toLowerCase())) {
        if (!seen.has(s)) {
            seen.add(s);
            out.push(s);
        }
    }
    return out;
}

function unwrap(res) {
    if (res && typeof res === "object" && "data" in res) return res.data;
    return res;
}

export default function EMS_Events() {
    const blank = {
        title: "",
        description: "",
        startsAt: "",
        location: "",
        categoryId: "",
        tags: "",
        maxCapacity: ""
    };

    const [data, setData] = useState({
        items: [],
        page: 1,
        pages: 1,
        total: 0,
        limit: 10
    });
    const [form, setForm] = useState(blank);
    const [editing, setEditing] = useState(null);
    const [err, setErr] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const formRef = useRef(null);

    const load = async (p = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/events?page=${p}&limit=${data.limit || 10}`);
            const body = unwrap(res);
            const items = (body.items || []).map((it) => ({
                ...it,
                tags: Array.isArray(it.tags)
                    ? uniqLower(it.tags.filter(Boolean).map(String))
                    : []
            }));
            setData({
                items,
                page: body.page || p,
                pages: body.pages || Math.max(1, Math.ceil((body.total || 0) / (body.limit || 10))),
                total: body.total ?? (body.items?.length ?? 0),
                limit: body.limit || 10
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
    }, []);

    const validate = (p, tagsOriginal, tagsCleaned) => {
        if (!p.title) return "Naslov je obavezan";
        if (!p.description) return "Opis je obavezan";
        if (!p.startsAt) return "Datum i vreme su obavezni";
        if (!p.location) return "Lokacija je obavezna";
        if (!p.categoryId) return "Kategorija je obavezna";
        if (p.maxCapacity != null && p.maxCapacity !== "" && Number.isNaN(p.maxCapacity))
            return "Max kapacitet mora biti broj";
        if (tagsOriginal.trim() !== "" && tagsCleaned.length === 0)
            return "Unesi bar jedan ispravan tag (odvoj ih zarezom).";
        return "";
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        const base = {
            title: (form.title || "").trim(),
            description: (form.description || "").trim(),
            startsAt: toISOFromInput(form.startsAt),
            location: (form.location || "").trim(),
            categoryId: form.categoryId ? Number(form.categoryId) : null,
            maxCapacity:
                form.maxCapacity === "" || form.maxCapacity == null ? null : Number(form.maxCapacity)
        };

        const originalTags = (form.tags || "");
        const tagsArr = uniqLower(normalizeTags(originalTags));
        const payload = { ...base };
        if (tagsArr.length > 0) payload.tags = tagsArr;

        const v = validate(payload, originalTags, tagsArr);
        if (v) return setErr(v);

        try {
            setSaving(true);
            if (editing) {
                await api.updateEvent(editing, payload);
            } else {
                await api.createEvent(payload);
            }
            setForm(blank);
            setEditing(null);
            await load(data.page);
        } catch (e2) {
            setErr(e2?.message || "Greška pri čuvanju događaja");
        } finally {
            setSaving(false);
        }
    };

    const onEdit = async (ev) => {
        setErr("");
        setEditing(ev.id);
        try {
            const full = await api.get(`/events/${ev.id}`);
            const iso = full.startsAt || "";
            setForm({
                title: full.title || "",
                description: full.description || "",
                startsAt: iso ? iso.slice(0, 16) : "",
                location: full.location || "",
                categoryId: full.categoryId ?? "",
                tags: Array.isArray(full.tags) ? uniqLower(full.tags).join(", ") : "",
                maxCapacity: full.maxCapacity ?? ""
            });
            requestAnimationFrame(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                formRef.current?.querySelector("input, textarea, select")?.focus();
            });
        } catch (e2) {
            const iso = ev.startsAt || "";
            setForm({
                title: ev.title || "",
                description: ev.description || "",
                startsAt: iso ? iso.slice(0, 16) : "",
                location: ev.location || "",
                categoryId: ev.categoryId ?? "",
                tags: "",
                maxCapacity: ev.maxCapacity ?? ""
            });
            requestAnimationFrame(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                formRef.current?.querySelector("input, textarea, select")?.focus();
            });
        }
    };

    const onDelete = async (id) => {
        setErr("");
        try {
            await api.deleteEvent(id);
            await load(data.page);
        } catch (e2) {
            setErr(e2.message || "Greška pri brisanju");
        }
    };

    const resetForm = () => {
        setForm(blank);
        setEditing(null);
        setErr("");
    };

    return (
        <div className="col gap">
            <h2 className="mt-0">Događaji</h2>

            <form ref={formRef} onSubmit={onSubmit} className="card col w800" style={{scrollMarginTop: 72}}>
                <div className="row gap wrap">
                    <input
                        placeholder="Naslov"
                        value={form.title}
                        onChange={(e) => setForm((f) => ({...f, title: e.target.value}))}
                    />
                    <input
                        placeholder="Lokacija"
                        value={form.location}
                        onChange={(e) => setForm((f) => ({...f, location: e.target.value}))}
                    />
                </div>

                <textarea
                    placeholder="Opis"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({...f, description: e.target.value}))}
                />

                <div className="row gap wrap">
                    <input
                        type="datetime-local"
                        value={form.startsAt}
                        onChange={(e) => setForm((f) => ({...f, startsAt: e.target.value}))}
                    />
                    <input
                        placeholder="Kategorija ID"
                        value={form.categoryId}
                        onChange={(e) => setForm((f) => ({...f, categoryId: e.target.value}))}
                    />
                    <input
                        placeholder="Tagovi (odvojeni zarezom)"
                        value={form.tags}
                        onChange={(e) => setForm((f) => ({...f, tags: e.target.value}))}
                    />
                    <input
                        placeholder="Max kapacitet (opciono)"
                        value={form.maxCapacity}
                        onChange={(e) => setForm((f) => ({...f, maxCapacity: e.target.value}))}
                    />
                </div>

                {err && <div className="error">{err}</div>}

                <div className="row gap">
                    <button className="primary" type="submit" disabled={saving}>
                        {saving ? "Čuvam…" : editing ? "Sačuvaj izmene" : "Dodaj događaj"}
                    </button>
                    {editing && (
                        <button type="button" onClick={resetForm} disabled={saving}>
                            Otkaži
                        </button>
                    )}
                </div>
            </form>

            <div className="row space-between" style={{marginTop: 8}}>
                <div className="muted">
                    Ukupno: {data.total} • Strana {data.page}/{data.pages}
                </div>
                <div className="row gap">
                    <button disabled={data.page <= 1 || loading} onClick={() => load(data.page - 1)}>
                        « Prethodna
                    </button>
                    <button disabled={data.page >= data.pages || loading} onClick={() => load(data.page + 1)}>
                        Sledeća »
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="shimmer" style={{ height: 120, marginTop: 12 }} />
            ) : (
                <ul className="list">
                    {data.items?.length === 0 ? (
                        <li className="muted">Nema događaja za prikaz.</li>
                    ) : (
                        data.items.map((ev) => (
                            <li key={ev.id} className="card row space-between center">
                                <div>
                                    <b className="title-link">{ev.title}</b>
                                    <div className="muted">
                                        {ev.location}
                                        {ev.startsAt && <> • {new Date(ev.startsAt).toLocaleString()}</>}
                                    </div>

                                    {Array.isArray(ev.tags) && ev.tags.length > 0 && (
                                        <div className="tags-row">
                                            {ev.tags.map((t) => (
                                                <span key={t} className="tag-chip">#{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="row gap">
                                    <button onClick={() => onEdit(ev)}>✏️ Izmeni</button>
                                    <button className="danger" onClick={() => onDelete(ev.id)}>
                                        🗑️ Obriši
                                    </button>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
