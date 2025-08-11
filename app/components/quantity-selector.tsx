import {cx} from 'class-variance-authority';
import {forwardRef} from 'react';

import {cn} from '~/lib/utils';

import type {ButtonProps} from './ui/button';

import {IconButton} from './ui/button';
export function QuantitySelector(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const {children, className} = props;
  return (
    <div
      className={cn(
        // Compact control matching button height
        'h-11 grid grid-cols-[2.75rem_minmax(2.5rem,auto)_2.75rem] overflow-hidden w-auto',
        // Match button radius and shadow/border
        'rounded-(--button-border-corner-radius)',
        '[box-shadow:rgb(var(--shadow)_/_var(--button-shadow-opacity))_var(--button-shadow-horizontal-offset)_var(--button-shadow-vertical-offset)_var(--button-shadow-blur-radius)_0px]',
        '[border-width:var(--button-border-thickness)] border-[rgb(var(--input)_/_var(--button-border-opacity))] bg-background',
        className,
      )}
    >
      {children}
    </div>
  );
}

const QuantityButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    symbol: 'decrease' | 'increase';
  }
>(({className, symbol, variant, ...props}, ref) => {
  return (
    <IconButton
      aria-label={cx([
        symbol === 'decrease' && 'Decrease quantity',
        symbol === 'increase' && 'Increase quantity',
      ])}
      className={cn([
        'group disabled:opacity-100',
        // Fill cell and let container handle radius
        'h-full w-full rounded-none',
        // Remove inner borders entirely; container provides the outline
        'border-0',
        className,
      ])}
      name={cx([
        symbol === 'decrease' && 'decrease-quantity',
        symbol === 'increase' && 'increase-quantity',
      ])}
      ref={ref}
      {...props}
    >
      <span className="group-disabled:opacity-40">
        {
          {
            decrease: <>&#8722;</>,
            increase: <>&#43;</>,
          }[symbol]
        }
      </span>
      {props.children}
    </IconButton>
  );
});
QuantityButton.displayName = 'QuantityButton';

function Value(props: {children: React.ReactNode}) {
  return (
    <div
      className={cn(
        'flex h-full min-w-[2.5rem] items-center justify-center px-2 text-center select-none',
        // No top/bottom border so the outer container line stays flush
        // We also avoid vertical borders here and let buttons provide separators
      )}
    >
      {props.children}
    </div>
  );
}

QuantitySelector.Button = QuantityButton;
QuantitySelector.Value = Value;
