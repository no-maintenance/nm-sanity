import {Link} from '@remix-run/react';
import {Image, Money, Pagination} from '@shopify/hydrogen';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';
import {ProductCardGrid} from '~/components/product/product-card-grid';
import {ProductCard} from '~/components/product/product-card';
import {cn} from '~/lib/utils';

type SearchItems = RegularSearchReturn['result']['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = RegularSearchReturn & {
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({
  term,
  result,
  children,
}: Omit<SearchResultsProps, 'error' | 'type'>) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Products = SearchResultsProducts;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <section className="my-16 px-4">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl font-medium mb-8">Articles</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles?.nodes?.map((article: any) => {
            const articleUrl = urlWithTrackingParams({
              baseUrl: `/blogs/${article.handle}`,
              trackingParams: article.trackingParameters,
              term,
            });

            return (
              <div 
                className="group p-4 border border-border rounded-lg hover:shadow-md transition-shadow" 
                key={article.id}
              >
                <Link 
                  prefetch="intent" 
                  to={articleUrl}
                  className="block space-y-2"
                >
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <section className="my-16 px-4">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl font-medium mb-8">Pages</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pages?.nodes?.map((page: any) => {
            const pageUrl = urlWithTrackingParams({
              baseUrl: `/pages/${page.handle}`,
              trackingParams: page.trackingParameters,
              term,
            });

            return (
              <div 
                className="group p-4 border border-border rounded-lg hover:shadow-md transition-shadow" 
                key={page.id}
              >
                <Link 
                  prefetch="intent" 
                  to={pageUrl}
                  className="block space-y-2"
                >
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {page.title}
                  </h3>
                  {page.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {page.excerpt}
                    </p>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SearchResultsProducts({
  term,
  products,
}: PartialSearchResult<'products'>) {
  if (!products?.nodes.length) {
    return null;
  }

  return (
    <section className="my-16 px-4">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-4xl font-medium mb-8">Products</h2>
        <Pagination connection={products}>
          {({nodes, isLoading, NextLink, PreviousLink}) => {
            // Enhance products with tracking data
            const enhancedProducts = nodes.map((product: any) => ({
              ...product,
              // Preserve tracking parameters for analytics - these will be used by
              // Analytics.SearchView component in the parent route for proper tracking
              trackingParameters: product.trackingParameters,
              searchTerm: term,
              // Ensure proper structure for ProductCard compatibility
              variants: product.variants || { nodes: [] },
              media: product.media || { nodes: [] },
            }));

            return (
              <div className="space-y-8">
                <div className="flex justify-center">
                  <PreviousLink className={cn(
                    "inline-flex items-center px-4 py-2 text-sm font-medium text-foreground",
                    "bg-background border border-border rounded-md hover:bg-muted",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}>
                    {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                  </PreviousLink>
                </div>
                
                <ProductCardGrid
                  products={enhancedProducts}
                  columns={{
                    desktop: 4,
                    mobile: 2,
                  }}
                />
                
                <div className="flex justify-center">
                  <NextLink className={cn(
                    "inline-flex items-center px-4 py-2 text-sm font-medium text-foreground",
                    "bg-background border border-border rounded-md hover:bg-muted",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}>
                    {isLoading ? 'Loading...' : <span>Load more ↓</span>}
                  </NextLink>
                </div>
              </div>
            );
          }}
        </Pagination>
      </div>
    </section>
  );
}

function SearchResultsEmpty() {
  return (
    <section className="my-16 px-4">
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-lg text-muted-foreground">No results, try a different search.</p>
      </div>
    </section>
  );
}