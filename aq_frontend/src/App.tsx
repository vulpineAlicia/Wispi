import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import UsefulInfo from "./pages/UsefulInfo";

import ScrollToHash from "./components/ScrollToHash";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      
      {/* Global background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200" />
      <div className="fixed -top-24 -right-24 h-72 w-72 rounded-full bg-brand-300/40 blur-3xl -z-10" />
      <div className="fixed -bottom-28 -left-20 h-80 w-80 rounded-full bg-brand-400/25 blur-3xl -z-10" />

      <div id="top" />
      <div className="min-h-dvh text-brand-900 relative">
        {/* Sticky top area */}
        <div className="sticky top-0 z-50">
          <Header />
          <NavBar />
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/info" element={<UsefulInfo />} />
        </Routes>

        <Footer />
        
      </div>
    </BrowserRouter>
  );
}

