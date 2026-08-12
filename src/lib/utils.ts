import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalise une date (ISO complet, Date, "yyyy-MM-dd") vers le format attendu
 * par `<input type="date">`. Sans cela, une valeur ISO datetime complète
 * ("...T00:00:00Z") venant de la base est rejetée par le navigateur et le
 * champ apparaît vide en mode édition (round-trip UI -> DB -> UI cassé).
 */
export function toDateInput(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}
