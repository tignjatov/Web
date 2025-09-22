import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/state/AuthProvider";
import NavBar from "./components/NavBar.jsx";
import Login from "./pages/Login.jsx";

import Home from "./pages/public/Home.jsx";
import TopViewed from "./pages/public/TopViewed.jsx";
import CategoriesList from "./pages/public/CategoriesList.jsx";
import CategoryBrowse from "./pages/public/CategoryBrowse.jsx";
import Search from "./pages/public/Search.jsx";
import EventDetail from "./pages/public/EventDetail.jsx";

import Dashboard from "./pages/ems/Dashboard.jsx";
import EMS_Events from "./pages/ems/EMS_Events.jsx";
import EMS_Categories from "./pages/ems/EMS_Categories.jsx";
import EMS_Users from "./pages/ems/EMS_Users.jsx";
import Protected from "./components/Protected.jsx";
import TagResults from "@/pages/public/TagResults.jsx";
import { GuestOnly, RequireAuth } from "./components/RouteGuards";

export default function App() {
    const { ready } = useAuth();
    if (!ready) {
        return <div style={{height: 56}} />;
    }
    return (
        <>
            <NavBar />
            <Routes>
                {}
                <Route path="/" element={<Home />} />
                <Route path="/top" element={<TopViewed />} />
                <Route path="/categories" element={<CategoriesList />} />
                <Route path="/events/category/:categoryId" element={<CategoryBrowse />} />
                <Route path="/search" element={<Search />} />
                <Route path="/events/:id" element={<EventDetail />} />

                {}
                <Route path="/login" element={<GuestOnly>
                    <Login />
                </GuestOnly>
                } />

                <Route path="/tags/:tag" element={<TagResults />} />

                {}
                <Route
                    path="/ems"
                    element={
                        <Protected roles={["ADMIN", "EVENT_CREATOR"]}>
                            <Dashboard />
                        </Protected>
                    }
                >
                    <Route index element={<Navigate to="events" replace />} />
                    <Route path="events" element={<EMS_Events />} />
                    <Route path="categories" element={<EMS_Categories />} />
                    <Route
                        path="users"
                        element={
                            <Protected roles={["ADMIN"]}>
                                <EMS_Users />
                            </Protected>
                        }
                    />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
