import {useRootLoaderData} from '~/root';
import {useLocation} from '@remix-run/react';
import {stegaClean} from '@sanity/client/stega';

/**
 * Returns whether the fluid header should be enabled for the current page.
 * This matches the logic in the header component.
 */
export function useShouldHaveFluidHeader(): boolean {
  const {sanityRoot} = useRootLoaderData();
  const data = sanityRoot?.data;
  const header = data?.header;
  const {pathname} = useLocation();

  const enableFluidHeader = stegaClean(header?.enableFluidHeader) || false;
  const fluidHeaderOnHomePage = stegaClean(header?.fluidHeaderOnHomePage) || false;
  const isHomePage = pathname === '/';

  return Boolean(enableFluidHeader && (isHomePage && fluidHeaderOnHomePage));
} 