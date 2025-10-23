import { ShopifyProvider } from '@shopify/hydrogen-react';
import { Suspense } from 'react';

import { useRootLoaderData } from '~/root';

import { ClientOnly } from '../client-only';
import { TogglePreviewMode } from '../sanity/toggle-preview-mode';
import { VisualEditing } from '../sanity/visual-editing.client';
import { TailwindIndicator } from '../tailwind-indicator';
import { Motion } from './motion';
import { Aside } from '~/components/aside';

export type MinimalLayoutProps = {
  children?: React.ReactNode;
};

/**
 * Minimal layout without header and footer
 * Used for special pages like site-protected that need a clean, focused interface
 */
export function MinimalLayout({ children = null }: MinimalLayoutProps) {
  const { env, locale, sanityPreviewMode } = useRootLoaderData();

  return (
    <ShopifyProvider
      countryIsoCode={locale.country || 'US'}
      languageIsoCode={locale.language || 'EN'}
      storeDomain={env.PUBLIC_STORE_DOMAIN}
      storefrontApiVersion={env.PUBLIC_STOREFRONT_API_VERSION}
      storefrontToken={env.PUBLIC_STOREFRONT_API_TOKEN}
    >
      <Aside.Provider>
        <Motion>
          {/* Main content without header/footer */}
          <main className="min-h-screen">
            {children}
          </main>

          <TailwindIndicator />

          {/* Keep preview mode tools for CMS editing */}
          {sanityPreviewMode ? (
            <ClientOnly fallback={null}>
              {() => (
                <Suspense>
                  <VisualEditing />
                </Suspense>
              )}
            </ClientOnly>
          ) : (
            <TogglePreviewMode />
          )}
        </Motion>
      </Aside.Provider>
    </ShopifyProvider>
  );
}