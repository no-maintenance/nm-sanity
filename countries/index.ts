import type {I18nLocale, Localizations, Locale as I18nBaseLocale} from 'types';

export const countries: Localizations = {
  default: {
    country: 'US',
    currency: 'USD',
    isoCode: 'en-us',
    label: 'United States (USD $)',
    language: 'EN',
    languageLabel: 'English',
    salesChannel: 'hydrogen',
  },
  '/ca': {
    country: 'CA',
    currency: 'CAD', 
    isoCode: 'en-ca',
    label: 'Canada (CAD $)',
    language: 'EN',
    languageLabel: 'English',
    salesChannel: 'hydrogen',
  },
  '/ca-fr': {
    country: 'CA',
    currency: 'CAD',
    isoCode: 'fr-ca',
    label: 'Canada - French (CAD $)',
    language: 'FR',
    languageLabel: 'French',
    salesChannel: 'hydrogen',
  },
  '/fr': {
    country: 'FR',
    currency: 'EUR',
    isoCode: 'fr-fr',
    label: 'France (EUR €)',
    language: 'FR',
    languageLabel: 'French',
    salesChannel: 'hydrogen',
  },
  '/de': {
    country: 'DE',
    currency: 'EUR',
    isoCode: 'de-de',
    label: 'Germany (EUR €)',
    language: 'DE',
    languageLabel: 'German',
    salesChannel: 'hydrogen',
  },
  '/ko': {
    country: 'KR',
    currency: 'KRW',
    isoCode: 'ko-kr', 
    label: 'Korea (KRW ₩)',
    language: 'KO',
    languageLabel: 'Korean',
    salesChannel: 'hydrogen',
  },
  '/ja': {
    country: 'JP',
    currency: 'JPY',
    isoCode: 'ja-jp',
    label: 'Japan (JPY ¥)',
    language: 'JA', 
    languageLabel: 'Japanese',
    salesChannel: 'hydrogen',
  },
  '/it': {
    country: 'IT',
    currency: 'EUR',
    isoCode: 'it-it',
    label: 'Italy (EUR €)',
    language: 'IT',
    languageLabel: 'Italian',
    salesChannel: 'hydrogen',
  },
};

export const DEFAULT_LOCALE: I18nLocale = Object.freeze({
  ...countries.default,
  pathPrefix: '',
  default: true,
});

export function getAllLanguages() {
  const uniqueLanguages = [];
  const seenLanguages = new Set<string>();

  for (const key in countries) {
    const language = countries[key].language;
    // Remove duplicates to avoid having same language multiple times
    if (!seenLanguages.has(language)) {
      uniqueLanguages.push({
        id: language.toLocaleLowerCase(),
        title: countries[key].languageLabel,
      });
      seenLanguages.add(language);
    }
  }

  return uniqueLanguages;
}

type RouteParams = {locale?: string} | undefined;

/**
 * Detect the visitor's locale.
 *
 * 1. If Remix has already parsed route params, prefer `params.locale`.
 * 2. Otherwise, read the first URL segment (stripping “.data” in data requests).
 */
export function getLocaleFromRequest(
  request: Request,
  params?: RouteParams,
): I18nLocale {
  /* ---------- 1. via route params ------------------------------------------------ */
  if (params?.locale) {
    const key = `/${params.locale.toLowerCase()}`;
    const config = countries[key] ?? countries.default;
    return buildLocale(config, key);
  }

  /* ---------- 2. via raw URL (e.g. during createAppLoadContext) ------------------ */
  const url = new URL(request.url);
  const firstSegment = url.pathname.substring(1).split('/')[0].toLowerCase();
  const key = '/' + firstSegment.split('.')[0]; // “/ja.data” → “/ja”
  const config = countries[key] ?? countries.default;

  return buildLocale(config, key);
}

/* ------------------------------------------------------------------------------ */
function buildLocale(config: I18nBaseLocale, key: string): I18nLocale {
  const isDefault = config === countries.default;
  return {
    ...config,
    pathPrefix: isDefault ? '' : key,
    default: isDefault,
  };
}

export function getAllLocales() {
  return Object.keys(countries).map((key) => {
    if (key === 'default') {
      return {
        ...countries[key],
        pathPrefix: '',
        default: true,
      };
    }

    return {
      ...countries[key],
      pathPrefix: key,
      default: false,
    };
  });
}

export function getAllCountries() {
  return Object.keys(countries).map((key) => {
    return countries[key].country;
  });
}

/**
 * Shopify Oxygen environment helper to read buyer geo headers.
 */
type OxygenEnv = {
  buyer: {
    readonly ip: string | undefined;
    readonly country: string | undefined;
    readonly continent: string | undefined;
    readonly city: string | undefined;
    readonly isEuCountry: boolean;
    readonly latitude: string | undefined;
    readonly longitude: string | undefined;
    readonly region: string | undefined;
    readonly regionCode: string | undefined;
    readonly timezone: string | undefined;
  };
  readonly shopId: string | undefined;
  readonly storefrontId: string | undefined;
  readonly deploymentId: string | undefined;
};

export function getOxygenEnv(request: Request): OxygenEnv {
  return Object.freeze({
    buyer: {
      ip: request.headers.get('oxygen-buyer-ip') ?? undefined,
      country: request.headers.get('oxygen-buyer-country') ?? undefined,
      continent: request.headers.get('oxygen-buyer-continent') ?? undefined,
      city: request.headers.get('oxygen-buyer-city') ?? undefined,
      isEuCountry: Boolean(request.headers.get('oxygen-buyer-is-eu-country')),
      latitude: request.headers.get('oxygen-buyer-latitude') ?? undefined,
      longitude: request.headers.get('oxygen-buyer-longitude') ?? undefined,
      region: request.headers.get('oxygen-buyer-region') ?? undefined,
      regionCode: request.headers.get('oxygen-buyer-region-code') ?? undefined,
      timezone: request.headers.get('oxygen-buyer-timezone') ?? undefined,
    },
    shopId: request.headers.get('oxygen-buyer-shop-id') ?? undefined,
    storefrontId:
      request.headers.get('oxygen-buyer-storefront-id') ?? undefined,
    deploymentId:
      request.headers.get('oxygen-buyer-deployment-id') ?? undefined,
  });
}

/**
 * Get visitor's country code from request headers.
 * This function checks various geolocation headers provided by different platforms.
 */
export function getCountryFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const headers = request.headers;
  
  // 1) Prefer Shopify Oxygen buyer headers when available
  const oxygen = getOxygenEnv(request);
  
  if (oxygen.buyer.country) {
    return oxygen.buyer.country.toUpperCase();
  }
  
  // For development/testing: allow overriding via query parameter
  const testCountry = url.searchParams.get('test-country');
  if (testCountry) {
    return testCountry.toUpperCase();
  }
  
  // 2) Other platforms: Cloudflare / Vercel / generic proxy headers
  const cfIpCountry = headers.get('cf-ipcountry'); // Cloudflare
  
  // Check Vercel geolocation headers (if deployed on Vercel)
  const vercelCountry = headers.get('x-vercel-ip-country');
  
  // Check other common geolocation headers
  const countryHeader = headers.get('x-country-code') || 
                       headers.get('x-country') || 
                       headers.get('country-code') ||
                       headers.get('x-forwarded-country');
  
  // Return the first available country code
  return cfIpCountry || vercelCountry || countryHeader || null;
}

/**
 * Map visitor's country to the appropriate locale path.
 * Returns null if the country is not supported or should use default locale.
 */
export function getLocalePathForCountry(countryCode: string): string | null {
  if (!countryCode) return null;
  
  const upperCountry = countryCode.toUpperCase();
  
  // Create reverse mapping from country codes to locale paths
  for (const [path, locale] of Object.entries(countries)) {
    if (path === 'default') continue;
    if (locale.country === upperCountry) {
      return path;
    }
  }
  
  return null;
}

/**
 * Reverse lookup from a Shopify "language-country" locale code
 * (e.g. "ja-jp", "de-de") to the storefront's supported locale path prefix
 * (e.g. "/ja", "/de"). The default locale ("en-us") maps to "" (no prefix).
 */
const ISO_CODE_TO_PATH_PREFIX: Record<string, string> = Object.entries(
  countries,
).reduce<Record<string, string>>((map, [key, locale]) => {
  map[locale.isoCode.toLowerCase()] = key === 'default' ? '' : key;
  return map;
}, {});

/** Matches a `language-country` path segment, e.g. "ja-jp", "en-jp", "de-de". */
const LANG_COUNTRY_SEGMENT = /^[a-z]{2}-[a-z]{2}$/;

/**
 * Shopify Markets hands out `language-country` subfolder URLs (e.g. `/ja-jp`,
 * `/en-jp`, `/de-de`). This storefront's locale map is keyed by short prefixes
 * (`/ja`, `/de`, …), so those paths are otherwise treated as an unknown page
 * handle and 404. Normalize them to the supported locale prefix.
 *
 * Resolution order:
 *   1. Exact isoCode match → its canonical prefix (e.g. `ja-jp` → `/ja`).
 *   2. Otherwise map by country code (e.g. `en-jp` → JP → `/ja`).
 *   3. Otherwise fall back to the default storefront (`""`).
 *
 * Returns the redirect path (with the rest of the URL preserved), or null when
 * the first segment isn't a `language-country` code that needs rewriting.
 */
export function getLocaleNormalizationRedirect(
  request: Request,
): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split('/'); // ["", "ja-jp", "products", ...]
  const first = (segments[1] || '').toLowerCase();

  if (!LANG_COUNTRY_SEGMENT.test(first)) return null;

  // Already a supported locale key (e.g. "/ca-fr") — leave it untouched.
  if (countries[`/${first}`]) return null;

  let targetPrefix = ISO_CODE_TO_PATH_PREFIX[first];

  if (targetPrefix === undefined) {
    const country = first.split('-')[1]?.toUpperCase();
    targetPrefix = (country && getLocalePathForCountry(country)) || '';
  }

  const rest = segments.slice(2).join('/');
  const newPath = `${targetPrefix}${rest ? `/${rest}` : ''}` || '/';

  if (newPath === url.pathname) return null;

  return `${newPath}${url.search}`;
}

/**
 * Check if a request should be redirected based on geolocation.
 * Returns the redirect path if a redirect is needed, null otherwise.
 */
export function getGeoRedirectPath(request: Request): string | null {
  const url = new URL(request.url);
  const currentPath = url.pathname;
  
  // Don't redirect if already on a localized path
  if (currentPath !== '/' && Object.keys(countries).some(path => 
    path !== 'default' && currentPath.startsWith(path)
  )) {
    return null;
  }
  
  // Don't redirect API routes, assets, or special paths
  if (currentPath.startsWith('/api') || 
      currentPath.startsWith('/_') || 
      currentPath.startsWith('/cms') ||
      currentPath.includes('.')) {
    return null;
  }
  
  // Check if user has a locale preference cookie (to prevent overriding user choice)
  const cookies = request.headers.get('cookie') || '';
  if (cookies.includes('locale-override=true')) {
    return null;
  }
  
  // Don't redirect if there's a referrer from the same domain (internal navigation)
  const referrer = request.headers.get('referer');
  if (referrer && referrer.includes(url.host)) {
    return null;
  }
  
  const visitorCountry = getCountryFromRequest(request);
  if (!visitorCountry) return null;
  
  const localePath = getLocalePathForCountry(visitorCountry);
  if (!localePath) return null;
  
  // Return the full redirect path
  return `${localePath}${currentPath === '/' ? '' : currentPath}${url.search}`;
}
