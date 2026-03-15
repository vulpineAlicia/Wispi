import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Footer from "./components/Footer";
import Header from "./components/Header";
import NavBar from "./components/NavBar";

import { useScrollToHash } from "./hooks/useScrollToHash";

const Home = lazy(() => import("./pages/Home"));
const Map = lazy(() => import("./pages/Map"));
const UsefulInfo = lazy(() => import("./pages/UsefulInfo"));
const Archive = lazy(() => import("./pages/Archive"));

function Background() {
  return (
    <>
      <div className="fixed inset-0 z-[-10] bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200" />
      <div className="fixed -top-24 -right-24 z-[-10] h-72 w-72 rounded-full bg-brand-300/40 blur-3xl" />
      <div className="fixed -bottom-28 -left-20 z-[-10] h-80 w-80 rounded-full bg-brand-400/25 blur-3xl" />
    </>
  );
}

function AppShell() {
  useScrollToHash();

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
                Loading...
              </main>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<Map />} />
              <Route path="/info" element={<UsefulInfo />} />
              <Route path="/archive" element={<Archive />} />
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
      <AppShell />
    </BrowserRouter>
  );
}