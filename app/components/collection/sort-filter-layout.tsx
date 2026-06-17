import type {
  Filter,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';

import {AnimatePresence, m} from 'motion/react';
import {useState} from 'react';

import type {CmsSectionSettings} from '~/hooks/use-colors-css-vars';

import {useOptimisticNavigationData} from '~/hooks/use-optimistic-navigation-data';
import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';
import {cn} from '~/lib/utils';

import {IconFilters} from '../icons/icon-filters';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion-chevron';
import {Button, IconButton} from '../ui/button';
import {ScrollArea} from '../ui/scroll-area';
import {
  AvailableSizeFilter,
  isHiddenFilter,
  sortFilterValues,
} from './available-size-filter';
import {DesktopSort} from './collection-sort';
import {FilterMarkup} from './filter-markup';
export type AppliedFilter = {
  filter: ProductFilter;
  label: string;
};

export type SortParam =
  | 'best-selling'
  | 'featured'
  | 'newest'
  | 'price-high-low'
  | 'price-low-high';

type Props = {
  appliedFilters?: AppliedFilter[];
  availableSizes?: string[];
  children: React.ReactNode;
  filters: Filter[];
  onClearAllFilters: () => void;
  productsCount: number;
  sectionSettings?: CmsSectionSettings;
};

export const FILTER_URL_PREFIX = 'filter.';

export function SortFilter({
  appliedFilters = [],
  availableSizes = [],
  children,
  filters,
  onClearAllFilters,
  productsCount,
  sectionSettings,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const {optimisticData, pending} =
    useOptimisticNavigationData<boolean>('clear-all-filters');
  const {themeContent} = useSanityThemeContent();

  // Here we can optimistically clear all filters and close DrawerFooter
  if (optimisticData) {
    appliedFilters = [];
  }

  return (
    <>
      <div className="relative lg:flex lg:flex-row lg:flex-wrap">
        <div className="lg:mt-6">
          <div
            className={cn([
              'touch:hidden hidden lg:block',
              'transition-all duration-200',
              isOpen
                ? 'sticky top-[calc(var(--desktopHeaderHeight)_+_1rem)] opacity-100 md:w-[240px] md:min-w-[240px] md:pr-8'
                : 'max-h-0 pr-0 opacity-0 md:max-h-full md:w-[0px] md:min-w-[0px]',
            ])}
          >
            <DesktopFiltersDrawer
              appliedFilters={appliedFilters}
              availableSizes={availableSizes}
              filters={filters}
            />
          </div>
        </div>
        <div className="lg:flex-1">{children}</div>
      </div>
    </>
  );
}

export function DesktopFiltersDrawer({
  appliedFilters = [],
  availableSizes = [],
  filters = [],
}: Omit<Props, 'children' | 'onClearAllFilters' | 'productsCount'>) {
  const sizeAccordionValue = 'available-size';
  const defaultOpen = filters.map((filter) => filter.id);
  if (availableSizes.length) defaultOpen.push(sizeAccordionValue);
  return (
    <ScrollArea
      className={cn(
        'h-[calc(100svh_-_var(--desktopHeaderHeight)_-2rem)] w-full px-4 transition-all',
        'rounded-(--product-card-border-corner-radius)',
        'border border-[rgb(var(--border))]',
      )}
    >
      <nav>
        <Accordion
          // Open filters by default
          defaultValue={defaultOpen}
          type="multiple"
        >
          {availableSizes.length > 0 && (
            <AccordionItem
              className="last:border-b-0"
              key={sizeAccordionValue}
              value={sizeAccordionValue}
            >
              <AccordionTrigger>Available Size</AccordionTrigger>
              <AccordionContent>
                <AvailableSizeFilter sizes={availableSizes} />
              </AccordionContent>
            </AccordionItem>
          )}
          {filters
            .filter((filter: Filter) => !isHiddenFilter(filter))
            .map((filter: Filter) => (
            <AccordionItem
              className="last:border-b-0"
              key={filter.id}
              value={filter.id}
            >
              <AccordionTrigger>{filter.label}</AccordionTrigger>
              <AccordionContent>
                <ul className="py-2" key={filter.id}>
                  {sortFilterValues(filter).map((option) => {
                    return (
                      <li className="pb-4" key={option.id}>
                        <FilterMarkup
                          appliedFilters={appliedFilters}
                          filter={filter}
                          option={option}
                        />
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
    </ScrollArea>
  );
}
