import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import type {MenuQuery} from 'types/shopify/storefrontapi.generated';
import type {RefObject} from 'react';

import {Link} from '@remix-run/react';
import {Suspense, useRef, useState} from 'react';

import {useIsomorphicLayoutEffect} from '~/hooks/use-isomorphic-layout-effect';
import {useLocalePath} from '~/hooks/use-locale-path';
import {cn} from '~/lib/utils';

import type {AppliedFilter} from './sort-filter-layout';

import {ClientOnly} from '../client-only';
import {IconFilters} from '../icons/icon-filters';
import {MobileDrawer} from './sort-mobile-drawer.client';

type ShopifyMenu = NonNullable<MenuQuery['menu']>;
type ShopifyMenuItem = ShopifyMenu['items'][number];

const NAV_LINK_CLASS =
  'font-light uppercase text-base tracking-wide [font-family:Helvetica,Arial,sans-serif]';

// Desired left-to-right order of category labels (lowercased). Items not listed
// here keep their menu order, appended after the known ones.
const CATEGORY_ORDER = [
  'new arrivals',
  'all',
  'denim',
  'outerwear',
  'leather',
  'bottoms',
  'jersey',
  'shirting',
  'accessories',
];

function orderRank(title?: null | string): number {
  const i = CATEGORY_ORDER.indexOf((title ?? '').toLowerCase().trim());
  return i === -1 ? CATEGORY_ORDER.length : i;
}

function menuItemPath(item: ShopifyMenuItem): string {
  if (!item.url) return '#';
  try {
    return new URL(item.url).pathname;
  } catch {
    return item.url;
  }
}

export function CollectionMobileNav({
  appliedFilters,
  availableSizes,
  filters,
  menu,
  onClearAllFilters,
  productsCount,
}: {
  appliedFilters: AppliedFilter[];
  availableSizes?: string[];
  filters: Filter[];
  menu?: ShopifyMenu | null;
  onClearAllFilters: () => void;
  productsCount: number;
}) {
  const navRef = useRef<HTMLElement>(null);

  const items = [...(menu?.items ?? [])];

  // Inject an "All" entry if the menu doesn't already include one.
  const hasAll = items.some(
    (item) => (item.title ?? '').toLowerCase().trim() === 'all',
  );
  if (!hasAll) {
    items.push({
      id: 'category-all',
      title: 'All',
      // "Shop All" collection on the live store (same target as nomaintenance.us)
      url: '/collections/nomaintenance',
    } as ShopifyMenuItem);
  }

  // Apply the desired left-to-right ordering.
  items.sort((a, b) => orderRank(a.title) - orderRank(b.title));

  return (
    <div
      className={cn(
        'collection-category-bar flex flex-col',
        'mt-[calc(-0.75*var(--paddingTop))] sm:mt-[calc(-1*var(--paddingTop))]',
        'sticky z-30',
        'top-[var(--header-height,64px)]',
        'bg-background',
      )}
    >
      <div className="flex items-stretch">
        <nav
          aria-label="Categories"
          className={cn(
            'relative z-10 flex-1 min-w-0',
            'overflow-x-auto overflow-y-hidden hiddenScroll [-webkit-overflow-scrolling:touch]',
          )}
          ref={navRef}
        >
          <ul className="flex h-11 items-center gap-6 pl-4 pr-4 xl:pl-8 xl:pr-8 whitespace-nowrap">
            {items.map((item) => (
              <li key={item.id} className="shrink-0">
                <CategoryLink item={item} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="shrink-0 bg-background">
          <ClientOnly fallback={null}>
            {() => (
              <Suspense>
                <MobileDrawer
                  appliedFilters={appliedFilters}
                  availableSizes={availableSizes}
                  filters={filters}
                  onClearAllFilters={onClearAllFilters}
                  productsCount={productsCount}
                  triggerClassName={cn(
                    NAV_LINK_CLASS,
                    'flex h-11 items-center gap-2 px-4',
                  )}
                  trigger={
                    <>
                      <span>FILTER</span>
                      <IconFilters className="size-4" />
                    </>
                  }
                />
              </Suspense>
            )}
          </ClientOnly>
        </div>
      </div>
      <ScrollIndicator scrollRef={navRef} />
    </div>
  );
}

function ScrollIndicator({scrollRef}: {scrollRef: RefObject<HTMLElement>}) {
  // Only the visible/hidden decision goes through React state (it changes
  // rarely). The thumb's position/size is written straight to the DOM inside a
  // rAF on scroll, with no CSS transition, so it tracks the finger 1:1 instead
  // of lagging behind an animated margin.
  const [visible, setVisible] = useState(true);
  const thumbRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;

    const apply = () => {
      raf = 0;
      const {clientWidth, scrollLeft, scrollWidth} = el;
      if (scrollWidth <= clientWidth + 1) {
        setVisible(false);
        return;
      }
      setVisible(true);
      const thumb = thumbRef.current;
      if (!thumb) return;
      const width = (clientWidth / scrollWidth) * 100;
      const maxScroll = scrollWidth - clientWidth;
      const left = (scrollLeft / maxScroll) * (100 - width);
      thumb.style.width = `${width}%`;
      thumb.style.marginLeft = `${left}%`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    el.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);
    let ro: null | ResizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onScroll);
      ro.observe(el);
    }
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollRef]);

  if (!visible) return null;

  return (
    <div className="w-full px-4 xl:px-8 pb-2">
      <div className="relative h-[3px] w-full">
        <div
          className="absolute top-0 h-full rounded-full bg-neutral-400"
          ref={thumbRef}
          style={{marginLeft: '0%', width: '33%'}}
        />
      </div>
    </div>
  );
}

function CategoryLink({item}: {item: ShopifyMenuItem}) {
  const path = menuItemPath(item);
  const localePath = useLocalePath({path});

  return (
    <Link
      className={NAV_LINK_CLASS}
      prefetch="none"
      reloadDocument
      to={localePath}
    >
      {item.title}
    </Link>
  );
}
