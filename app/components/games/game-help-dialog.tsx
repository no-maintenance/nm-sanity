import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from '~/components/ui/responsive-dialog';

interface GameHelpDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GameHelpDialog({
  children,
  open,
  onOpenChange,
}: GameHelpDialogProps) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogTrigger asChild>{children}</ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-2xl font-bold">
            How to Play ENEMEGRAM
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="space-y-4 p-4 text-sm md:text-base">
          <div>
            <h3 className="font-bold mb-2">Objective</h3>
            <p className="text-muted-foreground">
              Find all the theme words hidden in the grid. Each word relates to
              the daily theme.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">How to Play</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                Connect adjacent letters (horizontally, vertically, or
                diagonally) to form words
              </li>
              <li>
                You can change direction while forming a word, but cannot reuse
                the same letter in a single word
              </li>
              <li>Theme words must be at least 4 letters long</li>
              <li>Words can span in any direction and change direction</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">Hints</h3>
            <p className="text-muted-foreground mb-2">
              Earn hints by finding valid 4+ letter words that aren&apos;t theme
              words:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Find 3 valid words to earn 1 hint</li>
              <li>Use a hint to reveal one theme word on the grid</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">Winning</h3>
            <p className="text-muted-foreground">
              Find all the theme words to complete the puzzle!
            </p>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
