import * as React from 'react';
import {useMediaQuery} from '~/hooks/use-media-query';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

interface ResponsiveDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ResponsiveDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface ResponsiveDialogCloseProps {
  children?: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const ResponsiveDialogContext = React.createContext<{isDesktop: boolean}>({
  isDesktop: true,
});

export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <ResponsiveDialogContext.Provider value={{isDesktop}}>
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={{isDesktop}}>
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({
  children,
  asChild,
  className,
}: ResponsiveDialogTriggerProps) {
  const {isDesktop} = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogTrigger asChild={asChild} className={className}>
        {children}
      </DialogTrigger>
    );
  }

  return (
    <DrawerTrigger asChild={asChild} className={className}>
      {children}
    </DrawerTrigger>
  );
}

export function ResponsiveDialogContent({
  children,
  className,
}: ResponsiveDialogContentProps) {
  const {isDesktop} = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogContent className={className}>
        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </DialogContent>
    );
  }

  return (
    <DrawerContent className={className}>
      <div className="max-h-[90vh] overflow-y-auto">{children}</div>
    </DrawerContent>
  );
}

export function ResponsiveDialogHeader({
  children,
  className,
}: ResponsiveDialogHeaderProps) {
  const {isDesktop} = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogHeader className={className}>{children}</DialogHeader>;
  }

  return <DrawerHeader className={className}>{children}</DrawerHeader>;
}

export function ResponsiveDialogTitle({
  children,
  className,
}: ResponsiveDialogTitleProps) {
  const {isDesktop} = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogTitle className={className}>{children}</DialogTitle>;
  }

  return <DrawerTitle className={className}>{children}</DrawerTitle>;
}

export function ResponsiveDialogDescription({
  children,
  className,
}: ResponsiveDialogDescriptionProps) {
  const {isDesktop} = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogDescription className={className}>{children}</DialogDescription>;
  }

  return <DrawerDescription className={className}>{children}</DrawerDescription>;
}

export function ResponsiveDialogFooter({
  children,
  className,
}: ResponsiveDialogFooterProps) {
  const {isDesktop} = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return <DialogFooter className={className}>{children}</DialogFooter>;
  }

  return <DrawerFooter className={className}>{children}</DrawerFooter>;
}

export function ResponsiveDialogClose({
  children,
  asChild,
  className,
}: ResponsiveDialogCloseProps) {
  const {isDesktop} = React.useContext(ResponsiveDialogContext);

  if (isDesktop) {
    return (
      <DialogClose asChild={asChild} className={className}>
        {children}
      </DialogClose>
    );
  }

  return (
    <DrawerClose asChild={asChild} className={className}>
      {children}
    </DrawerClose>
  );
}
