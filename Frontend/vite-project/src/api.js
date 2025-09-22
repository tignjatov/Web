const API_BASE = "http://localhost:8080/VebDomaci6/api";

export async function login(email, password) {
    const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
        throw new Error("Login failed");
    }
    return await res.json();
}

export async function getEvents(page = 1, limit = 10) {
    const res = await fetch(`${API_BASE}/events?page=${page}&limit=${limit}`);
    if (!res.ok) {
        throw new Error("Could not fetch events");
    }
    return await res.json();
}
