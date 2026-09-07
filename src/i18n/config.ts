export const locales = ["ar", "fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";

export function isValidLocale(l: string): l is Locale {
  return (locales as readonly string[]).includes(l);
}