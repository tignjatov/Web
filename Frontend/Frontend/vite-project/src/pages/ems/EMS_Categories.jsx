import { useEffect, useState } from "react";
import * as api from "../../utils/apiClient.js";

export default function EMS_Categories() {
    const [items, setItems] = useState([]);
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get("/categories");
            setItems(res);
        } catch (err) {
            console.error("Greška pri učitavanju kategorija", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const add = async (e) => {
        e.preventDefault();
        setError("");

        if (!name.trim() || !desc.trim()) {
            setError("Naziv i opis su obavezni.");
            return;
        }

        try {
            await api.post("/categories", {
                name: name.trim(),
                description: desc.trim(),
            });
            setName("");
            setDesc("");
            load();
        } catch (err) {
            setError(err.message || "Greška pri dodavanju kategorije.");
        }
    };

    const remove = async (id) => {
        setError("");
        try {
            await api.del(`/categories/${id}`);
            setItems((prev) => prev.filter((c) => c.id !== id));
            if (editId === id) {
                setEditId(null);
                setEditName("");
                setEditDesc("");
            }
        } catch (err) {
            setError(err.message || "Greška pri brisanju kategorije.");
        }
    };

    const startEdit = (c) => {
        setError("");
        setEditId(c.id);
        setEditName(c.name);
        setEditDesc(c.description);
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditName("");
        setEditDesc("");
    };

    const saveEdit = async () => {
        if (!editName.trim() || !editDesc.trim()) {
            setError("Naziv i opis su obavezni.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await api.put(`/categories/${editId}`, {
                name: editName.trim(),
                description: editDesc.trim(),
            });

            setItems((prev) =>
                prev.map((c) =>
                    c.id === editId ? { ...c, name: editName.trim(), description: editDesc.trim() } : c
                )
            );

            cancelEdit();
        } catch (err) {
            setError(err.message || "Greška pri izmeni kategorije.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="col gap">
            <h2 className="mt-0">Kategorije</h2>

            <form onSubmit={add} className="row gap" style={{ alignItems: "flex-start" }}>
                <input
                    placeholder="Naziv"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    placeholder="Opis"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                />
                <button className="primary" style={{ whiteSpace: "nowrap" }}>
                    ➕ Dodaj
                </button>
            </form>

            {error && <div className="error">{error}</div>}

            {loading ? (
                <div className="shimmer" style={{ height: 100, marginTop: 16 }} />
            ) : (
                <ul className="list">
                    {items.length === 0 ? (
                        <li className="muted">Nema kategorija za prikaz.</li>
                    ) : (
                        items.map((c) => (
                            <li key={c.id} className="card row space-between center">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {editId === c.id ? (
                                        <>
                                            <input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                placeholder="Naziv"
                                                style={{ marginBottom: 6 }}
                                            />
                                            <input
                                                value={editDesc}
                                                onChange={(e) => setEditDesc(e.target.value)}
                                                placeholder="Opis"
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <b>{c.name}</b>
                                            <div className="muted">{c.description}</div>
                                        </>
                                    )}
                                </div>

                                {editId === c.id ? (
                                    <div className="row gap">
                                        <button className="primary" onClick={saveEdit} disabled={saving}>
                                            💾 Sačuvaj
                                        </button>
                                        <button onClick={cancelEdit} disabled={saving}>
                                            ✖ Otkaži
                                        </button>
                                    </div>
                                ) : (
                                    <div className="row gap">
                                        <button onClick={() => startEdit(c)}>✏️ Izmeni</button>
                                        <button className="danger" onClick={() => remove(c.id)}>
                                            🗑️ Obriši
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
