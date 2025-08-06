import {Grid2X2, Grid3X3} from 'lucide-react';
import {useEditorialGridToggle} from './sections/media-gallery-section';
import {cn} from '~/lib/utils';

interface EditorialGridToggleProps {
  className?: string;
}

export function EditorialGridToggle({className}: EditorialGridToggleProps) {
  const {isWideLayout, toggleLayout} = useEditorialGridToggle();
  
  return (
    <button
      onClick={toggleLayout}
      className={cn(
        'flex items-center justify-center p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
        className
      )}
      aria-label={`Switch to ${isWideLayout ? 'narrow' : 'wide'} grid layout`}
      title={`Switch to ${isWideLayout ? 'narrow' : 'wide'} grid layout`}
    >
      {isWideLayout ? (
        <Grid2X2 className="w-5 h-5" />
      ) : (
        <Grid3X3 className="w-5 h-5" />
      )}
    </button>
  );
}