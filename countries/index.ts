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
