import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '~/components/ui/responsive-dialog';
import {NewsletterForm} from '~/components/klaviyo/newsletter';
import {Button} from '~/components/ui/button';
import {useState} from 'react';

interface JoinEarlyAccessDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  password?: string;
  redirectTo?: string;
}

export function JoinEarlyAccessDialog({
  children,
  open,
  onOpenChange,
  password,
  redirectTo,
}: JoinEarlyAccessDialogProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleNewsletterSuccess = () => {
    // Show password after successful signup
    if (password) {
      setShowPassword(true);
    }
  };

  const handleCopyPassword = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (fallbackErr) {
          // Silent fail - user can manually copy if needed
        }
        document.body.removeChild(textArea);
      }
    }
  };

  // Reset showPassword when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowPassword(false);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {showPassword ? 'Your Password' : 'Join for Early Access'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {showPassword
              ? 'Copy the password below and enter it to access the site'
              : 'Sign up to get early access to new puzzles and exclusive content'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="py-4">
          {showPassword && password ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={password}
                  className="flex-1 px-4 py-2 border rounded-md bg-muted font-mono text-base"
                  style={{ fontSize: '16px' }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  type="button"
                  onClick={handleCopyPassword}
                  className="shrink-0"
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Enter this password in the password field to access the site.
              </p>
            </div>
          ) : (
            <NewsletterForm
              submitBtn="Sign Up"
              source="strands-game-early-access"
              hasSubmitBtn={true}
              onSuccess={handleNewsletterSuccess}
            />
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
