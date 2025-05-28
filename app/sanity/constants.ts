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

export const EMAILJS_CONTACT_TEMPLATE_ID = 'template_0jee2h8';
export const EMAILJS_APPOINTMENT_TEMPLATE_ID = 'template_q2yw635';
export const EMAILJS_SERVICE_ID = 'service_q8ej60l';

export const EMAILJS_PUBKEY = 'hi4FCFs4Sq1Wj6URH';
