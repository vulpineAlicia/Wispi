import { BrowserRouter, Route, Routes } from "react-router-dom";

import Header from "./components/Header";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Map from "./pages/Map";
import UsefulInfo from "./pages/UsefulInfo";
import Archive from "./pages/Archive";

import { useScrollToHash } from "./hooks/useScrollToHash";

function Background() {
  return (
    <>
      {/* Global background */}
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
        {/* Sticky top area */}
        <div className="sticky top-0 z-50">
          <Header />
          <NavBar />
        </div>

        <div className="relative flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/info" element={<UsefulInfo />} />
            <Route path="/archive" element={<Archive />} />
          </Routes>
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