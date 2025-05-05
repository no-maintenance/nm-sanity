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
import { IconGlobe } from '~/components/icons/icon-globe';
import { IconSearch } from '~/components/icons/icon-search';
import { PredictiveSearchResults } from '~/components/search';
import { PredictiveSearchForm } from '~/components/search';
import { IconClose } from '~/components/icons/icon-close';

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
    <div className="flex items-center">
      {showCountrySelectorIcon && <CountrySelectorDrawer />}
      {showSearchIcon && <PredictiveSearchItem closeMobileNav={closeMobileNav} />}
      <AccountLink className="focus:ring-primary/5 relative flex items-center justify-center" />
      <CartDrawer />
    </div>
  );

  return (
    <ForwardedHeaderWrapper ref={headerRef}>
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

function CountrySelectorDrawer() {
  return (
    <IconButton asChild>
      <button>
        <IconGlobe
          className={'cursor-pointer'}
          fill={'transparent'}
          width={'100%'}
          height={'100%'}
          viewBox={'0 0 24 24'}
        />
      </button>
    </IconButton>
  );
}
function AccountLink({ className }: { className?: string }) {
  return (
    <IconButton asChild>
      <Link className={className} to="/account">
        <IconAccount className="size-6" />
      </Link>
    </IconButton>
  );
}

function SearchDrawer() {
  return (
    <IconButton asChild>
      <button>
        <IconSearch className="size-6" />
      </button>
    </IconButton>
  );
}

function HeaderWrapper(props: { children: React.ReactNode }, ref: React.Ref<HTMLElement>) {
  const { sanityRoot } = useRootLoaderData();
  const data = sanityRoot?.data;
  const header = data?.header;
  const showSeparatorLine = header?.showSeparatorLine;
  const blur = header?.blur;
  const sticky = stegaClean(header?.sticky);

  const headerClassName = cx([
    'section-padding bg-background text-foreground pointer-events-auto',
    sticky !== 'none' && 'sticky top-0 z-50',
    blur &&
    'bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/85',
    headerVariants({
      optional: showSeparatorLine ? 'separator-line' : null,
    }),
  ]);

  return (
    <>
      {sticky === 'onScrollUp' ? (
        <HeaderAnimation className={headerClassName} ref={ref}>
          {props.children}
        </HeaderAnimation>
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


function PredictiveSearchItem({ closeMobileNav }: { closeMobileNav: () => void }) {
  const predictiveSearchRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);  

  const handleOpenSearch = () => {
    setOpen(true);
    closeMobileNav(); // Close the mobile nav when search opens
  };

  return (
    <>
      <IconButton  asChild>
        <button onClick={handleOpenSearch}>
          <IconSearch className="size-6" />
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
              <div className={'flex w-full h-nav items-center'}>
                <Button
                  variant={'ghost'}
                  className={'outline-offset-0 hover:bg-transparent'}
                  onClick={() =>
                    setOpen(false)
                  }
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
                  className={'flex-1 h-10 px-2'}
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
                    className={'px-gutter lg:px-0'}
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
