import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Form, useLoaderData} from '@remix-run/react';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';

import {PAGINATION_SIZE} from '~/sanity/constants';
import {seoPayload} from '~/lib/seo.server';
import {Input} from '~/components/ui/input';
import {Heading, PageHeader} from '~/components/primatives/text';
import {SEARCH_QUERY} from '~/data/shopify/queries';
import {SearchResults} from '~/components/search-results';

export async function loader({
  request,
  context: {storefront},
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
  });
}

export default function Search() {
  const {searchTerm, products} = useLoaderData<typeof loader>();

  return (
    <>
      <PageHeader className={'mx-auto max-w-7xl mt-16 px-4'}>
        <Heading as="h1">
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
      
      {!searchTerm || products?.nodes?.length === 0 ? (
        <SearchResults.Empty />
      ) : (
        <>
          <SearchResults.Products 
            term={searchTerm}
            products={products}
          />
          <Analytics.SearchView data={{searchTerm, searchResults: products}} />
        </>
      )}
    </>
  );
}
