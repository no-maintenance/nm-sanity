export const SANITY_API_VERSION = '2023-03-20';
export const SANITY_STUDIO_PREVIEW_URL = '/sanity-preview';
export const SANITY_STUDIO_URL = '/cms';


export const PAGINATION_SIZE = 12;
export const DEFAULT_GRID_IMG_LOAD_EAGER_COUNT = 3;
export const ATTR_LOADING_EAGER = 'eager';
export const ATTR_LOADING_LAZY = 'lazy';
export function getImageLoadingPriority(
  index: number,
  maxEagerLoadCount = DEFAULT_GRID_IMG_LOAD_EAGER_COUNT,
) {
  return index < maxEagerLoadCount ? ATTR_LOADING_EAGER : undefined;
}

export const KLAVIYO_BASE_URL = 'https://a.klaviyo.com';
export const KLAVIYO_COMPANY_ID = 'RDT3xD';
export const KLAVIYO_LIST_ID = 'Wimtnj'; // TODO: Make this dynamic