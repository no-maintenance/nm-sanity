import type { Variants } from 'motion/react';
import type { CSSProperties } from 'react';

import { Link, useLocation } from '@remix-run/react';
import { getImageDimensions } from '@sanity/asset-utils';
import { stegaClean } from '@sanity/client/stega';
import { cx } from 'class-variance-authority';
import { m, transform, useMotionValueEvent, useTransform } from 'motion/react';
import React, { Suspense, useEffect, useState, useRef, useId, useCallback } from 'react';

import { useBoundedScroll } from '~/hooks/use-bounded-scroll';
import { useColorsCssVars } from '~/hooks/use-colors-css-vars';
import { useLocalePath } from '~/hooks/use-locale-path';
import { cn } from '~/lib/utils';
import { useRootLoaderData } from '~/root';

import { ClientOnly } from '../client-only';
import { headerVariants } from '../cva/header';
import { IconAccount } from '../icons/icon-account';
import { DesktopNavigation } from '../navigation/desktop-navigation';
import { MobileNavigation } from '../navigation/mobile-navigation.client';
import { Button, IconButton } from '../ui/button';
import CartDrawer from './cart-drawer-wrapper';
import { Logo as HeaderLogo } from './header-logo';
import { IconSearch } from '~/components/icons/icon-search';
import { PredictiveSearchResults } from '~/components/search';
import { PredictiveSearchForm } from '~/components/search';
import { IconClose } from '~/components/icons/icon-close';
import { CountrySelector } from '~/components/layout/country-selector';

// Client-only component to handle scroll events for fluid header
function FluidHeaderScrollHandler({
  onScroll,
}: {
  onScroll: (scrolled: boolean) => void;
}) {
  useEffect(() => {
    // Check initial scroll position on mount
    const checkScroll = () => {
      // Lower threshold to detect scroll sooner
      const scrolled = window.scrollY > 10;
      onScroll(scrolled);
    };
    
    // Run once on mount
    checkScroll();
    
    // Set up event listener
    window.addEventListener('scroll', checkScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', checkScroll);
    };
  }, [onScroll]);
  
  return null;
}

export function Header() {
  const { sanityRoot } = useRootLoaderData();
  const data = sanityRoot?.data;
  const header = data?.header;
  const logoWidth = header?.desktopLogoWidth
    ? `${header?.desktopLogoWidth}px`
    : undefined;
  const showCountrySelectorIcon = header?.showCountrySelectorIcon;
  const showSearchIcon = header?.showSearchIcon;
  const showHamburgerMenuOnDesktop = stegaClean(header?.showHamburgerMenuOnDesktop);
  const homePath = useLocalePath({ path: '/' });
  const colorsCssVars = useColorsCssVars({
    selector: 'header',
    settings: header,
  });
  const logoPosition = stegaClean(header?.logoPosition);
  const headerRef = useRef<HTMLElement>(null);
  
  // State for mobile navigation
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // State for search open
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Function to close mobile navigation
  const closeMobileNav = useCallback(() => {
    if (mobileNavOpen) {
      setMobileNavOpen(false);
    }
  }, [mobileNavOpen]);

  const NavigationComponent = (
    <>
      {!showHamburgerMenuOnDesktop && (
        <div className="touch:hidden lg:block">
          <DesktopNavigation data={header?.menu} />
        </div>
      )}
      <div className={cn(
        "touch:block",
        !showHamburgerMenuOnDesktop && "lg:hidden",
      )}>
        <ClientOnly>
          {() => (
            <Suspense>
              <MobileNavigation 
                data={header?.menu} 
                headerRef={headerRef} 
                open={mobileNavOpen}
                setOpen={setMobileNavOpen}
              />
            </Suspense>
          )}
        </ClientOnly>
      </div>
    </>
  );

  const LogoComponent = (
    <Link className="group" prefetch="intent" to={homePath}>
      <HeaderLogo
        className="h-auto w-[var(--logoWidth)]"
        sizes={logoWidth}
        style={{
          '--logoWidth': logoWidth || 'auto',
        } as CSSProperties}
      />
    </Link>
  );

  const Icons = (
    <div className="flex items-center md:gap-2">
      <div className="hidden sm:block">
        {showCountrySelectorIcon && <CountrySelector isIcon={true} />}
      </div>
      <div className="hidden sm:block">
        {showSearchIcon && (
          <PredictiveSearchItem 
            closeMobileNav={closeMobileNav} 
            onSearchOpenChange={setSearchOpen}
          />
        )}
      </div>
      <AccountLink className="focus:ring-primary/5 relative flex items-center justify-center" />
      <CartDrawer />
    </div>
  );

  return (
    <ForwardedHeaderWrapper ref={headerRef} mobileNavOpen={mobileNavOpen} searchOpen={searchOpen}>
      <style dangerouslySetInnerHTML={{ __html: colorsCssVars }} />
      <div className="container">
        <div className={cn(
          "flex items-center relative gap-4",
          logoPosition === 'left' && "justify-between",
          logoPosition === 'center' && "justify-between",
          logoPosition === 'right' && "flex-row-reverse justify-between"
        )}>
          <div className="flex items-center gap-4">
            {NavigationComponent}
            {logoPosition === 'left' && LogoComponent}
          </div>
          {logoPosition === 'center' && (
            <div className="absolute left-1/2 -translate-x-1/2">
              {LogoComponent}
            </div>
          )}
          {logoPosition === 'right' && LogoComponent}
          {Icons}
        </div>
      </div>
    </ForwardedHeaderWrapper>
  );
}

function AccountLink({ className }: { className?: string }) {
  return (
    <IconButton asChild>
      <Link className={className} to="/account">
        <IconAccount className="md:size-6 size-5" />
      </Link>
    </IconButton>
  );
}


function HeaderWrapper(props: { 
  children: React.ReactNode;
  mobileNavOpen?: boolean;
  searchOpen?: boolean;
}, ref: React.Ref<HTMLElement>) {
  const { sanityRoot } = useRootLoaderData();
  const { pathname } = useLocation();
  const data = sanityRoot?.data;
  const header = data?.header;
  const showSeparatorLine = header?.showSeparatorLine;
  const blur = header?.blur;
  const sticky = stegaClean(header?.sticky);
  
  // Fluid header settings
  const enableFluidHeader = stegaClean((header as any)?.enableFluidHeader) || false;
  const fluidHeaderOnHomePage = stegaClean((header as any)?.fluidHeaderOnHomePage) || false;
  const fluidHeaderTextColor = stegaClean((header as any)?.fluidHeaderTextColor) || 'white';
  
  // Check if current page should have fluid header
  const isHomePage = pathname === '/';
  const shouldHaveFluidHeader = enableFluidHeader && 
    ((isHomePage && fluidHeaderOnHomePage));
  
  // State to track scroll position for fluid header
  // Initialize to transparent (false) for fluid headers, solid (true) for regular headers
  const [isScrolled, setIsScrolled] = useState(!shouldHaveFluidHeader);
  
  // Mobile nav state and search state
  const { mobileNavOpen = false, searchOpen = false } = props;
  
  // Generate text color class for transparent header
  const fluidTextColorClass = 
    fluidHeaderTextColor === 'white' ? 'text-white' :
    fluidHeaderTextColor === 'black' ? 'text-black' :
    'text-foreground';

  // Determine if header should be in solid state (scrolled, nav open, or search open)
  const isSolidState = isScrolled || mobileNavOpen || searchOpen;

  const headerClassName = cx([
    'section-padding pointer-events-auto  w-full',
    // Position: fixed when fluid header, sticky when normal header
    shouldHaveFluidHeader ? 'fixed top-0 left-0 right-0 z-50' : 
      (sticky !== 'none' ? 'sticky top-0 z-50' : ''),
    
    // Apply fluid header styles
    shouldHaveFluidHeader ? (
      isSolidState
        ? 'bg-background text-foreground' 
        : `bg-transparent ${fluidTextColorClass}`
    ) : 'bg-background text-foreground',
    
    // Only apply blur when not in transparent state
    (blur && (!shouldHaveFluidHeader || isSolidState)) &&
      'bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/85',
    
    // Only apply separator line when not in transparent state or when scrolled
    headerVariants({
      optional: (showSeparatorLine && (!shouldHaveFluidHeader || isSolidState)) ? 'separator-line' : null,
    }),
  ]);

  // Add a class to the document body when using fluid header
  useEffect(() => {
    if (shouldHaveFluidHeader) {
      document.body.classList.add('has-fluid-header');
    } else {
      document.body.classList.remove('has-fluid-header');
    }

    return () => {
      document.body.classList.remove('has-fluid-header');
    };
  }, [shouldHaveFluidHeader]);

  return (
    <>
      {/* Client-only scroll handler for fluid header */}
      {shouldHaveFluidHeader && (
        <ClientOnly>
          {() => (
            <FluidHeaderScrollHandler onScroll={setIsScrolled} />
          )}
        </ClientOnly>
      )}
      
      {sticky === 'onScrollUp' ? (
        <ForwardedHeaderAnimation
          className={headerClassName}
          ref={ref}
        >
          {props.children}
        </ForwardedHeaderAnimation>
      ) : (
        <header className={headerClassName} ref={ref}>{props.children}</header>
      )}

      <HeaderHeightCssVars />
    </>
  );
}

const ForwardedHeaderWrapper = React.forwardRef(HeaderWrapper);

function HeaderAnimation(props: {
  children: React.ReactNode;
  className: string;
}, ref: React.Ref<HTMLElement>) {
  const { pathname } = useLocation();
  const [activeVariant, setActiveVariant] = useState<
    'hidden' | 'initial' | 'visible'
  >('initial');
  const desktopHeaderHeight = useHeaderHeigth()?.desktopHeaderHeight || 0;
  const { scrollYBoundedProgress } = useBoundedScroll(250);
  const scrollYBoundedProgressDelayed = useTransform(
    scrollYBoundedProgress,
    [0, 0.75, 1],
    [0, 0, 1],
  );

  useEffect(() => {
    // Reset the header position on route change
    setActiveVariant('initial');
  }, [pathname]);

  useMotionValueEvent(scrollYBoundedProgressDelayed, 'change', (latest) => {
    if (latest === 0) {
      setActiveVariant('visible');
    } else if (latest > 0.5) {
      setActiveVariant('hidden');
    } else {
      setActiveVariant('visible');
    }

    const newDesktopHeaderHeight = transform(
      latest,
      [0, 1],
      [`${desktopHeaderHeight}px`, '0px'],
    );

    // Reassign header height css var on scroll
    document.documentElement.style.setProperty(
      '--desktopHeaderHeight',
      newDesktopHeaderHeight,
    );
  });

  const variants: Variants = {
    hidden: {
      transform: 'translateY(-100%)',
    },
    initial: {
      transform: 'translateY(0)',
      transition: {
        duration: 0,
      },
    },
    visible: {
      transform: 'translateY(0)',
    },
  };

  return (
    <m.header
      animate={activeVariant}
      className={cn(props.className)}
      initial="visible"
      ref={ref}
      transition={{
        duration: 0.2,
      }}
      variants={variants}
    >
      {props.children}
    </m.header>
  );
}

const ForwardedHeaderAnimation = React.forwardRef(HeaderAnimation);

function HeaderHeightCssVars() {
  const desktopHeaderHeight = useHeaderHeigth()?.desktopHeaderHeight || 0;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { --desktopHeaderHeight: ${desktopHeaderHeight}px; }`,
      }}
    />
  );
}

function useHeaderHeigth() {
  const { sanityRoot } = useRootLoaderData();
  const data = sanityRoot?.data;
  const headerPadding = {
    bottom: data?.header?.padding?.bottom || 0,
    top: data?.header?.padding?.top || 0,
  };
  const desktopLogoWidth = data?.header?.desktopLogoWidth || 1;
  const headerBorder = data?.header?.showSeparatorLine ? 1 : 0;
  const sanitySettings = data?.settings;
  const logo = sanitySettings?.logo;
  const width = logo?._ref ? getImageDimensions(logo._ref).width : 0;
  const height = logo?._ref ? getImageDimensions(logo._ref).height : 0;
  const desktopLogoHeight =
    logo?._ref && width && height ? (desktopLogoWidth * height) / width : 44;

  const desktopHeaderHeight = (
    desktopLogoHeight +
    headerPadding.top +
    headerPadding.bottom +
    headerBorder
  ).toFixed(2);

  return { desktopHeaderHeight };
}


function PredictiveSearchItem({ 
  closeMobileNav, 
  onSearchOpenChange
}: { 
  closeMobileNav: () => void;
  onSearchOpenChange?: (open: boolean) => void;
}) {
  const predictiveSearchRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);  

  const handleToggleSearch = () => {
    const newOpenState = !open;
    setOpen(newOpenState);
    if (onSearchOpenChange) {
      onSearchOpenChange(newOpenState);
    }
    if (newOpenState) {
      closeMobileNav(); // Close the mobile nav when search opens
    }
  };

  return (
    <>
      <IconButton asChild>
        <button onClick={handleToggleSearch}>
          <IconSearch className="md:size-6 size-5" />
        </button>
      </IconButton>
      {open && (
        <div
          className={
            'fixed w-full left-0 bg-background z-50 px-0 lg:px-gutter shadow-sm'
          }
          style={{
            // Attach directly to the bottom of the header with no gap
            top: 'var(--desktopHeaderHeight)',
            // Make sure it stays attached to header during animations/transitions
            position: 'fixed'
          }}
        >
          <PredictiveSearchForm>
          {({ fetchResults, inputRef }) => (
            <>
              <div className={'container flex w-full h-nav items-center'}>
                <Button
                  variant={'ghost'}
                  className={'outline-offset-0 hover:bg-transparent'}
                  onClick={() => {
                    setOpen(false);
                    if (onSearchOpenChange) {
                      onSearchOpenChange(false);
                    }
                  }}
                >
                  <IconClose />
                </Button>
                &nbsp;
                <input
                  autoComplete="off"
                  autoFocus
                  onKeyDown={(event) => {
                    if (event.key === 'Enter')
                      window.location.href = inputRef?.current?.value
                        ? `/search?q=${inputRef.current?.value}`
                        : `/search`;
                  }}
                  name="q"
                  onChange={fetchResults}
                  onFocus={fetchResults}
                  placeholder="Search"
                  ref={inputRef}
                  type="search"
                  className={'flex-1 h-10 px-2 border rounded-sm'}
                />
                &nbsp;
                <Button
                  variant={'ghost'}
                  className={'outline-offset-0'}
                  onClick={() => {
                    window.location.href = inputRef?.current?.value
                      ? `/search?q=${inputRef.current.value}`
                      : `/search`;
                  }}
                >
                  Search
                </Button>
              </div>
              {inputRef?.current && inputRef.current.value !== '' && (
                <div
                  className={
                    'h-screen-no-nav overflow-auto hiddenScroll'
                  }
                >
                  <div
                    ref={predictiveSearchRef}
                    className={'container'}
                  >
                    <PredictiveSearchResults />
                  </div>
                </div>
              )}
            </>
          )}
        </PredictiveSearchForm>
      </div>
      )}
    </>
  );
}
