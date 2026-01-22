import { useEffect, useState } from "react";
import MapView from "./MapView";

type GeoResult = {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
};

type AirData = {
  aqi_ow_1_5: number;
  pollutants: Record<string, number>;
};

function aqiMeta(aqi: number) {
  switch (aqi) {
    case 1:
      return { label: "Good", color: "text-green-600" };
    case 2:
      return { label: "Fair", color: "text-yellow-600" };
    case 3:
      return { label: "Moderate", color: "text-orange-600" };
    case 4:
      return { label: "Poor", color: "text-red-600" };
    case 5:
      return { label: "Very Poor", color: "text-purple-700" };
    default:
      return { label: "Unknown", color: "text-gray-500" };
  }
}

export default function App() {
  const [status, setStatus] = useState("checking...");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [selected, setSelected] = useState<GeoResult | null>(null);
  const [air, setAir] = useState<AirData | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => setStatus("error"));
  }, []);

  const searchCity = async () => {
    if (!query.trim()) return;

    const res = await fetch(
      `http://127.0.0.1:8000/api/geocode?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    setResults(data.results);
    setSelected(null);
    setAir(null);
  };

  const selectCity = async (city: GeoResult) => {
    setSelected(city);

    const res = await fetch(
      `http://127.0.0.1:8000/api/air/current?lat=${city.lat}&lon=${city.lon}`
    );
    const data = await res.json();

    setAir(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-xl bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Air Quality Dashboard
        </h1>

        <p className="text-sm mb-4">
          Backend status: <b>{status}</b>
        </p>

        <div className="flex gap-2 mb-4">
          <input
            className="flex-1 border rounded px-3 py-2"
            placeholder="Enter city name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={searchCity}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Search
          </button>
        </div>

        <ul className="space-y-2 mb-4">
          {results.map((r) => (
            <li
              key={`${r.lat},${r.lon},${r.name}`}
              onClick={() => selectCity(r)}
              className="border rounded p-2 text-sm cursor-pointer hover:bg-gray-100"
            >
              {r.name}
              {r.state ? `, ${r.state}` : ""} — {r.country}
              <br />
              <span className="text-gray-500">
                lat {r.lat}, lon {r.lon}
              </span>
            </li>
          ))}
        </ul>

        {selected && air && (
          <div className="border-t pt-4">
            <h2 className="font-semibold mb-2">
              Air quality in {selected.name}
            </h2>

            {(() => {
              const meta = aqiMeta(air.aqi_ow_1_5);
              return (
                <p className="text-lg">
                  AQI:{" "}
                  <span className={`font-bold ${meta.color}`}>
                    {air.aqi_ow_1_5} — {meta.label}
                  </span>
                </p>
              );
            })()}

            <div className="mt-4">
              <MapView lat={selected.lat} lon={selected.lon} label={selected.name} />
            </div>

            <ul className="text-sm mt-2">
              {Object.entries(air.pollutants).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
