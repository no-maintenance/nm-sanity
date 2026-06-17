import type {Filter} from '@shopify/hydrogen/storefront-api-types';

import {useLocation, useNavigate, useSearchParams} from '@remix-run/react';
import {useCallback} from 'react';

import {useOptimisticNavigationData} from '~/hooks/use-optimistic-navigation-data';
import {AVAILABLE_SIZE_URL_PARAM, stripPaginationParams} from '~/lib/shopify-collection';
import {cn} from '~/lib/utils';

import {Checkbox} from '../ui/checkbox';
import {Label} from '../ui/label';

const SIZE_ORDER = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  '2XL',
  '3XL',
  '4XL',
];

// Maps long-form size labels Shopify returns ("X-Small", "Medium", ...) to the
// canonical short codes used in SIZE_ORDER.
const SIZE_ALIASES: Record<string, string> = {
  'XX-SMALL': 'XXS',
  'XXSMALL': 'XXS',
  'X-SMALL': 'XS',
  'XSMALL': 'XS',
  'SMALL': 'S',
  'MEDIUM': 'M',
  'LARGE': 'L',
  'X-LARGE': 'XL',
  'XLARGE': 'XL',
  'XX-LARGE': 'XXL',
  'XXLARGE': 'XXL',
  'XXX-LARGE': 'XXXL',
  'XXXLARGE': 'XXXL',
};

function sizeRank(size: string): number {
  const upper = size.toUpperCase().trim();
  const canonical = SIZE_ALIASES[upper] ?? upper;
  return SIZE_ORDER.indexOf(canonical);
}

function isOneSize(size: string): boolean {
  const upper = size.toUpperCase().trim();
  return upper === 'OS' || upper === 'ONE SIZE' || upper === 'ONESIZE';
}

function compareSizes(a: string, b: string): number {
  const aOne = isOneSize(a);
  const bOne = isOneSize(b);
  if (aOne && bOne) return a.localeCompare(b);
  if (aOne) return 1;
  if (bOne) return -1;

  const aRank = sizeRank(a);
  const bRank = sizeRank(b);
  if (aRank !== -1 && bRank !== -1) return aRank - bRank;
  if (aRank !== -1) return -1;
  if (bRank !== -1) return 1;

  const aNum = Number(a);
  const bNum = Number(b);
  if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
  return a.localeCompare(b);
}

function isSizeFilter(filter: Pick<Filter, 'id' | 'label'>): boolean {
  const label = filter.label?.toLowerCase() ?? '';
  const id = filter.id?.toLowerCase() ?? '';
  return label === 'size' || id.endsWith('.size');
}

/**
 * Shopify-provided filters we hide from the generic filter list because the
 * UI already covers them elsewhere: "Style" via the category bar, and "Size"
 * via the custom "Available Size" section (which is deduped/cleaned).
 */
export function isHiddenFilter(filter: Pick<Filter, 'label'>): boolean {
  const label = (filter.label ?? '').toLowerCase().trim();
  return label === 'style' || label === 'size';
}

export function sortFilterValues(filter: Filter): Filter['values'] {
  const values = filter.values ?? [];
  if (!isSizeFilter(filter)) return values;
  return [...values].sort((a, b) => compareSizes(a.label, b.label));
}

export function sortSizes(sizes: string[]) {
  return [...sizes].sort(compareSizes);
}

function useToggleSize() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Multi-select: any number of sizes can be active at once.
  const selectedSizes = params.getAll(AVAILABLE_SIZE_URL_PARAM);

  const toggleSize = useCallback(
    (size: string, optimisticId: string) => {
      const current = params.getAll(AVAILABLE_SIZE_URL_PARAM);
      const isApplied = current.includes(size);
      const nextSizes = isApplied
        ? current.filter((s) => s !== size)
        : [...current, size];

      const next = stripPaginationParams(params);
      next.delete(AVAILABLE_SIZE_URL_PARAM);
      for (const s of nextSizes) {
        next.append(AVAILABLE_SIZE_URL_PARAM, s);
      }

      const query = next.toString();
      navigate(query ? `${location.pathname}?${query}` : location.pathname, {
        preventScrollReset: true,
        replace: true,
        state: {
          optimisticData: {isFilterChecked: !isApplied},
          optimisticId,
        },
      });
    },
    [navigate, params, location.pathname],
  );

  return {selectedSizes, toggleSize};
}

function SizeCheckbox({
  id,
  isMobile,
  size,
  toggleSize,
  urlChecked,
}: {
  id: string;
  isMobile?: boolean;
  size: string;
  toggleSize: (size: string, optimisticId: string) => void;
  urlChecked: boolean;
}) {
  const {optimisticData, pending} = useOptimisticNavigationData<{
    isFilterChecked: boolean;
  }>(id);
  const {optimisticData: clearFilters} =
    useOptimisticNavigationData<boolean>('clear-all-filters');

  let checked = urlChecked;
  if (optimisticData) {
    checked = optimisticData.isFilterChecked;
  } else if (clearFilters) {
    checked = false;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        pending && 'pointer-events-none animate-pulse delay-500',
      )}
    >
      <Checkbox
        aria-label={size}
        checked={checked}
        id={id}
        onCheckedChange={() => toggleSize(size, id)}
      />
      <Label
        className={cn(
          'w-full cursor-pointer',
          isMobile
            ? undefined
            : 'lg:transition-opacity lg:hover:opacity-70',
        )}
        htmlFor={id}
      >
        {size}
      </Label>
    </div>
  );
}

export function AvailableSizeFilter({sizes}: {sizes: string[]}) {
  const {selectedSizes, toggleSize} = useToggleSize();

  if (!sizes.length) return null;

  return (
    <ul className="py-2">
      {sizes.map((size) => {
        const id = `available-size-${size}`;
        return (
          <li className="pb-4" key={size}>
            <SizeCheckbox
              id={id}
              size={size}
              toggleSize={toggleSize}
              urlChecked={selectedSizes.includes(size)}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function MobileAvailableSizeFilter({sizes}: {sizes: string[]}) {
  const {selectedSizes, toggleSize} = useToggleSize();

  if (!sizes.length) return null;

  return (
    <ul className="mt-3">
      {sizes.map((size) => {
        const id = `available-size-mobile-${size}`;
        return (
          <li className="[&_label]:py-3" key={size}>
            <SizeCheckbox
              id={id}
              isMobile
              size={size}
              toggleSize={toggleSize}
              urlChecked={selectedSizes.includes(size)}
            />
          </li>
        );
      })}
    </ul>
  );
}
