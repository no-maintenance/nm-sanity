import type {ProductOption} from '@shopify/hydrogen/storefront-api-types';
import type {PartialDeep} from 'type-fest';
import type {PartialObjectDeep} from 'type-fest/source/partial-deep';
import type {ProductVariantFragmentFragment} from 'types/shopify/storefrontapi.generated';

import {Link, useNavigate} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';
import {parseGid} from '@shopify/hydrogen';
import {cx} from 'class-variance-authority';
import {m} from 'motion/react';
import {useCallback, useMemo} from 'react';

import {resolveSwatch} from '~/lib/color-swatch';
import {useHydrated} from '~/hooks/use-hydrated';
import {useOptimisticNavigationData} from '~/hooks/use-optimistic-navigation-data';
import {useSelectedVariant} from '~/hooks/use-selected-variant';

import {useSection} from '../cms-section';

export type VariantOptionValue = {
  isActive: boolean;
  isAvailable: boolean;
  search: string;
  value: string;
};

export function VariantSelector(props: {
  options:
    | (
        | PartialObjectDeep<
            ProductOption,
            {
              recurseIntoArrays: true;
              allowUndefinedInNonTupleArrays: true;
            }
          >
        | undefined
      )[]
    | undefined;
  variants?: Array<PartialDeep<ProductVariantFragmentFragment>>;
}) {
  const selectedVariant = useSelectedVariant({variants: props.variants});

  const options = useMemo(
    () =>
      props.options
        ?.filter((option) => option?.values && option.values?.length > 1)
        .map((option) => {
          let activeValue;
          const optionValues: VariantOptionValue[] = [];
          const variantSelectedOptions = selectedVariant?.selectedOptions;

          for (const value of option?.values ?? []) {
            const valueIsActive =
              value ===
              variantSelectedOptions?.find(
                (selectedOption) => selectedOption.name === option?.name,
              )?.value;

            if (valueIsActive) {
              activeValue = value;
            }

            const newOptions = variantSelectedOptions?.map((selectedOption) => {
              if (selectedOption.name === option?.name) {
                return {
                  ...selectedOption,
                  value,
                };
              }

              return selectedOption;
            });

            const matchedVariant = props.variants?.find((variant) =>
              variant?.selectedOptions?.every((selectedOption) => {
                return newOptions?.find(
                  (newOption) =>
                    newOption.name === selectedOption.name &&
                    newOption.value === selectedOption.value,
                );
              }),
            );

            const matchedVariantId = parseGid(matchedVariant?.id)?.id;

            if (value) {
              optionValues.push({
                isActive: valueIsActive,
                isAvailable: matchedVariant?.availableForSale ?? true,
                search: `?variant=${matchedVariantId}`,
                value,
              });
            }
          }

          return {
            name: option?.name,
            value: activeValue,
            values: optionValues,
          };
        }),
    [props.options, selectedVariant, props.variants],
  );

  return options?.map((option) => {
    // Render the "Color" option as filled circular swatches, but only when
    // every value resolves to a real color — otherwise fall back to text so
    // we never show blank/mismatched circles.
    const isColorOption = /colou?r/i.test(stegaClean(option.name ?? ''));
    const asSwatches =
      isColorOption &&
      option.values.length > 0 &&
      option.values.every((v) => resolveSwatch(v.value));

    return (
      <div key={option.name}>
        {/* <div>{option.name}</div> */}
        <Pills
          asSwatches={asSwatches}
          handle={selectedVariant?.product?.handle}
          option={option}
        />
      </div>
    );
  });
}

function Pills(props: {
  asSwatches?: boolean;
  handle: string | undefined;
  option: {
    name: string | undefined;
    value: string | undefined;
    values: VariantOptionValue[];
  };
}) {
  const navigate = useNavigate();
  const optimisticId = `${props.option.name}-selected-variant`;
  const {optimisticData, pending} =
    useOptimisticNavigationData<string>(optimisticId);

  let values = props.option.values;

  if (optimisticData) {
    // Replace the active value with the optimistic value
    const optimisticValues = values.map((value) => {
      if (value.value === optimisticData) {
        return {
          ...value,
          isActive: true,
        };
      }

      return {
        ...value,
        isActive: false,
      };
    }, []);

    values = optimisticValues;
  }

  const handleSelectVariant = useCallback(
    (value: string, search: string) => {
      navigate(search, {
        preventScrollReset: true,
        replace: true,
        state: {
          optimisticData: value,
          optimisticId,
        },
      });
    },
    [navigate, optimisticId],
  );

  if (props.asSwatches) {
    const activeLabel =
      values.find((value) => value.isActive)?.value ?? props.option.value;
    return (
      <div className="mt-1">
        {activeLabel && <div className="mb-2 text-sm">{activeLabel}</div>}
        <m.div className="flex flex-wrap items-center gap-x-3 gap-y-2" layout>
          {values.map((value) => (
            <ColorSwatch
              handle={props.handle}
              key={value.value}
              onSelectVariant={handleSelectVariant}
              option={props.option}
              pending={pending}
              {...value}
            />
          ))}
        </m.div>
      </div>
    );
  }

  return (
    <m.div
      className="mt-1 flex items-center gap-x-6"
      layout
      layoutRoot
    >
      {values.map((value) => (
        <VariantItem
          handle={props.handle}
          key={value.value}
          onSelectVariant={handleSelectVariant}
          option={props.option}
          pending={pending}
          {...value}
        />
      ))}
    </m.div>
  );
}

function VariantItem(props: {
  handle?: string;
  isActive: boolean;
  isAvailable: boolean;
  onSelectVariant: (value: string, search: string) => void;
  option: {
    name: string | undefined;
    value: string | undefined;
    values: VariantOptionValue[];
  };
  pending: boolean;
  search: string;
  value: string;
}) {
  const {
    handle,
    isActive,
    isAvailable,
    onSelectVariant,
    option,
    pending,
    search,
    value,
  } = props;
  const isHydrated = useHydrated();
  const section = useSection();
  const layoutId = handle! + option.name + section?.id;

  const buttonClass = cx([
    'select-none py-1 text-sm disabled:cursor-pointer relative',
    'focus-visible:outline-hidden focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ]);
  
  const textClass = cx([
    'transition-all duration-300',
    isActive && 'font-bold',
    !isAvailable && 'text-gray-400',
  ]);

  return isHydrated ? (
    <m.button
      className={buttonClass}
      disabled={pending}
      onClick={() => onSelectVariant(value, search)}
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <m.span className={textClass}>{value}</m.span>
      
      {/* Animated underline */}
      <div className="h-px ">
        {isActive && (
          <m.div
            className="h-full bg-black"
            layoutId={layoutId}
            transition={{
              type: 'spring',
              bounce: 0.2,
              duration: 0.6,
            }}
          />
        )}
      </div>
    </m.button>
  ) : (
    <Link className={buttonClass} to={search}>
      <span className={textClass}>{value}</span>
      
      {/* Static underline for non-JS */}
      <div className="h-px ">
        {isActive && (
          <div className="h-full bg-black" />
        )}
      </div>
    </Link>
  );
}


function ColorSwatch(props: {
  handle?: string;
  isActive: boolean;
  isAvailable: boolean;
  onSelectVariant: (value: string, search: string) => void;
  option: {
    name: string | undefined;
    value: string | undefined;
    values: VariantOptionValue[];
  };
  pending: boolean;
  search: string;
  value: string;
}) {
  const {
    isActive,
    isAvailable,
    onSelectVariant,
    pending,
    search,
    value,
  } = props;
  const isHydrated = useHydrated();
  const swatch = resolveSwatch(value);

  const wrapperClass = cx([
    'relative inline-flex h-7 w-7 items-center justify-center rounded-full',
    'transition-transform duration-200',
    'focus-visible:outline-hidden focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    isActive
      ? 'ring-1 ring-black ring-offset-2'
      : 'notouch:hover:scale-110',
    !isAvailable && 'opacity-40',
  ]);

  const circleClass = cx([
    'h-full w-full rounded-full',
    swatch?.isLight ? 'border border-black/15' : 'border border-black/5',
  ]);

  const circle = (
    <span className="relative block h-full w-full">
      <span
        className={circleClass}
        style={{background: swatch?.background}}
      />
      {/* Diagonal strike for sold-out colors */}
      {!isAvailable && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-px w-[140%] -rotate-45 bg-black/50" />
        </span>
      )}
    </span>
  );

  return isHydrated ? (
    <m.button
      aria-label={value}
      aria-pressed={isActive}
      className={wrapperClass}
      disabled={pending}
      onClick={() => onSelectVariant(value, search)}
      style={{WebkitTapHighlightColor: 'transparent'}}
      title={value}
    >
      {circle}
    </m.button>
  ) : (
    <Link
      aria-label={value}
      className={wrapperClass}
      title={value}
      to={search}
    >
      {circle}
    </Link>
  );
}

function Pill(props: {
  handle?: string;
  isActive: boolean;
  isAvailable: boolean;
  onSelectVariant: (value: string, search: string) => void;
  option: {
    name: string | undefined;
    value: string | undefined;
    values: VariantOptionValue[];
  };
  pending: boolean;
  search: string;
  value: string;
}) {
  const {
    handle,
    isActive,
    isAvailable,
    onSelectVariant,
    option,
    pending,
    search,
    value,
  } = props;
  const isHydrated = useHydrated();
  const section = useSection();
  const layoutId = handle! + option.name + section?.id;

  const buttonClass = cx([
    'select-none rounded-full py-[.375rem] text-sm font-medium disabled:cursor-pointer',
    'focus-visible:outline-hidden focus-visible:outline-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ]);
  const bubbleClass = cx(['absolute inset-0 z-0 bg-accent']);
  const foregroundClass = cx([
    'inline-flex items-center relative z-2 justify-center whitespace-nowrap px-3 py-1.5 transition-colors notouch:hover:text-accent-foreground',
    isActive && 'text-accent-foreground',
    !isAvailable && 'opacity-50',
  ]);

  // Animated tabs implementation inspired by the fantastic Build UI recipes
  // (Check out the original at: https://buildui.com/recipes/animated-tabs)
  // Credit to the Build UI team for the awesome Pills animation.
  return isHydrated ? (
    <m.button
      className={buttonClass}
      disabled={pending}
      layout
      layoutRoot
      onClick={() => onSelectVariant(value, search)}
      style={{
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span className="relative block h-8">
        {isActive && (
          <m.span
            className={bubbleClass}
            layoutId={layoutId}
            style={{borderRadius: 9999}}
            transition={{bounce: 0.2, duration: 0.5, type: 'spring'}}
          />
        )}
        <m.span
          className={foregroundClass}
          tabIndex={-1}
          whileTap={{scale: 0.9}}
        >
          {value}
        </m.span>
      </span>
    </m.button>
  ) : (
    <Link className={buttonClass} to={search}>
      <span className="relative block h-8">
        {isActive && (
          <span className={bubbleClass} style={{borderRadius: 9999}} />
        )}
        <span className={foregroundClass} tabIndex={-1}>
          {value}
        </span>
      </span>
    </Link>
  );
}