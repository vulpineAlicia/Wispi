export type SectionId = "top" | "features" | "contacts";
export type RoutePath = "/" | "/map" | "/archive" | "/info";

export type NavItem =
  | { kind: "section"; label: string; id: SectionId }
  | { kind: "route"; label: string; to: RoutePath };

export const HEADER_LINKS: NavItem[] = [
  { kind: "section", label: "Look up your city", id: "top" },
  { kind: "section", label: "Features", id: "features" },
  { kind: "route", label: "Map", to: "/map" },
  { kind: "route", label: "Archive", to: "/archive" },
  { kind: "route", label: "Useful info", to: "/info" },
  { kind: "section", label: "Contacts", id: "contacts" },
];

export const FOOTER_LINKS: Array<{ label: string; to: RoutePath }> = [
  { label: "Home", to: "/" },
  { label: "Map", to: "/map" },
  { label: "Archive", to: "/archive" },
  { label: "Useful info", to: "/info" },
];

export function scrollTopSmooth() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}