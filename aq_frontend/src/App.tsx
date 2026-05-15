import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Footer from "./components/shared/Footer";
import Header from "./components/shared/Header";
import NavBar from "./components/shared/NavBar";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { useNavScroll } from "./lib/siteNav";

const Home = lazy(() => import("./pages/Home"));
const Map = lazy(() => import("./pages/Map"));
const UsefulInfo = lazy(() => import("./pages/UsefulInfo"));
const Archive = lazy(() => import("./pages/Archive"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Terms = lazy(() => import("./pages/Terms"));

function Background() {
  return (
    <>
      <div className="fixed inset-0 -z-10 bg-linear-to-br from-brand-50 via-brand-100 to-brand-200" />
      <div className="fixed -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
      <div className="fixed -bottom-28 -left-20 -z-10 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl" />
    </>
  );
}

function AppShell() {
  const { t } = useTranslation();
  useNavScroll();

  return (
    <>
      <Background />

      <div className="relative flex min-h-screen flex-col text-brand-900">
        <div className="sticky top-0 z-50">
          <Header />
          <NavBar />
        </div>

        <div className="relative flex-1">
          <Suspense
            fallback={
              <main className="mx-auto max-w-6xl px-4 py-10 text-brand-700">
                {t('app.loading')}
              </main>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<Map />} />
              <Route path="/info" element={<UsefulInfo />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/terms" element={<Terms />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
              </Route>
            </Routes>
          </Suspense>
        </div>

        <Footer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
          <AppShell />
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}