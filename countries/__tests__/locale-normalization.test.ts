import {describe, it, expect} from 'vitest';
import {getLocaleNormalizationRedirect} from '../index';

function req(path: string): Request {
  return new Request(`https://nomaintenance.us${path}`);
}

describe('getLocaleNormalizationRedirect', () => {
  it('maps an exact isoCode to its canonical locale prefix', () => {
    expect(getLocaleNormalizationRedirect(req('/ja-jp'))).toBe('/ja');
    expect(getLocaleNormalizationRedirect(req('/de-de'))).toBe('/de');
    expect(getLocaleNormalizationRedirect(req('/fr-fr'))).toBe('/fr');
    expect(getLocaleNormalizationRedirect(req('/it-it'))).toBe('/it');
    expect(getLocaleNormalizationRedirect(req('/ko-kr'))).toBe('/ko');
  });

  it('maps the default isoCode (en-us) to the root storefront', () => {
    expect(getLocaleNormalizationRedirect(req('/en-us'))).toBe('/');
  });

  it('maps an unknown language but known country by country code', () => {
    // English-in-Japan has no storefront; keep the buyer in the JP market.
    expect(getLocaleNormalizationRedirect(req('/en-jp'))).toBe('/ja');
    expect(getLocaleNormalizationRedirect(req('/en-de'))).toBe('/de');
  });

  it('falls back to the default storefront for unsupported countries', () => {
    expect(getLocaleNormalizationRedirect(req('/es-es'))).toBe('/');
    expect(getLocaleNormalizationRedirect(req('/en-gb'))).toBe('/');
  });

  it('preserves the rest of the path and the query string', () => {
    expect(getLocaleNormalizationRedirect(req('/ja-jp/products/foo'))).toBe(
      '/ja/products/foo',
    );
    expect(getLocaleNormalizationRedirect(req('/de-de/collections/all'))).toBe(
      '/de/collections/all',
    );
    expect(getLocaleNormalizationRedirect(req('/ja-jp?utm=x'))).toBe(
      '/ja?utm=x',
    );
    // Unsupported country with a deep path still keeps the trailing path.
    expect(getLocaleNormalizationRedirect(req('/es-es/products/foo'))).toBe(
      '/products/foo',
    );
  });

  it('leaves already-supported locale keys untouched', () => {
    expect(getLocaleNormalizationRedirect(req('/ca-fr'))).toBeNull();
    expect(getLocaleNormalizationRedirect(req('/ca-fr/cart'))).toBeNull();
  });

  it('ignores paths that are not language-country segments', () => {
    expect(getLocaleNormalizationRedirect(req('/'))).toBeNull();
    expect(getLocaleNormalizationRedirect(req('/ja'))).toBeNull();
    expect(getLocaleNormalizationRedirect(req('/products/foo'))).toBeNull();
    expect(getLocaleNormalizationRedirect(req('/site-protected'))).toBeNull();
    expect(getLocaleNormalizationRedirect(req('/collections/all'))).toBeNull();
  });
});
