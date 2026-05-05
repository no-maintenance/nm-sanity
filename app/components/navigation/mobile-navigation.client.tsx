import {useCallback, useState} from 'react';
import {cn} from '~/lib/utils';
import {SanityExternalLink} from '../sanity/link/sanity-external-link';
import {SanityInternalLink} from '../sanity/link/sanity-internal-link';
import {IconChevron} from '../icons/icon-chevron';
import Hamburger from '~/components/hamburger';
import * as Dialog from '@radix-ui/react-dialog';
import {m, AnimatePresence} from 'motion/react';
import {useRootLoaderData} from '~/root';
import {stegaClean} from '@sanity/client/stega';
import type {RefObject, CSSProperties} from 'react';
import type {NavigationProps} from './desktop-navigation';
import type {SanityNestedNavigationProps} from './nested-navigation';

const mobileMenuLinkClass = cn(
  'inline-flex items-center text-[length:var(--nav-font-size,2.25rem)] md:text-[length:var(--nav-font-size,3rem)] font-medium transition-colors uppercase',
  'focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0',
  'animated-underline'
);

function isSaleItem(name: string | null | undefined): boolean {
  return name?.toLowerCase().trim() === 'sale';
}

interface MobileNavigationProps {
  data?: NavigationProps;
  headerRef: RefObject<HTMLElement>;
  navFontSize?: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export function MobileNavigation({data, headerRef, navFontSize, open = false, setOpen}: MobileNavigationProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use either the props or internal state
  const isOpen = typeof open === 'boolean' ? open : internalOpen;
  const setIsOpen = setOpen || setInternalOpen;
  
  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  const {sanityRoot} = useRootLoaderData();
  const showHamburgerMenuOnDesktop = stegaClean(sanityRoot?.data?.header?.showHamburgerMenuOnDesktop);


  const avoidDefaultDomBehavior = (e: Event) => {
    e.preventDefault();
  };

  return (
    <div className={cn(
      "block",
      !showHamburgerMenuOnDesktop && "lg:hidden"
    )}>
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button className="p-0 focus:outline-none focus-visible:outline-none">
            <div className="origin-center sm:scale-100 scale-80">
              <Hamburger
                size={21}
                distance="lg"
                label="main menu"
                toggled={isOpen}
              />
            </div>
          </button>
        </Dialog.Trigger>
        
        <AnimatePresence>
          {isOpen && (
            <Dialog.Portal forceMount>
              <div className="fixed inset-0 z-40">
                <div className="fixed inset-x-0 top-0 h-[calc(var(--desktopHeaderHeight)+var(--announcement-bar-height,0px))] bg-transparent pointer-events-none" />
                <Dialog.Overlay asChild>
                  <m.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    exit={{opacity: 0}}
                    className="fixed inset-x-0 bottom-0 bg-background pointer-events-auto sm:top-[calc(var(--desktopHeaderHeight)+var(--announcement-bar-height,0px))]  sm:h-[calc(100dvh-var(--desktopHeaderHeight)-var(--announcement-bar-height,0px))] h-[calc(100dvh-var(--desktopHeaderHeight)-var(--announcement-bar-height,0px)+7px)]"
                  >
                    <div className="flex h-full flex-col">
                      <div className="">
                        <Dialog.Close asChild>
                          <button className={cn(
                            "p-0 focus:outline-none focus-visible:outline-none",
                            showHamburgerMenuOnDesktop ? "lg:hidden" : "block"
                          )}>
                            <div className="origin-center">
                            
                            </div>
                          </button>
                        </Dialog.Close>
                      </div>
                      <Dialog.Content
                       onPointerDownOutside={avoidDefaultDomBehavior}
                       onInteractOutside={avoidDefaultDomBehavior}
                      className="flex-1 overflow-y-auto px-6">
                        <nav
                          className=" mx-8 md:mx-24 sm:mx-16 mt-16"
                          style={navFontSize ? {'--nav-font-size': navFontSize} as CSSProperties : undefined}
                        >
                          <ul className="flex flex-col space-y-4 xl:space-y-6">
                            {data?.map((item) => (
                              <li key={item._key}>
                                {item._type === 'internalLink' && (
                                  <SanityInternalLink
                                    className={cn(
                                      mobileMenuLinkClass,
                                      isSaleItem(item.name) && 'text-red-500'
                                    )}
                                    data={item}
                                    onClick={handleClose}
                                  />
                                )}
                                {item._type === 'externalLink' && (
                                  <SanityExternalLink 
                                    className={cn(
                                      mobileMenuLinkClass,
                                      isSaleItem(item.name) && 'text-red-500'
                                    )}
                                    data={item} 
                                  />
                                )}
                                {item._type === 'nestedNavigation' && (
                                  <MobileNavigationNested 
                                    data={item} 
                                    onClose={handleClose}
                                  />
                                )}
                              </li>
                            ))}
                          </ul>
                        </nav>
                      </Dialog.Content>
                    </div>
                  </m.div>
                </Dialog.Overlay>
              </div>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

function MobileNavigationNested(props: {
  data?: SanityNestedNavigationProps;
  onClose: () => void;
}) {
  const {data, onClose} = props;
  const [open, setOpen] = useState(false);

  if (!data) return null;

  const {childLinks} = data;

  return data.name && childLinks && childLinks.length > 0 ? (
    <button 
      onClick={() => setOpen(!open)}
      className={cn(
        mobileMenuLinkClass,
        "justify-between",
        isSaleItem(data.name) && 'text-red-500'
      )}
    >
      {data.name}
      <IconChevron 
        className={cn("size-5 transition-transform", open && "rotate-90")} 
        direction="right" 
      />
      {open && (
        <ul className="mt-2 ml-4 space-y-4">
          {childLinks.map((child) => (
            <li key={child._key}>
              {child._type === 'internalLink' ? (
                <SanityInternalLink
                  className={cn(
                    mobileMenuLinkClass,
                    isSaleItem(child.name) && 'text-red-500'
                  )}
                  data={child}
                  onClick={onClose}
                />
              ) : child._type === 'externalLink' ? (
                <SanityExternalLink
                  className={cn(
                    mobileMenuLinkClass,
                    isSaleItem(child.name) && 'text-red-500'
                  )}
                  data={child}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </button>
  ) : data.link && data.name && (!childLinks || childLinks.length === 0) ? (
    <SanityInternalLink
      className={cn(
        mobileMenuLinkClass,
        isSaleItem(data.name) && 'text-red-500'
      )}
      data={{
        _key: data._key,
        _type: 'internalLink',
        anchor: null,
        link: data.link,
        name: data.name,
      }}
      onClick={onClose}
    >
      {data.name}
    </SanityInternalLink>
  ) : null;
}
