import {cn} from 'app/lib/utils';
import * as React from 'react';
import {forwardRef} from 'react';
import {Drawer as DrawerPrimitive} from 'vaul';

import {IconClose} from '../icons/icon-close';
import {iconButtonClass} from './button';

const Drawer = ({
  onOpenChange,
  open,
  preventScrollRestoration = false,
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => {
  const handleOpen = React.useCallback(($open: boolean) => {
    if (!document) return;
    const body = document.body;

    if (!$open) {
      body.removeAttribute('data-drawer-open');
      return;
    }

    body.setAttribute('data-drawer-open', String($open));
  }, []);

  return (
    <DrawerPrimitive.Root
      onOpenChange={($open) => {
        onOpenChange?.($open);
        handleOpen($open);
      }}
      open={open}
      preventScrollRestoration={preventScrollRestoration}
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
};
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerNestedRoot = DrawerPrimitive.NestedRoot;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({className, ...props}, ref) => (
  <DrawerPrimitive.Overlay
    className={cn('fixed inset-0 z-50 bg-black/20 opacity-25 backdrop-blur-sm', className)}
    ref={ref}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({children, className, ...props}, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      className={cn(
        'bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[20px] border',
        className,
      )}
      ref={ref}
      style={{
        // Prevent Safari zoom on input focus
        fontSize: '16px',
      }}
      {...props}
    >
      <div className="bg-muted mx-auto mt-3 h-1.5 w-12 rounded-full flex-shrink-0" />
      {children}
      <DrawerClose
        className={cn(
          iconButtonClass,
          'absolute top-2 right-2 hidden lg:inline-flex',
        )}
      >
        <IconClose className="size-6" strokeWidth={2} />
        <span className="sr-only">Close</span>
      </DrawerClose>
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('grid gap-2 px-6 pt-4 pb-2 text-center', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('mt-auto flex flex-col gap-2 p-4', className)}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({className, ...props}, ref) => (
  <DrawerPrimitive.Title
    className={cn(
      'text-xl font-bold leading-tight',
      className,
    )}
    ref={ref}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({className, ...props}, ref) => (
  <DrawerPrimitive.Description
    className={cn('text-muted-foreground text-sm leading-relaxed', className)}
    ref={ref}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerNestedRoot,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
};
