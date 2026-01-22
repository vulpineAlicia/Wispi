import Map, { Marker } from "react-map-gl/maplibre";

type Props = {
  lat: number;
  lon: number;
  label?: string;
};

export default function MapView({ lat, lon, label }: Props) {
  const key = import.meta.env.VITE_MAPTILER_KEY as string;
  const styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${key}`;

  return (
    <div className="h-64 w-full overflow-hidden rounded border">
      <Map
        initialViewState={{ latitude: lat, longitude: lon, zoom: 11 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={styleUrl}
      >
        <Marker latitude={lat} longitude={lon} anchor="bottom" />
        {label ? (
          <div className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-sm shadow">
            {label}
          </div>
        ) : null}
      </Map>
    </div>
  );
}
