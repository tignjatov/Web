import { createContext, useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import { setToken as setFetchToken, clearToken as clearFetchToken } from "@/utils/apiClient";

const AuthCtx = createContext(null);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    headers: { "Content-Type": "application/json" },
});

let onUnauthorized = null;
api.interceptors.request.use((config) => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) config.headers.Authorization = `Bearer ${jwt}`;
    return config;
});
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        const url = err?.config?.url || "";
        if (
            status === 401 &&
            onUnauthorized &&
            !url.includes("/auth/login") &&
            !url.includes("/auth/me")
        ) {
            onUnauthorized();
        }
        return Promise.reject(err);
    }
);

function setAuthHeader(token) {
    if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    else delete api.defaults.headers.common["Authorization"];
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("jwt") || "");
    const [ready, setReady] = useState(false);

    useEffect(() => {
        onUnauthorized = () => logout();
        return () => { onUnauthorized = null; };
    }, []);

    useEffect(() => {
        setAuthHeader(token);
        if (token) setFetchToken(token);
        else clearFetchToken();
    }, [token]);

    useEffect(() => {
        if (!token) {
            setReady(true);
            return;
        }

        api.get("/auth/me")
            .then((res) => setUser(res.data))
            .catch(() => logout())
            .finally(() => setReady(true));
    }, []);

    const me = async () => {
        try {
            const res = await api.get("/auth/me");
            setUser(res.data);
            return res.data;
        } catch {
            return null;
        }
    };

    const login = async (email, password) => {
        try {
            const res = await api.post("/auth/login", { email, password });
            const jwt = res?.data?.token;
            if (!jwt) throw new Error("Token nije dobijen od servera.");

            localStorage.setItem("jwt", jwt);
            setToken(jwt);
            setAuthHeader(jwt);
            setFetchToken(jwt);

            const profile = await api.get("/auth/me");
            setUser(profile.data);
            setReady(true);
            return true;
        } catch (err) {
            logout();
            throw new Error("Autentikacija nije uspela.");
        }
    };

    const logout = () => {
        setUser(null);
        setToken("");
        localStorage.removeItem("jwt");
        setAuthHeader(null);
        clearFetchToken();
    };

    const value = useMemo(() => ({
        user, token, ready, login, logout, me, api
    }), [user, token, ready]);

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
