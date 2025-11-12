import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '~/components/ui/responsive-dialog';

interface HintDisabledDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function HintDisabledDialog({
  children,
  open,
  onOpenChange,
}: HintDisabledDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-xl font-bold">
            How to Get Hints
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="p-4">
          <ResponsiveDialogDescription className="text-base">
            Find 3 valid words (4+ letters) that aren&apos;t theme words to
            earn a hint. Hints will reveal one theme word on the grid.
          </ResponsiveDialogDescription>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
