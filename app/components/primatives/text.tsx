import {cn} from '~/lib/utils';

export function Text({
  as: Component = 'span',
  className,
  color = 'default',
  format,
  size = 'copy',
  width = 'default',
  children,
  ...props
}: {
  as?: React.ElementType;
  className?: string;
  color?: 'default' | 'primary' | 'subtle' | 'notice' | 'contrast';
  format?: boolean;
  size?: 'lead' | 'copy' | 'fine' | 'inherit';
  width?: 'default' | 'narrow' | 'wide';
  children: React.ReactNode;
  [key: string]: any;
}) {
  const colors: Record<string, string> = {
    default: 'inherit',
    primary: 'text-foreground/90',
    subtle: 'text-foreground/50',
    notice: 'text-notice',
    contrast: 'text-background/90',
  };

  const sizes: Record<string, string> = {
    lead: 'text-lead font-medium',
    copy: 'text-copy',
    fine: 'text-fine subpixel-antialiased',
    inherit: 'text-inherit',
  };

  const widths: Record<string, string> = {
    default: 'max-w-prose',
    narrow: 'max-w-prose-narrow',
    wide: 'max-w-prose-wide',
  };

  const styles = cn(
    widths[width],
    colors[color],
    sizes[size],
    'whitespace-pre-wrap',
    className,
  );

  return (
    <Component {...props} className={styles}>
      {children}
    </Component>
  );
}

export function Heading({
  as: Component = 'h2',
  children,
  className = '',
  format,
  size = 'heading',
  width = 'default',
  ...props
}: {
  as?: React.ElementType;
  children: React.ReactNode;
  format?: boolean;
  size?: 'display' | 'heading' | 'mid' | 'lead' | 'copy' | 'fine';
  width?: 'default' | 'narrow' | 'wide';
} & React.HTMLAttributes<HTMLHeadingElement>) {
  const sizes = {
    display: 'font-normal text-display',
    heading: 'font-normal text-heading',
    mid: 'font-normal text-mid',
    lead: 'font-normal text-lead',
    copy: 'font-normal text-copy',
    fine: 'text-fine subpixel-antialiased',
  };

  const widths = {
    default: 'max-w-prose',
    narrow: 'max-w-prose-narrow',
    wide: 'max-w-prose-wide',
  };

  const styles = cn(
    widths[width],
    sizes[size],
    'whitespace-pre-wrap',
    className,
  );

  return (
    <Component {...props} className={styles}>
      {children}
    </Component>
  );
}

export function Section({
  as: Component = 'section',
  children,
  className,
  divider = 'none',
  display = 'grid',
  heading,
  padding = 'all',
  ...props
}: {
  as?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  divider?: 'none' | 'top' | 'bottom' | 'both';
  display?: 'grid' | 'flex';
  heading?: string;
  padding?: 'x' | 'y' | 'swimlane' | 'all' | 'none';
  [key: string]: any;
}) {
  const paddings = {
    none: '',
    x: 'px-gutter',
    y: 'py-gutter',
    swimlane: 'pt-4 md:pt-8 lg:pt-12 md:pb-4 lg:pb-8',
    all: 'p-gutter',
  };

  const dividers = {
    none: 'border-none',
    top: 'border-t border-foreground/05',
    bottom: 'border-b border-foreground/05',
    both: 'border-y border-foreground/05',
  };

  const displays = {
    flex: 'flex',
    grid: 'grid',
  };

  const styles = cn(
    displays[display],
    paddings[padding],
    dividers[divider],
    'whitespace-pre-wrap',
    className,
  );

  return (
    <Component {...props} className={styles}>
      {heading && (
        <Heading size="lead" className={cn('pb-gutter')}>
          {heading}
        </Heading>
      )}
      {children}
    </Component>
  );
}

export function PageHeader({
  children,
  className,
  heading,
  variant = 'default',
  ...props
}: {
  children?: React.ReactNode;
  className?: string;
  heading?: string;
  variant?: 'default' | 'blogPost' | 'allCollections' | 'page';
  [key: string]: any;
}) {
  const variants: Record<string, string> = {
    page: 'max-w-3xl grid w-full gap-8 p-gutter justify-items-start mx-auto mt-gutter',
    default: 'grid w-full gap-8 p-gutter justify-items-start',
    blogPost:
      'grid md:text-center w-full gap-4 xl:mt-24 lg:mt-16 mt-12 pb-gutter text-center md:justify-items-center',
    allCollections:
      'flex justify-between items-baseline gap-8 p-6 md:p-8 lg:p-12',
  };

  const styles = cn(variants[variant], className);

  return (
    <header {...props} className={styles}>
      {heading && (
        <Heading as="h1" width="narrow" size="heading" className="inline-block">
          {heading}
        </Heading>
      )}
      {children}
    </header>
  );
}
