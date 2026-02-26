export function mapUrl(lat: number, lon: number, name?: string) {
  const qs = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (name) qs.set("name", name);
  return `/map?${qs.toString()}`;
}