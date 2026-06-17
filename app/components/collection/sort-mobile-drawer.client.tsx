import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import type {ReactNode} from 'react';

import {useState} from 'react';

import {useOptimisticNavigationData} from '~/hooks/use-optimistic-navigation-data';
import {useSanityThemeContent} from '~/hooks/use-sanity-theme-content';
import {cn} from '~/lib/utils';

import type {AppliedFilter} from './sort-filter-layout';

import {IconFilters} from '../icons/icon-filters';
import {Button, iconButtonClass} from '../ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from '../ui/drawer';
import {ScrollArea} from '../ui/scroll-area';
import {
  MobileAvailableSizeFilter,
  isHiddenFilter,
  sortFilterValues,
} from './available-size-filter';
import {MobileSort} from './collection-sort';
import {FilterMarkup} from './filter-markup';

export function MobileDrawer({
  appliedFilters,
  availableSizes = [],
  className,
  filters,
  onClearAllFilters,
  productsCount,
  trigger,
  triggerClassName,
}: {
  appliedFilters: AppliedFilter[];
  availableSizes?: string[];
  className?: string;
  filters: Filter[];
  onClearAllFilters: () => void;
  productsCount: number;
  trigger?: ReactNode;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const {themeContent} = useSanityThemeContent();
  const heading = themeContent?.collection?.filterAndSort;
  const {pending} = useOptimisticNavigationData<boolean>('clear-all-filters');

  return (
    <div className={cn(className)}>
      <Drawer onOpenChange={setOpen} open={open}>
        <DrawerTrigger className={triggerClassName ?? 'w-auto gap-2 px-2 flex'}>
          {trigger ?? (
            <>
              <IconFilters />
              <span className="font-medium">{heading}</span>
            </>
          )}
        </DrawerTrigger>
        <DrawerContent
          className={cn([
            'bg-background text-foreground h-(--dialog-content-height) max-h-screen w-screen p-0',
            '[--dialog-content-height:calc(100svh_*_.95)] [--dialog-content-max-width:calc(32rem)]',
            'lg:right-0 lg:left-auto lg:max-w-(--dialog-content-max-width) lg:[--dialog-content-height:100svh]',
          ])}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="size-full overflow-hidden">
            <ScrollArea className="size-full px-6">
              <div className="pt-6">
                <MobileSort />
              </div>
              <div className="pr-1">
                {availableSizes.length > 0 && (
                  <div className="my-8 border-t pt-8">
                    <div className="text-xl font-medium">Available Size</div>
                    <MobileAvailableSizeFilter sizes={availableSizes} />
                  </div>
                )}
                {filters
                  .filter((filter: Filter) => !isHiddenFilter(filter))
                  .map((filter: Filter) => (
                  <div className="my-8 border-t pt-8" key={filter.id}>
                    <div className="text-xl font-medium">{filter.label}</div>
                    <ul className="mt-3" key={filter.id}>
                      {sortFilterValues(filter).map((option) => {
                        return (
                          <li className="[&_label]:py-3" key={option.id}>
                            <FilterMarkup
                              appliedFilters={appliedFilters}
                              filter={filter}
                              option={option}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DrawerFooter
            className={cn(
              'grid items-center justify-center gap-5 border-t py-6',
              appliedFilters.length > 0
                ? 'grid-flow-col grid-cols-2'
                : 'grid-cols-1',
            )}
          >
            {appliedFilters.length > 0 && (
              <Button
                className={cn([
                  'flex items-center gap-1',
                  pending && 'pointer-events-none animate-pulse delay-500',
                ])}
                onClick={onClearAllFilters}
                variant="ghost"
              >
                <span>{themeContent?.collection?.clear}</span>
                <span className="tabular-nums">
                  ({appliedFilters.length})
                </span>
              </Button>
            )}
            <Button onClick={() => setOpen(false)}>
              {themeContent?.collection?.apply}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
