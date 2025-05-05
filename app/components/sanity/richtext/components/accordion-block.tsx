import React, { useState } from 'react';
import { cn } from '~/lib/utils';
import { IconChevron } from '~/components/icons/icon-chevron';

export type AccordionBlockProps = {
  title: string;
  content: any;
  defaultOpen?: boolean;
};

export function AccordionBlock(props: AccordionBlockProps) {
  const { title, content, defaultOpen = false } = props;
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="flex w-full items-center justify-between py-2 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium">{title}</span>
        <IconChevron
          direction={isOpen ? 'up' : 'down'}
          className={cn(
            'transition-transform duration-200',
            isOpen ? 'rotate-0' : 'rotate-0'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="py-3">{content}</div>
      </div>
    </div>
  );
}
