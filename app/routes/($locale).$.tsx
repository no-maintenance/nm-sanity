import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import type {I18nLocale} from 'types';
import type {PAGE_QUERYResult} from 'types/sanity/sanity.generated';

import {useLoaderData} from '@remix-run/react';
import {DEFAULT_LOCALE} from 'countries';
import {CmsSection} from '~/components/cms-section';
import {SaleHero} from '~/components/sections/sale-hero';
import {PAGE_QUERY} from '~/data/sanity/queries';
import {requireUnprotectedAccess} from '~/lib/guards/site-protection.server';
import {mergeMeta} from '~/lib/meta';
import {resolveShopifyPromises} from '~/lib/resolve-shopify-promises';
import {getSeoMetaFromMatches} from '~/lib/seo';
import {seoPayload} from '~/lib/seo.server';

export const meta: MetaFunction<typeof loader> = mergeMeta(({matches}) =>
  getSeoMetaFromMatches(matches),
);

export async function loader({context, params, request}: LoaderFunctionArgs) {
  // Check if site is protected
  await requireUnprotectedAccess(context, request);

  const {env, locale, sanity, storefront} = context;
  const pathname = new URL(request.url).pathname;
  const handle = getPageHandle({locale, params, pathname});
  const isHome = handle === 'home';
  const language = locale?.language.toLowerCase();

  const queryParams = {
    defaultLanguage: DEFAULT_LOCALE.language.toLowerCase(),
    handle,
    language,
  };

  const page = await sanity.loadQuery<PAGE_QUERYResult>(
    PAGE_QUERY,
    queryParams,
  );

  const {
    collectionListPromise,
    featuredCollectionPromise,
    featuredProductPromise,
  } = resolveShopifyPromises({
    document: page,
    request,
    storefront,
  });

  if (!page.data) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    });
  }

  const seo = seoPayload.home({
    page: page.data,
    sanity: {
      dataset: env.PUBLIC_SANITY_STUDIO_DATASET,
      projectId: env.PUBLIC_SANITY_STUDIO_PROJECT_ID,
    },
  });

  return {
    collectionListPromise,
    featuredCollectionPromise,
    featuredProductPromise,
    isHome,
    page,
    seo,
  };
}

export default function PageRoute() {
  const {
    isHome,
    page: {data},
  } = useLoaderData<typeof loader>();

  return (
    <>
      {/* SS26 sale hero renders on every locale's homepage (/, /fr, /ja, …). */}
      {isHome ? <SaleHero /> : null}
      {data?.sections && data.sections.length > 0
        ? data.sections.map((section, index) => (
            <CmsSection data={section} index={index} key={section._key} />
          ))
        : null}
    </>
  );
}


function getPageHandle(args: {
  locale: I18nLocale;
  params: LoaderFunctionArgs['params'];
  pathname: string;
}) {
  const {locale, params, pathname} = args;
  const pathWithoutLocale = pathname.replace(`${locale?.pathPrefix}`, '');
  const pathWithoutSlash = pathWithoutLocale.replace(/^\/+/g, '');
  const isTranslatedHomePage =
    params.locale && locale.pathPrefix && !params['*'];
  
  // Return home as handle for a translated homepage ex: /fr/
  if (isTranslatedHomePage) return 'home';

  const handle =
    locale?.pathPrefix && params['*']
      ? params['*'] // Handle for a page with locale having pathPrefix ex: /fr/about-us/
      : params.locale && params['*']
        ? `${params.locale}/${params['*']}` // Handle for default locale page with multiple slugs ex: /about-us/another-slug
        : params.locale || pathWithoutSlash; // Handle for default locale page  ex: /about-us/

  return handle;
}
