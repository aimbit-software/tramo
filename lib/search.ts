/**
 * The key every text search compares on: no accents, no case, single spaces.
 * So "reunion" finds "Reunión" and "INDIGO" finds "Índigo" (as in Fragua).
 */
export function toSearchKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
