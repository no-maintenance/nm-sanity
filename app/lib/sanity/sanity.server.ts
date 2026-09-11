import type {
  ClientConfig,
  QueryParams,
  QueryWithoutParams,
  ResponseQueryOptions,
  SanityClient,
} from '@sanity/client';

import {
  loadQuery,
  type QueryResponseInitial,
  setServerClient,
} from '@sanity/react-loader';
import {
  CacheLong,
  CacheNone,
  type CachingStrategy,
  type WithCache,
} from '@shopify/hydrogen';

import {getSanityClient} from './sanity-client.server';
import {hashQuery} from './utils';

// Edge-cache strategy for Sanity (CMS) query results.
//
// `max-age=60` keeps the CMS publish-to-live delay short (~60s), so editorial
// changes — banners, drops, timed launches — still go live within about a
// minute, preserving the fast-publish workflow.
//
// `stale-while-revalidate` is intentionally long (24h): once the 60s freshness
// window passes, visitors are still served the last cached copy *instantly*
// while the data refreshes in the background. This is what prevents the
// cold-start blank wait — after a quiet traffic period the cache used to fully
// expire (the old value was only 60s here), forcing the next visitor to block
// on 2-3 uncached CMS round-trips (~2s+ TTFB). With a long SWR the page is
// always served from cache and refreshed invisibly.
const DEFAULT_CACHE_STRATEGY = {
  mode: 'public, max-age=60, stale-while-revalidate=86400',
} as CachingStrategy;

export type CreateSanityLoaderOptions = {
  /**
   * Sanity client or configuration to use.
   */
  clientConfig: ClientConfig & {
    useStega: string | undefined;
  };
  /**
   * Configuration for enabling preview mode.
   */
  preview?: {enabled: boolean; studioUrl: string; token: string};
  /**
   * The default caching strategy to use for `loadQuery` subrequests.
   * @see https://shopify.dev/docs/custom-storefronts/hydrogen/caching#caching-strategies
   *
   * Defaults to `CacheLong`
   */
  strategy?: CachingStrategy | null;
  /**
   * Cache control utility from `@shopify/hydrogen`.
   * @see https://shopify.dev/docs/custom-storefronts/hydrogen/caching/third-party
   */
  withCache: WithCache;
};

interface RequestInit {
  hydrogen?: {
    /**
     * The caching strategy to use for the subrequest.
     * @see https://shopify.dev/docs/custom-storefronts/hydrogen/caching#caching-strategies
     */
    cache?: CachingStrategy;
    /**
     * Optional debugging information to be displayed in the subrequest profiler.
     * @see https://shopify.dev/docs/custom-storefronts/hydrogen/debugging/subrequest-profiler#how-to-provide-more-debug-information-for-a-request
     */
    debug?: {
      displayName: string;
    };
  };
}

type HydrogenResponseQueryOptions = Omit<
  ResponseQueryOptions,
  'cache' | 'next'
> & {
  hydrogen?: 'hydrogen' extends keyof RequestInit
    ? RequestInit['hydrogen']
    : never;
};

type LoadQueryOptions = Pick<
  HydrogenResponseQueryOptions,
  'headers' | 'hydrogen' | 'perspective' | 'stega' | 'tag' | 'useCdn'
>;

export type SanityLoader = {
  client: SanityClient;
  /**
   * Query Sanity using the loader.
   * @see https://www.sanity.io/docs/loaders
   */
  loadQuery<T = any>(
    query: string,
    params?: QueryParams,
    options?: LoadQueryOptions,
  ): Promise<QueryResponseInitial<T>>;
  preview?: CreateSanityLoaderOptions['preview'];
};

export function createSanityContext(
  options: CreateSanityLoaderOptions,
): SanityLoader {
  const {withCache, preview, strategy, clientConfig} = options;
  const {client} = getSanityClient({config: clientConfig, preview});

  setServerClient(client);

  const sanity = {
    async loadQuery<T>(
      query: string,
      params: QueryParams | QueryWithoutParams,
      loaderOptions?: LoadQueryOptions,
    ): Promise<QueryResponseInitial<T>> {
      // Don't store response if preview is enabled
      const cacheStrategy =
        preview && preview.enabled
          ? CacheNone()
          : loaderOptions?.hydrogen?.cache ||
            strategy ||
            DEFAULT_CACHE_STRATEGY;

      const queryHash = await hashQuery(query, params);

      return await withCache.run(
        {
          cacheKey: queryHash,
          cacheStrategy,
          // Cache if there are no data errors or a specific data that make this result not suited for caching
          shouldCacheResult: (result) => result.data !== null,
        },
        async ({addDebugData}) => {
          if (process.env.NODE_ENV === 'development') {
            // Name displayed in the subrequest profiler
            const displayName =
              loaderOptions?.hydrogen?.debug?.displayName || 'query Sanity';

            addDebugData({
              displayName,
            });
          }

          return await loadQuery<T>(query, params, loaderOptions);
        },
      );
    },
    client,
    preview,
  };

  return sanity;
}
