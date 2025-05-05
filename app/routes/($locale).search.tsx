// noinspection ES6MissingAwait

import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, Form, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import {getPaginationVariables, Pagination, Analytics, I18nBase} from '@shopify/hydrogen';
import {useInView} from '~/hooks/use-in-view';

import {getImageLoadingPriority, PAGINATION_SIZE} from '~/sanity/constants';
import {seoPayload} from '~/lib/seo.server';
import {Input} from '~/components/ui/input';
import {Button} from '~/components/ui/button';
import {Heading, PageHeader, Section} from '~/components/primatives/text';
// import {type FeaturedData, getFeaturedData} from '~/routes/featured-products';
// import {FeaturedCollections} from '~/components/featured-shopify-content';
import { SEARCH_QUERY } from '~/data/shopify/queries';
import { ProductCard } from '~/components/product/product-card';
import { ProductSwimlane } from '~/components/product-swimlane';

export async function loader({
  request,
  context: {storefront, i18n},
}: LoaderFunctionArgs) {
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get('q')!;
  const variables = getPaginationVariables(request, {pageBy: PAGINATION_SIZE});

  const {products} = await storefront.query(SEARCH_QUERY, {
    variables: {
      searchTerm,
      ...variables,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const shouldGetRecommendations = !searchTerm || products?.nodes?.length === 0;

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'search',
      title: 'Search',
      handle: 'search',
      descriptionHtml: 'Search results',
      description: 'Search results',
      seo: {
        title: 'Search',
        description: `Showing ${products.nodes.length} search results for "${searchTerm}"`,
      },
      metafields: [],
      products,
      updatedAt: new Date().toISOString(),
    },
  });

  return defer({
    seo,
    searchTerm,
    products,
    noResultRecommendations: shouldGetRecommendations
      ? getNoResultRecommendations(storefront, i18n)
      : Promise.resolve(null),
  });
}

export default function Search() {
  const {searchTerm, products, noResultRecommendations} =
    useLoaderData<typeof loader>();
  const [ref, inView] = useInView<HTMLDivElement>();

  const noResults = products?.nodes?.length === 0;

  return (
    <>
      <PageHeader className={'gap-2'}>
        <Heading as="h1" size="copy">
          Search
        </Heading>
        <Form
          method="get"
          className="relative flex w-full text-heading h-[53px]"
        >
          <Input
            defaultValue={searchTerm}
            name="q"
            placeholder="Search…"
            type="search"
            className={'h-full text-heading'}
          />
          <button
            className="inset-y-0 absolute right-0 px-4 outline-offset-0"
            type="submit"
          >
            GO
          </button>
        </Form>
      </PageHeader>
      {!searchTerm || noResults ? (
        <NoResults
          noResults={noResults}
          recommendations={noResultRecommendations}
        />
      ) : (
        <Section>
          <Pagination connection={products}>
            {({nodes, isLoading, NextLink, PreviousLink}) => {
              const itemsMarkup = nodes.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ));

              return (
                <>
                  <div className="flex items-center justify-center mt-6">
                    <PreviousLink className="inline-block rounded font-medium text-center py-3 px-6 border border-foreground/10 bg-background text-foreground w-full">
                      {isLoading ? 'Loading...' : 'Previous'}
                    </PreviousLink>
                  </div>
                  <Section layout={'products'}>{itemsMarkup}</Section>
                  <div className="flex items-center justify-center">
                    <NextLink>
                      <Button variant={'link'}></Button>
                    </NextLink>
                    <div className="mt-6 flex items-center justify-center" ref={ref}>
                      {/* This wrapper is observed for inView to trigger next page load */}
                    </div>
                  </div>
                </>
              );
            }}
          </Pagination>
          <Analytics.SearchView data={{searchTerm, searchResults: products}} />
        </Section>
      )}
    </>
  );
}

function NoResults({
  noResults,
  recommendations,
}: {
  noResults: boolean;
  recommendations: Promise<null | FeaturedData>;
}) {
  return (
    <>
      {noResults && (
        <Section>
          {/* <Text className="opacity-50">
            No results, try a different search.
          </Text> */}
        </Section>
      )}
      {/* <Suspense>
        <Await
          errorElement="There was a problem loading related products"
          resolve={recommendations}
        >
          {(result) => {
            if (!result) return null;
            const {featuredCollections, featuredProducts} = result;
            return (
              <Section>
                <FeaturedCollections
                  title="Trending Collections"
                  collections={featuredCollections}
                />
                <ProductSwimlane
                  title="Trending Products"
                  products={featuredProducts}
                />
              </Section>
            );
          }}
        </Await>
      </Suspense> */}
    </>
  );
}

export function getNoResultRecommendations(
  storefront: LoaderFunctionArgs['context']['storefront'],
  i18n: I18nBase,
) {
  return getFeaturedData(storefront, i18n, {pageBy: PAGINATION_SIZE});
}
