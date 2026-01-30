import CityLookup from "../components/CityLookup";
import Features from "../components/Features";

export default function Home() {
  return (
    <>
      <div id="top" />
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-16">
          <CityLookup />
          <Features />
        </main>
    </>
  );
}