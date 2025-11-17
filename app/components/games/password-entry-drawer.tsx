import {Form} from '@remix-run/react';
import {useState} from 'react';
import {Button} from '~/components/ui/button';
import {useMediaQuery} from '~/hooks/use-media-query';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '~/components/ui/drawer';
import {CountdownBanner} from './countdown-banner';
import {PasswordInput} from '~/components/protection/password-input';

interface PasswordEntryDrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  redirectTo?: string;
  error?: string;
  errorKey?: string | number;
  countdown?: string;
  countdownLabel?: string;
}

export function PasswordEntryDrawer({
  children,
  open,
  onOpenChange,
  redirectTo,
  error,
  errorKey,
  countdown,
  countdownLabel = 'SALE BEGINS IN',
}: PasswordEntryDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [showPopup, setShowPopup] = useState(false);

  // On desktop, clicking the button shows a popup form
  if (isDesktop) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowPopup(!showPopup)}
          className="flex size-6 md:size-8 items-center justify-center transition-opacity hover:opacity-70"
          aria-label="Enter Password"
          type="button"
        >
          {children}
        </button>
        {showPopup && (
          <>
            {/* Backdrop to close popup */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPopup(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setShowPopup(false);
                }
              }}
              role="button"
              tabIndex={-1}
              aria-label="Close popup"
            />
            {/* Popup form */}
            <div className="absolute top-full left-0 mt-2 z-50">
              <div className="bg-white border border-black rounded-md shadow-lg p-4 min-w-[280px]">
                <h3 className="text-lg font-bold mb-2">Enter Password</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The sale is protected. Enter the password to enter the sale.
                </p>
                <Form method="post" className="space-y-3">
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <PasswordInput
                    name="password"
                    placeholder="Enter password"
                    required
                    autoComplete="off"
                    error={error}
                    errorKey={errorKey}
                  />
                  <Button type="submit" className="w-full">
                    Unlock
                  </Button>
                </Form>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // On mobile, use a drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-center px-6">
          <DrawerTitle className="text-2xl font-bold uppercase tracking-wide mb-3">
            THE SALE IS PROTECTED
          </DrawerTitle>
          <DrawerDescription className="text-base">
            Enter the password from the newsletter to enter the sale.
          </DrawerDescription>
        </DrawerHeader>
        {countdown && (
          <div className="px-6 pb-4">
            <CountdownBanner countdown={countdown} label={countdownLabel} />
          </div>
        )}
        <div className="px-6 pb-6">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <PasswordInput
              name="password"
              placeholder="Enter password"
              required
              autoComplete="off"
              className="h-12 text-base"
              error={error}
              errorKey={errorKey}
            />
            <Button type="submit" className="w-full">
              ENTER THE QUEUE
            </Button>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
