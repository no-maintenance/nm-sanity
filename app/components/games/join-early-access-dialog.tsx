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

  const handleCopyPassword = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!password) return;

    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(password);
        return;
      } catch (err) {
        console.warn('Clipboard API failed, falling back to execCommand', err);
      }
    }

    // Fallback method that works better in drawers/modals
    try {
      const textArea = document.createElement('textarea');
      textArea.value = password;
      // Position off-screen but make it focusable
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);

      // Select the text
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, password.length);

      // Copy using execCommand
      const successful = document.execCommand('copy');

      document.body.removeChild(textArea);

      if (!successful) {
        console.error('Copy command failed');
      }
    } catch (fallbackErr) {
      console.error('Fallback copy failed', fallbackErr);
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
      <ResponsiveDialogContent className="md:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {showPassword ? 'Your Password' : 'Join for Password'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {showPassword
              ? 'Copy the password below and enter it to access the site'
              : 'Sign up with your email to receive the password to gain access to the PRIVATE SALE. It will be sent to your email address provided.'}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="py-4 px-6 md:px-0">
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
