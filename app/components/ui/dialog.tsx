import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import {cn} from '~/lib/utils';
import {cva, VariantProps} from 'class-variance-authority';
import { IconClose } from '~/components/icons/icon-close';

const dialogVariants = cva(
  'fixed z-50 grid w-full max-w-[28rem] gap-4 bg-background p-6 shadow-lg rounded-[var(--dropdown-popup-border-corner-radius)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-[10%] data-[state=open]:slide-in-from-top-[10%] ',
  {
    variants: {
      variant: {
        // Centered modal with constrained width
        wide: 'sm:max-w-2xl left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
        // Centered modal with constrained height
        tall: 'sm:max-h-[650px] h-[80vh] left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
        // Fullscreen modal; scrolls vertically and starts content at top
        full: 'inset-0 w-screen h-screen max-w-none p-0 m-0 border-none shadow-none bg-background rounded-none left-auto top-auto translate-x-0 translate-y-0 overflow-y-auto',
      },
      transition: {
        default: '',
        slideFromLeft: 'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
      },
    },
    defaultVariants: {
      variant: 'wide',
      transition: 'default',
    },
  },
);
const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({className, ...props}, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  VariantProps<typeof dialogVariants> &
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({className, children, variant, transition, ...props}, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogVariants({variant, transition}), className)}
      {...props}
    >
      {variant === 'full' ? (
        <div className="sticky top-4 z-[9999] flex justify-end px-4">
          <DialogPrimitive.Close
            aria-label="Close"
            className={cn(
              'p-1.5',
              'transition-opacity hover:opacity-100 focus-visible:outline-none',
            )}
          >
            <IconClose />
          </DialogPrimitive.Close>
        </div>
      ) : (
        <DialogPrimitive.Close
          aria-label="Close"
          className={cn(
            'absolute right-4 top-4 p-1.5',
            'transition-opacity hover:opacity-100 focus-visible:outline-none',
          )}
        >
          <IconClose />
        </DialogPrimitive.Close>
      )}
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 text-center sm:text-left',
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({className, ...props}, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({className, ...props}, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
