const cache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(lang: string): Intl.DisplayNames {
  let dn = cache.get(lang);
  if (!dn) {
    dn = new Intl.DisplayNames([lang], { type: "region" });
    cache.set(lang, dn);
  }
  return dn;
}

export function countryName(code: string, lang: string): string {
  try {
    return getDisplayNames(lang).of(code) ?? code;
  } catch {
    return code;
  }
}
