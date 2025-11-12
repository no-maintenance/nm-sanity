import type {LoaderFunctionArgs, MetaFunction} from '@shopify/remix-oxygen';

import {useLoaderData} from '@remix-run/react';
import {getPaginationVariables} from '@shopify/hydrogen';

import {CollectionListGrid} from '~/components/collection-list-grid';
import {COLLECTIONS_QUERY} from '~/data/shopify/queries';
import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';
import {mergeMeta} from '~/lib/meta';
import {getSeoMetaFromMatches} from '~/lib/seo';
import {seoPayload} from '~/lib/seo.server';

const PAGINATION_SIZE = 4;

export const meta: MetaFunction<typeof loader> = mergeMeta(({matches}) =>
  getSeoMetaFromMatches(matches),
);

export const loader = async ({
  context: {storefront, sanity, passwordSession},
  request,
}: LoaderFunctionArgs) => {
  const variables = getPaginationVariables(request, {
    pageBy: PAGINATION_SIZE,
  });
  const {collections} = await storefront.query(COLLECTIONS_QUERY, {
    variables: {
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  // Filter out protected collections that user doesn't have access to
  if (collections?.nodes?.length) {
    // Query all collection protection configs
    const protectionQuery = `*[_type == "collection" && defined(protectionConfig)]{
      "handle": store.slug.current,
      protectionConfig->{
        _id,
        enabled,
        accessMode,
        countdown
      }
    }`;

    const {data: protectedCollections} = await sanity.loadQuery(protectionQuery, {});

    // Create a map of protected collections
    const protectionMap = new Map();
    protectedCollections?.forEach((collection: any) => {
      if (collection.protectionConfig?.enabled) {
        protectionMap.set(collection.handle, collection.protectionConfig);
      }
    });

    // Filter collections based on protection status
    const filteredNodes = collections.nodes.filter((collection: any) => {
      const protectionConfig = protectionMap.get(collection.handle);

      if (!protectionConfig) {
        // No protection, allow access
        return true;
      }

      // Check if user has access to this protected collection
      let hasAccess = false;
      const hasPasswordAuth = passwordSession.isAuthenticatedFor(protectionConfig._id);
      const countdownExpired = protectionConfig.countdown
        ? new Date(protectionConfig.countdown) <= new Date()
        : false;

      switch (protectionConfig.accessMode) {
        case 'password':
          hasAccess = hasPasswordAuth;
          break;
        case 'countdown':
          hasAccess = countdownExpired;
          break;
        case 'both':
          hasAccess = hasPasswordAuth && countdownExpired;
          break;
        case 'either':
          hasAccess = hasPasswordAuth || countdownExpired;
          break;
      }

      return hasAccess;
    });

    // Update collections with filtered nodes
    collections.nodes = filteredNodes;
  }

  const seo = seoPayload.listCollections({
    collections,
    url: request.url,
  });

  return {collections, seo};
};

export default function Collections() {
  const data = useLoaderData<typeof loader>();
  const {themeContent} = useSanityThemeContent();

  return (
    <div className="container py-20">
      {data.collections?.nodes.length > 0 ? (
        <CollectionListGrid collections={data.collections} />
      ) : (
        <p>{themeContent?.collection?.noCollectionFound}</p>
      )}
    </div>
  );
}
