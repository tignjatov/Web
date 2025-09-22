function resolveApiBase() {
    if (typeof window !== "undefined" && window.__API_BASE__) {
        return String(window.__API_BASE__).replace(/\/+$/, "");
    }
    const fromLS = (typeof window !== "undefined" && localStorage.getItem("API_BASE")) || "";
    if (fromLS) return String(fromLS).replace(/\/+$/, "");
    if (typeof window !== "undefined") {
        const { hostname, port } = window.location;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") return "/api";
        if (port === "8080") return "/api";
    }
    return "http://localhost:8080/api";
}
const BASE = resolveApiBase();

const VISITOR_KEY = "visitor_id";
function getOrMakeVisitorId() {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
        id = `g:${(Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 16)}`;
        localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
}

function getVisitorId() {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
        try {
            const payload = JSON.parse(atob(jwt.split('.')[1]));
            const userId = payload.sub;
            if (userId) return `u:${userId}`;
        } catch { /* */ }
    }
    return getOrMakeVisitorId();
}

let TOKEN = localStorage.getItem("jwt") || "";
export const setToken = (t) => {
    TOKEN = t || "";
    t ? localStorage.setItem("jwt", t) : localStorage.removeItem("jwt");
};
export const clearToken = () => setToken("");

async function req(path, { method = "GET", body, headers, withAuth = true } = {}) {
    const jwt = withAuth ? (localStorage.getItem("jwt") || "") : "";
    const h = {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(withAuth && jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        ...headers,
    };

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: h,
        body: body != null ? JSON.stringify(body) : undefined,
        credentials: withAuth ? "include" : "omit",
    });

    let data = null;
    let raw = "";
    try {
        raw = await res.text();
        if (raw) {
            try { data = JSON.parse(raw); } catch { data = raw; }
        }
    } catch (e) {
        console.warn("Failed to parse response:", e);
    }


    if (!res.ok) {
        const msg =
            (data && (data.message || data.error)) ||
            (typeof data === "string" && data) ||
            `${res.status} ${res.statusText}` ||
            "Request failed";
        throw new Error(msg);
    }

    if (res.status === 204 || raw === "") return null;
    return typeof data === "string" ? { text: data } : (data ?? {});
}

export const get  = (p, h)    => req(p, { headers: h });
export const post = (p, b, h) => req(p, { method: "POST", body: b, headers: h });
export const put  = (p, b, h) => req(p, { method: "PUT",  body: b, headers: h });
export const del  = (p, h)    => req(p, { method: "DELETE", headers: h });

export const getPublic  = (p, h)    => req(p, { withAuth: false, headers: h });
export const postPublic = (p, b, h) => req(p, { method: "POST", body: b, withAuth: false, headers: h });
export const delPublic  = (p, h)    => req(p, { method: "DELETE", withAuth: false, headers: h });

export const login  = async (email, password) => {
    const res = await req("/auth/login", {
        method: "POST",
        body: { email, password },
        withAuth: false,
    });
    if (res?.token) setToken(res.token);
    return res;
};
export const me     = () => get("/auth/me");
export const logout = () => clearToken();

export const fetchHome         = (page = 1, limit = 10) => getPublic(`/events?page=${page}&limit=${limit}`);
export const fetchEvent        = (id) => getPublic(`/events/${id}`);
export const searchEvents      = (q, page = 1, limit = 10) => getPublic(`/events/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`);
export const fetchByCategory   = (id, page = 1, limit = 10) => getPublic(`/events/category/${id}?page=${page}&limit=${limit}`);
export const fetchByTag        = (tag, page = 1, limit = 10) => getPublic(`/events/tag/${encodeURIComponent(tag)}?page=${page}&limit=${limit}`);
export const fetchTopViewed    = () => getPublic("/views/top");
export const fetchTopByReactions = (limit = 3) => getPublic(`/events/top-reactions?limit=${limit}`);

export const likeEvent    = (id) => postPublic(`/events/${id}/like`, null, { "X-Visitor": getVisitorId() });
export const dislikeEvent = (id) => postPublic(`/events/${id}/dislike`, null, { "X-Visitor": getVisitorId() });
export const removeEventReaction = (id) => delPublic(`/events/${id}/reaction`, { "X-Visitor": getVisitorId() });
export const eventTotals  = (id) => getPublic(`/events/${id}/reactions`);

export const listComments = (eventId, page = 1, limit = 10) => getPublic(`/events/${eventId}/comments?page=${page}&limit=${limit}`);
export const addComment   = (eventId, body) => postPublic(`/events/${eventId}/comments`, body);
export const likeComment  = (eventId, commentId) => postPublic(`/events/${eventId}/comments/${commentId}/like`, null, { "X-Visitor": getVisitorId() });
export const dislikeComment = (eventId, commentId) => postPublic(`/events/${eventId}/comments/${commentId}/dislike`, null, { "X-Visitor": getVisitorId() });
export const removeCommentReaction = (eventId, commentId) => delPublic(`/events/${eventId}/comments/${commentId}/reaction`, { "X-Visitor": getVisitorId() });
export const commentTotals = (eventId, commentId) => getPublic(`/events/${eventId}/comments/${commentId}/reactions`);

export const rsvp       = (eventId) => post(`/events/${eventId}/rsvps`, {});
export const cancelRsvp = (eventId) => del(`/events/${eventId}/rsvps`);
export const rsvpCount  = (eventId) => get(`/events/${eventId}/rsvps/count`);
export const rsvpMe     = (eventId) => get(`/events/${eventId}/rsvps/me`);

export const createEvent = (payload) => post("/events", payload);
export const updateEvent = (id, payload) => put(`/events/${id}`, payload);
export const deleteEvent = (id) => del(`/events/${id}`);
export const listCategories = (page = 1, limit = 10) => get(`/categories?page=${page}&limit=${limit}`);
export const createCategory = (payload) => post("/categories", payload);
export const listUsers      = (page = 1, limit = 10) => get(`/users?page=${page}&limit=${limit}`);
export const createUser     = (payload) => post("/users", payload);
export const activateUser   = (id) => post(`/users/${id}/activate`);
export const deactivateUser = (id) => post(`/users/${id}/deactivate`);

const VIEW_KEY = (id) => `viewed:event:${id}:${getVisitorId()}`;
export async function registerView(eventId) {
    const sid = getVisitorId();
    const res = await fetch(`${BASE}/views/${eventId}/register?sid=${encodeURIComponent(sid)}`, {
        method: "POST"
    });
    if (!res.ok) console.warn("registerView failed", res.status);
}

const RXN_KEY = (type, id) => `rxn:${type}:${id}:${getVisitorId()}`;
export const getMyReaction   = (type, id) => Number(localStorage.getItem(RXN_KEY(type, id)) || 0);
export const setMyReaction   = (type, id, val) => localStorage.setItem(RXN_KEY(type, id), String(val || 0));
export const clearMyReaction = (type, id) => localStorage.removeItem(RXN_KEY(type, id));

export function fetchSimilarByTags(eventId, limit = 3) {
    return get(`/events/${eventId}/similar?limit=${limit}`);
}
