import {
    Link,
    Form,
    useParams,
    useFetcher,
    type FormProps,
  } from '@remix-run/react';
  import {Image, Money, Pagination} from '@shopify/hydrogen';
  import React, {useRef, useEffect, useState} from 'react';
  
  import type {
    PredictiveProductFragment,
    PredictiveCollectionFragment,
    SearchQuery,
  } from 'types/shopify/storefrontapi.generated';
import { Grid } from '~/components/layout/grid';
  import {Heading, Text} from '~/components/primatives/text';
  import {Button} from '~/components/ui/button';
  import { Card, CardContent, CardMedia } from '~/components/ui/card';
  import { ShopifyImage } from '~/components/shopify-image';
  import { ShopifyMoney } from '~/components/shopify-money';
  import { applyTrackingParams } from '~/lib/search';
  import { cn } from '~/lib/utils';
  import { useRootLoaderData } from '~/root';
  import { stegaClean } from '@sanity/client/stega';

  type PredicticeSearchResultItemImage =
    | PredictiveCollectionFragment['image']
    | PredictiveProductFragment['variants']['nodes'][0]['image'];
  
  type PredictiveSearchResultItemPrice =
    | PredictiveProductFragment['variants']['nodes'][0]['price'];
  
  export type NormalizedPredictiveSearchResultItem = {
    __typename: string | undefined;
    handle: string;
    id: string;
    image?: PredicticeSearchResultItemImage;
    price?: PredictiveSearchResultItemPrice;
    styledTitle?: string;
    title: string;
    url: string;
  };
  
  export type NormalizedPredictiveSearchResults = Array<
    | {type: 'queries'; items: Array<NormalizedPredictiveSearchResultItem>}
    | {type: 'products'; items: Array<NormalizedPredictiveSearchResultItem>}
    | {type: 'collections'; items: Array<NormalizedPredictiveSearchResultItem>}
    | {type: 'pages'; items: Array<NormalizedPredictiveSearchResultItem>}
    | {type: 'articles'; items: Array<NormalizedPredictiveSearchResultItem>}
  >;
  
  export type NormalizedPredictiveSearch = {
    results: NormalizedPredictiveSearchResults;
    totalResults: number;
  };
  
  type FetchSearchResultsReturn = {
    searchResults: {
      results: SearchQuery | null;
      totalResults: number;
    };
    searchTerm: string;
  };
  
  export const NO_PREDICTIVE_SEARCH_RESULTS: NormalizedPredictiveSearchResults = [
    {type: 'queries', items: []},
    {type: 'products', items: []},
    {type: 'collections', items: []},
    {type: 'pages', items: []},
    {type: 'articles', items: []},
  ];
  
  export function SearchForm({searchTerm}: {searchTerm: string}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
  
    // focus the input when cmd+k is pressed
    useEffect(() => {
      function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'k' && event.metaKey) {
          event.preventDefault();
          inputRef.current?.focus();
        }
  
        if (event.key === 'Escape') {
          inputRef.current?.blur();
        }
      }
  
      document.addEventListener('keydown', handleKeyDown);
  
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);
  
    return (
      <Form method="get">
        <input
          defaultValue={searchTerm}
          name="q"
          placeholder="Search…"
          ref={inputRef}
          type="search"
        />
        &nbsp;
        <button type="submit">Search</button>
      </Form>
    );
  }
  
  export function SearchResults({
    results,
    searchTerm,
  }: Pick<FetchSearchResultsReturn['searchResults'], 'results'> & {
    searchTerm: string;
  }) {
    if (!results) {
      return null;
    }
    const keys = Object.keys(results) as Array<keyof typeof results>;
    return (
      <div>
        {results &&
          keys.map((type) => {
            const resourceResults = results[type];
  
            if (resourceResults.nodes[0]?.__typename === 'Page') {
              const pageResults = resourceResults as SearchQuery['pages'];
              return resourceResults.nodes.length ? (
                <SearchResultPageGrid key="pages" pages={pageResults} />
              ) : null;
            }
  
            if (resourceResults.nodes[0]?.__typename === 'Product') {
              const productResults = resourceResults as SearchQuery['products'];
              return resourceResults.nodes.length ? (
                <SearchResultsProductsGrid
                  key="products"
                  products={productResults}
                  searchTerm={searchTerm}
                />
              ) : null;
            }
  
            if (resourceResults.nodes[0]?.__typename === 'Article') {
              const articleResults = resourceResults as SearchQuery['articles'];
              return resourceResults.nodes.length ? (
                <SearchResultArticleGrid
                  key="articles"
                  articles={articleResults}
                />
              ) : null;
            }
  
            return null;
          })}
      </div>
    );
  }
  
function SearchResultsProductsGrid({
    products,
    searchTerm,
  }: Pick<SearchQuery, 'products'> & {searchTerm: string}) {
    return (
      <div className="search-result">
        <h2>Products</h2>
        <Pagination connection={products}>
          {({nodes, isLoading, NextLink, PreviousLink}) => {
            const ItemsMarkup = nodes.map((product) => {
              const trackingParams = applyTrackingParams(
                product,
                `q=${encodeURIComponent(searchTerm)}`,
              );
  
              return (
                <div className="search-results-item" key={product.id}>
                  <Link
                    prefetch="intent"
                    to={`/products/${product.handle}${trackingParams}`}
                  >
                    {product.variants.nodes[0].image && (
                      <Image
                        data={product.variants.nodes[0].image}
                        alt={product.title}
                        width={50}
                      />
                    )}
                    <div>
                      <p>{product.title}</p>
                      <small>
                        <Money data={product.variants.nodes[0].price} />
                      </small>
                    </div>
                  </Link>
                </div>
              );
            });
            return (
              <div>
                <div>
                  <PreviousLink>
                    {isLoading ? 'Loading...' : <span>↑ Load previous</span>}
                  </PreviousLink>
                </div>
                <div>
                  {ItemsMarkup}
                  <br />
                </div>
                <div>
                  <NextLink>
                    {isLoading ? 'Loading...' : <span>Load more ↓</span>}
                  </NextLink>
                </div>
              </div>
            );
          }}
        </Pagination>
        <br />
      </div>
    );
  }
  
  function SearchResultPageGrid({pages}: Pick<SearchQuery, 'pages'>) {
    return (
      <div className="search-result">
        <h2>Pages</h2>
        <div>
          {pages?.nodes?.map((page) => (
            <div className="search-results-item" key={page.id}>
              <Link prefetch="intent" to={`/pages/${page.handle}`}>
                {page.title}
              </Link>
            </div>
          ))}
        </div>
        <br />
      </div>
    );
  }
  
  function SearchResultArticleGrid({articles}: Pick<SearchQuery, 'articles'>) {
    return (
      <div className="search-result">
        <h2>Articles</h2>
        <div>
          {articles?.nodes?.map((article) => (
            <div className="search-results-item" key={article.id}>
              <Link prefetch="intent" to={`/blogs/${article.handle}`}>
                {article.title}
              </Link>
            </div>
          ))}
        </div>
        <br />
      </div>
    );
  }
  
  export function NoSearchResults() {
    return <p>No results, try a different search.</p>;
  }
  
  type ChildrenRenderProps = {
    fetchResults: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fetcher: ReturnType<typeof useFetcher<NormalizedPredictiveSearchResults>>;
    inputRef: React.MutableRefObject<HTMLInputElement | null>;
  };
  
  type SearchFromProps = {
    action?: FormProps['action'];
    className?: string;
    children: (passedProps: ChildrenRenderProps) => React.ReactNode;
    [key: string]: unknown;
  };
  
  /**
   *  Search form component that sends search requests to the `/search` route
   **/
  export function PredictiveSearchForm({
    action,
    children,
    className = 'predictive-search-form',
    ...props
  }: SearchFromProps) {
    const params = useParams();
    const fetcher = useFetcher<NormalizedPredictiveSearchResults>({
      key: 'search',
    });
    const inputRef = useRef<HTMLInputElement | null>(null);
  
    function fetchResults(event: React.ChangeEvent<HTMLInputElement>) {
      const searchAction = action ?? '/api/predictive-search';
      const newSearchTerm = event.target.value || '';
      const localizedAction = params.locale
        ? `/${params.locale}${searchAction}`
        : searchAction;
  
      fetcher.submit(
        {q: newSearchTerm, limit: '6'},
        {method: 'GET', action: localizedAction},
      );
    }
  
    // ensure the passed input has a type of search, because SearchResults
    // will select the element based on the input
    useEffect(() => {
      inputRef?.current?.setAttribute('type', 'search');
    }, []);
  
    return (
      <fetcher.Form
        {...props}
        className={className}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!inputRef?.current || inputRef.current.value === '') {
            return;
          }
          inputRef.current.blur();
        }}
      >
        {children({fetchResults, inputRef, fetcher})}
      </fetcher.Form>
    );
  }
  
  export function PredictiveSearchResults() {
    const {results, totalResults, searchInputRef, searchTerm, state} =
      usePredictiveSearch();
  
    function goToSearchResult(event: React.MouseEvent<HTMLAnchorElement>) {
      if (!searchInputRef.current) return;
      searchInputRef.current.blur();
      searchInputRef.current.value = '';
      // close the aside
      window.location.href = event.currentTarget.href;
    }
  
    if (state === 'loading') {
      return null;
    }
  
    if (!totalResults) {
      return <NoPredictiveSearchResults searchTerm={searchTerm} />;
    }
  
    return (
      <div className="predictive-search-results pb-8 space-y-8">
        <div>
          {results.map(({type, items}) => (
            <PredictiveSearchResult
              goToSearchResult={goToSearchResult}
              items={items}
              key={type}
              searchTerm={searchTerm}
              type={type}
            />
          ))}
        </div>
        {searchTerm.current && (
          <Link onClick={goToSearchResult} to={`/search?q=${searchTerm.current}`} >
            <Button className={'my-gutter'}>
              View all results for <q>{searchTerm.current}</q>
              &nbsp; →
            </Button>
          </Link>
        )}
      </div>
    );
  }
  
  function NoPredictiveSearchResults({
    searchTerm,
  }: {
    searchTerm: React.MutableRefObject<string>;
  }) {
    if (!searchTerm.current) {
      return null;
    }
    return (
      <p>
        No results found for <q>{searchTerm.current}</q>
      </p>
    );
  }
  
  type SearchResultTypeProps = {
    goToSearchResult: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    items: NormalizedPredictiveSearchResultItem[];
    searchTerm: UseSearchReturn['searchTerm'];
    type: NormalizedPredictiveSearchResults[number]['type'];
  };
  
  function PredictiveSearchResult({
    goToSearchResult,
    items,
    searchTerm,
    type,
  }: SearchResultTypeProps) {
    const isSuggestions = type === 'queries';
    const categoryUrl = `/search?q=${
      searchTerm.current
    }&type=${pluralToSingularSearchType(type)}`;
  
    return (
      <div className="predictive-search-result outline-offset-0" key={type}>
        <Link prefetch="intent" to={categoryUrl} onClick={goToSearchResult}>
          <Heading size={'copy'} as={'h5'} className={'py-3 font-medium uppercase'}>
            {isSuggestions ? 'Suggestions' : type}
          </Heading>
        </Link>
        {type === 'products' || type === 'collections' ? (
          <Grid layout={'products'} as={'ul'}>
            {items.map((item: NormalizedPredictiveSearchResultItem) => (
              <SearchResultProduct
                goToSearchResult={goToSearchResult}
                item={item}
                key={item.id}
              />
            ))}
          </Grid>
        ) : (
          <ul>
            {items.map((item: NormalizedPredictiveSearchResultItem) => (
              <SearchResultItem
                goToSearchResult={goToSearchResult}
                item={item}
                key={item.id}
              />
            ))}
          </ul>
        )}
      </div>
    );
  }
  
  type SearchResultItemProps = Pick<SearchResultTypeProps, 'goToSearchResult'> & {
    item: NormalizedPredictiveSearchResultItem;
  };
  
  function SearchResultProduct({goToSearchResult, item}: SearchResultItemProps) {
    const { sanityRoot } = useRootLoaderData();
    const { data } = stegaClean(sanityRoot);
    const style = data?.settings?.productCards?.style;
    const textAlignment = data?.settings?.productCards?.textAlignment || 'left';
    const aspectRatio = data?.settings?.productCards?.imageAspectRatio || 'video';
    
    const [isHovered, setIsHovered] = useState(false);

    const cardClass = cn(
      style === 'card'
        ? 'overflow-hidden rounded-(--product-card-border-corner-radius)'
        : 'rounded-t-[calc(var(--product-card-border-corner-radius)*1.2)]',
      style === 'card'
        ? 'border-[rgb(var(--border)_/_var(--product-card-border-opacity))] [border-width:var(--product-card-border-thickness)]'
        : 'border-0',
      style === 'card'
        ? '[box-shadow:rgb(var(--shadow)_/_var(--product-card-shadow-opacity))_var(--product-card-shadow-horizontal-offset)_var(--product-card-shadow-vertical-offset)_var(--product-card-shadow-blur-radius)_0px]'
        : 'shadow-none',
      style === 'standard' && 'bg-transparent',
      textAlignment === 'center'
        ? 'text-center'
        : textAlignment === 'right'
          ? 'text-right'
          : 'text-left',
    );

    const priceClass = cn(
      'mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-3 *:overflow-hidden *:text-ellipsis *:whitespace-nowrap',
      textAlignment === 'center'
        ? 'justify-center'
        : textAlignment === 'right'
          ? 'justify-end'
          : 'justify-start',
    );

    return (
      <li
        className="predictive-search-result-item outline-offset-4"
        key={item.id}
      >
        <Link onClick={goToSearchResult} to={item.url}>
          <Card
            className={cn(cardClass, 'group/card')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {item.image?.url && (
              <CardMedia
                aspectRatio={aspectRatio}
                className={cn(
                  'relative overflow-hidden',
                  style === 'standard' &&
                  'rounded-(--product-card-border-corner-radius)',
                  style === 'standard' &&
                  '[border-width:var(--product-card-border-thickness)] border-[rgb(var(--border)_/_var(--product-card-border-opacity))]',
                  style === 'standard' &&
                  '[box-shadow:rgb(var(--shadow)_/_var(--product-card-shadow-opacity))_var(--product-card-shadow-horizontal-offset)_var(--product-card-shadow-vertical-offset)_var(--product-card-shadow-blur-radius)_0px]',
                )}
              >
                <ShopifyImage
                  aspectRatio={cn(
                    aspectRatio === 'square' && '1/1',
                    aspectRatio === 'video' && '16/9',
                    aspectRatio === 'auto' && item.image?.width && item.image?.height &&
                    `${item.image.width}/${item.image.height}`,
                  )}
                  crop="center"
                  data={item.image}
                  showBorder={false}
                  showShadow={false}
                  sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                />
              </CardMedia>
            )}
            <CardContent className="pl-0 pt-2 pb-0 mb-6 space-y-1">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap underline-offset-4 uppercase">
                {item.styledTitle ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: item.styledTitle,
                    }}
                  />
                ) : (
                  <span>{item.title}</span>
                )}
              </div>
              <div className="gap-truncate-e h-10">
                <div className={cn(priceClass, 'flex gap-4')}>
                  {item?.price && (
                    <ShopifyMoney
                      className="text-sm md:text-base"
                      data={item.price}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </li>
    );
  }
  
  function SearchResultItem({goToSearchResult, item}: SearchResultItemProps) {
    return (
      <li className="predictive-search-result-item capitalize" key={item.id}>
        <Link onClick={goToSearchResult} to={item.url}>
          <div>
            {item.styledTitle ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: item.styledTitle,
                }}
              />
            ) : (
              <span>{item.title}</span>
            )}
          </div>
        </Link>
      </li>
    );
  }
  
  type UseSearchReturn = NormalizedPredictiveSearch & {
    searchInputRef: React.MutableRefObject<HTMLInputElement | null>;
    searchTerm: React.MutableRefObject<string>;
    state: ReturnType<typeof useFetcher>['state'];
  };
  
  function usePredictiveSearch(): UseSearchReturn {
    const searchFetcher = useFetcher<FetchSearchResultsReturn>({key: 'search'});
    const searchTerm = useRef<string>('');
    const searchInputRef = useRef<HTMLInputElement | null>(null);
  
    if (searchFetcher?.state === 'loading') {
      searchTerm.current = (searchFetcher.formData?.get('q') || '') as string;
    }
  
    const search = (searchFetcher?.data?.searchResults || {
      results: NO_PREDICTIVE_SEARCH_RESULTS,
      totalResults: 0,
    }) as NormalizedPredictiveSearch;
  
    // capture the search input element as a ref
    useEffect(() => {
      if (searchInputRef.current) return;
      searchInputRef.current = document.querySelector('input[type="search"]');
    }, []);
  
    return {...search, searchInputRef, searchTerm, state: searchFetcher.state};
  }
  
  /**
   * Converts a plural search type to a singular search type
   *
   * @example
   * ```js
   * pluralToSingularSearchType('articles'); // => 'ARTICLE'
   * pluralToSingularSearchType(['articles', 'products']); // => 'ARTICLE,PRODUCT'
   * ```
   */
  function pluralToSingularSearchType(
    type:
      | NormalizedPredictiveSearchResults[number]['type']
      | Array<NormalizedPredictiveSearchResults[number]['type']>,
  ) {
    const plural = {
      articles: 'ARTICLE',
      collections: 'COLLECTION',
      pages: 'PAGE',
      products: 'PRODUCT',
      queries: 'QUERY',
    };
  
    if (typeof type === 'string') {
      return plural[type];
    }
  
    return type.map((t) => plural[t]).join(',');
  }
  