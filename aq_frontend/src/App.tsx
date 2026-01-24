import Header from "./components/Header.tsx";
import NavBar from "./components/NavBar.tsx";
import CityLookup from "./components/CityLookup.tsx";
import Features from "./components/Features.tsx";
import Footer from "./components/Footer.tsx";

export default function App() {
  return (
    <div className="min-h-dvh text-brand-900 relative">
      {/* Page background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200" />
      <div className="fixed -top-24 -right-24 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl -z-10" />
      <div className="fixed -bottom-28 -left-20 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl -z-10" />

      {/* Top anchor */}
      <div id="top" />

      {/* Sticky top */}
      <div className="sticky top-0 z-50">
        <Header />
        <NavBar />
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16">
        <CityLookup />
        <Features />
      </main>

      <Footer />
    </div>
  );
}

