import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';
import type {PAGE_QUERYResult} from 'types/sanity/sanity.generated';

import {DEFAULT_LOCALE} from 'countries';

import {PAGE_QUERY} from '~/data/sanity/queries';
import {requireUnprotectedAccess} from '~/lib/guards/site-protection.server';
import {mergeMeta} from '~/lib/meta';
import {resolveShopifyPromises} from '~/lib/resolve-shopify-promises';
import {getSeoMetaFromMatches} from '~/lib/seo';
import {seoPayload} from '~/lib/seo.server';

import PageRoute from './($locale).$';

export const meta: MetaFunction<typeof loader> = mergeMeta(({matches}) =>
  getSeoMetaFromMatches(matches),
);

export async function loader({context, request}: LoaderFunctionArgs) {
  // Check if site is protected
  await requireUnprotectedAccess(context, request);

  const {env, locale, sanity, storefront} = context;
  const language = locale?.language.toLowerCase();
  const queryParams = {
    defaultLanguage: DEFAULT_LOCALE.language.toLowerCase(),
    handle: 'home',
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
    isHome: true,
    page,
    seo,
  };
}

/*
 * Homepage: delegates to the shared PageRoute renderer, which puts the SS26
 * sale hero at the very top (gated on `isHome`) followed by the CMS-managed
 * sections — identical to every localized homepage (/fr, /ja, …). Remove the
 * old two-image hero section in Sanity Studio so it doesn't render twice.
 */
export default function Homepage() {
  return <PageRoute />;
}
