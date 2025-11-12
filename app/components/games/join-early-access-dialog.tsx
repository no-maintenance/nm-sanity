import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '~/components/ui/responsive-dialog';
import {NewsletterForm} from '~/components/klaviyo/newsletter';

interface JoinEarlyAccessDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function JoinEarlyAccessDialog({
  children,
  open,
  onOpenChange,
}: JoinEarlyAccessDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-2xl font-bold">
            Join for Early Access
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Sign up to get early access to new puzzles and exclusive content
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 pb-4">
          <NewsletterForm
            submitBtn="Sign Up"
            source="strands-game-early-access"
            hasSubmitBtn={true}
          />
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
