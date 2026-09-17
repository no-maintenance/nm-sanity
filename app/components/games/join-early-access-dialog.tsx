import {Form, Link, useActionData, useNavigation} from '@remix-run/react';
import {useState} from 'react';

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '~/components/ui/responsive-dialog';
import {Button} from '~/components/ui/button';
import {Checkbox} from '~/components/ui/checkbox';

interface JoinEarlyAccessDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  redirectTo?: string;
}

/**
 * Early-access signup. Submits the email to the site-protected route action
 * (actionType=early-access), which captures it server-side and grants access
 * by redirecting into the site. The sale password is never sent to the browser.
 */
export function JoinEarlyAccessDialog({
  children,
  open,
  onOpenChange,
  redirectTo,
}: JoinEarlyAccessDialogProps) {
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  const [consent, setConsent] = useState(false);

  const isSubmitting = navigation.state !== 'idle';
  const error =
    actionData && typeof actionData === 'object' && 'error' in actionData
      ? (actionData.error as string | undefined)
      : undefined;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="md:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Join for Access</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Sign up with your email to unlock the PRIVATE SALE. You&apos;ll be
            let in right away.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="py-4 px-6 md:px-0">
          <Form method="post" className="space-y-4">
            <input type="hidden" name="actionType" value="early-access" />
            {redirectTo && (
              <input type="hidden" name="redirectTo" value={redirectTo} />
            )}
            <input
              autoComplete="off"
              className="w-full px-4 py-2 border rounded-md bg-transparent"
              data-1p-ignore
              name="email"
              placeholder="Enter your email address"
              required
              style={{fontSize: '16px'}}
              type="email"
            />
            <div className="flex flex-row items-start space-x-3">
              <Checkbox
                checked={consent}
                name="consent"
                onCheckedChange={(v) => setConsent(v === true)}
                required
                value="on"
              />
              <label className="text-xs font-normal leading-none">
                I agree to receive the newsletter. See more about our{' '}
                <Link className="underline" to="/policies/privacy-policy">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Signing up…' : 'Sign Up'}
            </Button>
          </Form>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
