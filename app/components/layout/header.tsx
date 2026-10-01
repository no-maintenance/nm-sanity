import type { Variants } from 'motion/react';
import type { CSSProperties } from 'react';

import { Await, Link, useLocation } from '@remix-run/react';
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

import Hamburger from '~/components/hamburger';
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

// Client-only component: makes the fluid header scroll up *with* the page
// (following the announcement banner) and ease onto the very top once the
// banner has scrolled away — a smooth transition instead of a snap. It keeps a
// `--fluid-header-top` CSS var in sync = max(0, bannerHeight - scrollY).
function FluidHeaderScrollHandler() {
  useEffect(() => {
    let raf = 0;
    const root = document.documentElement;
    const update = () => {
      raf = 0;
      // Let CSS resolve the (live) banner height so this self-corrects once the
      // banner measures itself; JS only injects the current scroll offset. The
      // header follows the page up and clamps at the very top (max 0).
      // The header box sits flush against the banner (no gap) so an opaque
      // header never reveals a sliver of page below the banner. The lowered
      // "down" look is achieved with top padding on the content, not a top gap.
      root.style.setProperty(
        '--fluid-header-top',
        `max(0px, calc(var(--announcement-bar-height, 2rem) - ${window.scrollY}px))`,
      );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      root.style.removeProperty('--fluid-header-top');
    };
  }, []);

  return null;
}

export function Header() {
  const { sanityRoot } = useRootLoaderData();
  const data = sanityRoot?.data;
  const header = data?.header;
  const logoWidth = header?.desktopLogoWidth
    ? `${header?.desktopLogoWidth}px`
    : undefined;
  const navFontSize = header?.navFontSize
    ? `${header.navFontSize}px`
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

  // Keep --header-height in sync with the actual rendered header so sticky
  // elements below it (e.g. mobile category bar) sit flush against it.
  useEffect(() => {
    const node = headerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const setVar = () => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${node.getBoundingClientRect().height}px`,
      );
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // State for mobile navigation
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // State for search open
  const [searchOpen, setSearchOpen] = useState(false);
  // State for cart drawer
  const [cartOpen, setCartOpen] = useState(false);

  // Function to close mobile navigation
  const closeMobileNav = useCallback(() => {
    if (mobileNavOpen) {
      setMobileNavOpen(false);
    }
  }, [mobileNavOpen]);

  // Handle mobile navigation state changes
  const handleMobileNavOpenChange = useCallback((open: boolean) => {
    setMobileNavOpen(open);
    if (open) {
      // Close cart when mobile nav opens
      setCartOpen(false);
    }
  }, []);

  // Handle cart state changes
  const handleCartOpenChange = useCallback((open: boolean) => {
    setCartOpen(open);
    if (open) {
      // Close mobile nav when cart opens
      setMobileNavOpen(false);
    }
  }, []);

  const NavigationComponent = (
    <div>
      {!showHamburgerMenuOnDesktop && (
        <div className="touch:hidden lg:block">
          <DesktopNavigation data={header?.menu} />
        </div>
      )}
      <div className={cn(
        "touch:block",
        !showHamburgerMenuOnDesktop && "lg:hidden",
      )}>
        <ClientOnly
          fallback={
            // Server-rendered static hamburger so the header is complete on first
            // paint (no flash / logo re-center when the client-only nav hydrates).
            // Matches the real trigger's button + scaled Hamburger below.
            <button
              aria-label="main menu"
              className="p-0 focus:outline-none focus-visible:outline-none"
              type="button"
            >
              <div className="origin-center scale-80 sm:scale-100">
                <Hamburger
                  distance="lg"
                  label="main menu"
                  size={21}
                  toggled={false}
                />
              </div>
            </button>
          }
        >
          {() => (
            <Suspense>
              <MobileNavigation
                data={header?.menu}
                headerRef={headerRef}
                navFontSize={navFontSize}
                open={mobileNavOpen}
                setOpen={handleMobileNavOpenChange}
              />
            </Suspense>
          )}
        </ClientOnly>
      </div>
      <div className="hidden sm:hidden">
        {showSearchIcon && (
          <PredictiveSearchItem
            closeMobileNav={closeMobileNav}
            onSearchOpenChange={setSearchOpen}
          />
        )}
      </div>
    </div>
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
    <div className="flex items-center gap-1 md:gap-2">
      <div className="hidden sm:block">
        {showCountrySelectorIcon && <CountrySelector isIcon={true} />}
      </div>
      {showSearchIcon && (
        <PredictiveSearchItem
          closeMobileNav={closeMobileNav}
          onSearchOpenChange={setSearchOpen}
        />
      )}
      <AccountLink className="focus:ring-primary/5 relative flex items-center justify-center" />
      <CartDrawer
        cartOpen={cartOpen}
        onCartOpenChange={handleCartOpenChange}
      />
    </div>
  );

  return (
    <ForwardedHeaderWrapper ref={headerRef} mobileNavOpen={mobileNavOpen} searchOpen={searchOpen} cartOpen={cartOpen}>
      <style dangerouslySetInnerHTML={{ __html: colorsCssVars }} />
      <div className="container">
        {logoPosition === 'center' ? (
          <>
            {/* Mobile: 3-column flex preserves spacing between logo and icons */}
            <div className="sm:hidden flex items-center justify-between gap-3">
              <div className="flex items-center shrink-0">
                {NavigationComponent}
              </div>
              <div className="flex flex-1 items-center justify-center min-w-0 px-2">
                {LogoComponent}
              </div>
              <div className="flex items-center shrink-0 gap-2">
                {Icons}
              </div>
            </div>
            {/* Desktop: absolute centering keeps the logo truly centered to the viewport */}
            <div className="hidden sm:flex items-center relative gap-4 justify-between">
              <div className="flex items-center gap-4">
                {NavigationComponent}
              </div>
              <div className="absolute left-1/2 -translate-x-1/2">
                {LogoComponent}
              </div>
              <div className="flex items-center gap-2">
                {Icons}
              </div>
            </div>
          </>
        ) : (
          <div className={cn(
            "flex items-center relative gap-4",
            logoPosition === 'left' && "justify-between",
            logoPosition === 'right' && "flex-row-reverse justify-between"
          )}>
            <div className="flex items-center gap-4">
              {NavigationComponent}
              {logoPosition === 'left' && LogoComponent}
            </div>
            {logoPosition === 'right' && LogoComponent}
            {Icons}
          </div>
        )}
      </div>
    </ForwardedHeaderWrapper>
  );
}

function AccountIconLink({ className, to }: { className?: string; to: string }) {
  return (
    <IconButton asChild>
      <Link className={className} to={to}>
        <IconAccount className="md:size-6 size-5" />
      </Link>
    </IconButton>
  );
}

function AccountLink({ className }: { className?: string }) {
  const { isLoggedIn } = useRootLoaderData() ?? {};
  // Logged-in customers go to their account dashboard; everyone else lands on
  // the branded account page (LOGIN + CREATE ACCOUNT). Default to the login page
  // until the promise resolves.
  const signedOut = <AccountIconLink className={className} to="/account/login" />;

  return (
    <Suspense fallback={signedOut}>
      <Await errorElement={signedOut} resolve={isLoggedIn}>
        {(loggedIn) => (
          <AccountIconLink className={className} to={loggedIn ? '/account' : '/account/login'} />
        )}
      </Await>
    </Suspense>
  );
}


function HeaderWrapper(props: {
  children: React.ReactNode;
  mobileNavOpen?: boolean;
  searchOpen?: boolean;
  cartOpen?: boolean;
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
  // Homepage always uses the fluid (transparent, adaptive, overlaying the hero)
  // header. Kept independent of CMS flags so it can't flip off.
  const shouldHaveFluidHeader = isHomePage;

  // Mobile nav state, search state, and cart state
  const { mobileNavOpen = false, searchOpen = false, cartOpen = false } = props;

  // Generate text color class for transparent header
  const fluidTextColorClass =
    fluidHeaderTextColor === 'white' ? 'text-white' :
      fluidHeaderTextColor === 'black' ? 'text-black' :
        'text-foreground';

  // Fluid header stays transparent/adaptive while scrolling; only opening a
  // panel (nav / search / cart) forces the solid state for readability.
  const isSolidState = mobileNavOpen || searchOpen || cartOpen;

  const headerClassName = cx([
    'section-padding pointer-events-auto  w-full',
    // Position: fluid header is fixed and sits flush below the announcement
    // banner, then follows the page up and eases onto the very top once the
    // banner has scrolled away (smooth, never overlaps the banner). The 2rem
    // fallback matches the measured single-line banner height so the box sits
    // flush even before JS/hydration — no load shift, and no gap for an opaque
    // header to reveal when the menu/search/cart opens.
    shouldHaveFluidHeader
      ? 'fixed left-0 right-0 z-40 top-[var(--fluid-header-top,var(--announcement-bar-height,2rem))]'
      : (sticky !== 'none' ? 'sticky top-0 z-40' : ''),

    // Vertical padding for the fluid header: extra top padding drops the
    // logo/icons into the lowered "down" position while the header box itself
    // stays flush with the banner (so there's never a gap sliver). Overrides
    // section-padding's top/bottom only.
    shouldHaveFluidHeader && '!pt-3.5 !pb-1.5 sm:!pt-3.5 sm:!pb-1.5',

    // Apply fluid header styles
    shouldHaveFluidHeader ? (
      isSolidState
        ? 'bg-background text-foreground'
        : // Transparent overlay: logo/icons stay consistently white (no invert /
          // no sharp color change). A soft shadow (see .fluid-header-legible)
          // keeps them readable over both dark and light areas behind them.
          'bg-transparent text-white fluid-header-legible'
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
            <FluidHeaderScrollHandler />
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
  const [popupTop, setPopupTop] = useState<number | null>(null);

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

  useEffect(() => {
    if (!open) return;
    const headerEl = document.querySelector('header');
    if (!headerEl) return;
    const update = () => {
      setPopupTop(headerEl.getBoundingClientRect().bottom);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, {passive: true});
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [open]);

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
            'fixed w-full left-0 bg-background z-40 px-0 lg:px-gutter shadow-sm'
          }
          style={{
            // Anchor to the actual rendered bottom of the header so there is no gap
            top: popupTop !== null
              ? `${popupTop}px`
              : 'calc(var(--announcement-bar-height, 0px) + var(--desktopHeaderHeight))',
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
                    placeholder="SEARCH"
                    ref={inputRef}
                    type="search"
                    /* Matches the ADD TO CART button's type: 12px / 600 /
                       uppercase (tracking is already 1px via inheritance).
                       The size comes from the `input#header-search` rule in
                       tailwind.css — the global `input { font-size: 16px
                       !important }` Safari-zoom guard outranks a utility
                       class, so per-input sizes are set there (same pattern as
                       the footer and FW26 newsletter inputs). */
                    id="header-search"
                    className={
                      'flex-1 h-10 px-2 border rounded-sm font-semibold uppercase'
                    }
                  />
                  &nbsp;
                  <Button
                    // "GO" is the visible label; keep a descriptive accessible
                    // name so screen readers still announce what it does.
                    aria-label="Search"
                    variant={'ghost'}
                    className={'outline-offset-0'}
                    onClick={() => {
                      window.location.href = inputRef?.current?.value
                        ? `/search?q=${inputRef.current.value}`
                        : `/search`;
                    }}
                  >
                    GO
                  </Button>
                </div>
                {inputRef?.current && inputRef.current.value !== '' && (
                  <div
                    className={'overflow-auto hiddenScroll'}
                    style={{
                      // Bound the results to the space left below the search bar
                      // so more than one row of products can actually scroll.
                      // (The old `h-screen-no-nav` class was never defined, so the
                      // container had no height limit and overflow never engaged.)
                      maxHeight:
                        popupTop !== null
                          ? `calc(100dvh - ${popupTop}px - var(--height-nav, 4rem))`
                          : 'calc(100dvh - var(--announcement-bar-height, 0px) - var(--desktopHeaderHeight) - var(--height-nav, 4rem))',
                    }}
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
