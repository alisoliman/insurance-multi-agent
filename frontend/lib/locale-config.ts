/**
 * Locale configuration for AI-powered demo scenario generation.
 * 
 * Based on data-model.md from specs/004-ai-demo-examples/
 */

export type Locale = "US" | "UK" | "DE" | "NL" | "FR" | "ES" | "JP" | "AU";
export type ClaimType = "auto" | "home" | "health" | "life" | "commercial";
export type Complexity = "simple" | "moderate" | "complex";

export interface LocaleConfig {
  code: Locale;
  name: string;
  language: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  exampleCities: string[];
}

export const LOCALES: Record<Locale, LocaleConfig> = {
  US: {
    code: "US",
    name: "United States",
    language: "English",
    currency: "USD",
    currencySymbol: "$",
    flag: "🇺🇸",
    exampleCities: ["New York", "Los Angeles", "Chicago"],
  },
  UK: {
    code: "UK",
    name: "United Kingdom",
    language: "English",
    currency: "GBP",
    currencySymbol: "£",
    flag: "🇬🇧",
    exampleCities: ["London", "Manchester", "Birmingham"],
  },
  DE: {
    code: "DE",
    name: "Germany",
    language: "German",
    currency: "EUR",
    currencySymbol: "€",
    flag: "🇩🇪",
    exampleCities: ["Berlin", "Munich", "Frankfurt"],
  },
  NL: {
    code: "NL",
    name: "Netherlands",
    language: "Dutch",
    currency: "EUR",
    currencySymbol: "€",
    flag: "🇳🇱",
    exampleCities: ["Amsterdam", "Rotterdam", "The Hague"],
  },
  FR: {
    code: "FR",
    name: "France",
    language: "French",
    currency: "EUR",
    currencySymbol: "€",
    flag: "🇫🇷",
    exampleCities: ["Paris", "Lyon", "Marseille"],
  },
  ES: {
    code: "ES",
    name: "Spain",
    language: "Spanish",
    currency: "EUR",
    currencySymbol: "€",
    flag: "🇪🇸",
    exampleCities: ["Madrid", "Barcelona", "Valencia"],
  },
  JP: {
    code: "JP",
    name: "Japan",
    language: "Japanese",
    currency: "JPY",
    currencySymbol: "¥",
    flag: "🇯🇵",
    exampleCities: ["Tokyo", "Osaka", "Kyoto"],
  },
  AU: {
    code: "AU",
    name: "Australia",
    language: "English",
    currency: "AUD",
    currencySymbol: "$",
    flag: "🇦🇺",
    exampleCities: ["Sydney", "Melbourne", "Brisbane"],
  },
};

export const CLAIM_TYPES: { value: ClaimType; label: string; description: string }[] = [
  { value: "auto", label: "Auto", description: "Vehicle-related claims (collision, theft, damage)" },
  { value: "home", label: "Home", description: "Property claims (water damage, fire, theft)" },
  { value: "health", label: "Health", description: "Medical claims (emergency, surgery, outpatient)" },
  { value: "life", label: "Life", description: "Life insurance claims (death benefit, disability)" },
  { value: "commercial", label: "Commercial", description: "Business claims (liability, property, fleet)" },
];

export const COMPLEXITY_LEVELS: { value: Complexity; label: string; description: string }[] = [
  { value: "simple", label: "Simple", description: "Clear-cut claim, single party, low value" },
  { value: "moderate", label: "Moderate", description: "Some investigation needed, moderate value" },
  { value: "complex", label: "Complex", description: "Multiple parties, high value, investigation required" },
];

/**
 * Get locale configuration by code.
 */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return LOCALES[locale];
}

/**
 * Format currency amount for a given locale.
 */
export function formatCurrency(amount: number, locale: Locale): string {
  const config = LOCALES[locale];
  
  // Use Intl.NumberFormat for proper locale-aware formatting
  const formatter = new Intl.NumberFormat(
    locale === "UK" ? "en-GB" : 
    locale === "US" ? "en-US" :
    locale === "DE" ? "de-DE" :
    locale === "NL" ? "nl-NL" :
    locale === "FR" ? "fr-FR" :
    locale === "ES" ? "es-ES" :
    locale === "JP" ? "ja-JP" :
    locale === "AU" ? "en-AU" : "en-US",
    {
      style: "currency",
      currency: config.currency,
    }
  );
  
  return formatter.format(amount);
}

/**
 * Get all locales as an array for dropdowns.
 */
export function getLocaleOptions(): LocaleConfig[] {
  return Object.values(LOCALES);
}
