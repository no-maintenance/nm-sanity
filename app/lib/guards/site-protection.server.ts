import {redirect} from '@shopify/remix-oxygen';

/**
 * Protection configuration from Sanity
 */
interface ProtectionConfig {
  _id?: string;
  name?: string;
  enabled?: boolean;
  accessMode?: 'password' | 'countdown' | 'both' | 'either';
  password?: string;
  countdown?: string;
  redirectPage?: {
    _ref?: string;
    _type?: string;
  };
}

/**
 * Context for what is being protected
 */
interface ProtectionContext {
  type: 'site' | 'collection' | 'product';
  collectionHandle?: string;
  productHandle?: string;
}

/**
 * Session scope tracking for granular authentication
 */
interface AuthenticationScope {
  global?: boolean;
  collections?: string[];
}

/**
 * Detect what type of content is being accessed from the URL
 */
function detectProtectionContext(url: URL): ProtectionContext {
  const pathname = url.pathname;

  // Check for collection routes
  const collectionMatch = pathname.match(/^\/collections\/([^\/]+)/);
  if (collectionMatch) {
    return {
      type: 'collection',
      collectionHandle: collectionMatch[1],
    };
  }

  // Check for product routes
  const productMatch = pathname.match(/^\/products\/([^\/]+)/);
  if (productMatch) {
    return {
      type: 'product',
      productHandle: productMatch[1],
    };
  }

  // Default to site-level
  return {
    type: 'site',
  };
}

/**
 * Check if user is authenticated for a specific protection config
 */
function checkProtectionAccess(
  protection: ProtectionConfig,
  hasPasswordAuth: boolean,
  countdownExpired: boolean,
): boolean {
  if (!protection?.enabled) {
    return true;
  }

  switch (protection.accessMode) {
    case 'password':
      return hasPasswordAuth;
    case 'countdown':
      return countdownExpired;
    case 'both':
      return hasPasswordAuth && countdownExpired;
    case 'either':
      return hasPasswordAuth || countdownExpired;
    default:
      return false;
  }
}

/**
 * Check if countdown has expired for a protection config
 */
function isCountdownExpired(countdown?: string): boolean {
  if (!countdown) return false;
  const countdownDate = new Date(countdown);
  const now = new Date();
  return now >= countdownDate;
}

/**
 * Check if the site is protected and redirect if necessary
 * This should be called in every route loader that needs protection
 */
export async function requireUnprotectedAccess(
  context: any,
  request: Request,
): Promise<void> {
  const url = new URL(request.url);

  // Exempt routes that should always be accessible
  const exemptPaths = [
    '/cms',
    '/site-protected',
    '/api',
    '/robots.txt',
    '/sitemap.xml',
    '/_assets',
    '/favicon',
  ];

  // Check if current path is exempt
  const isExempt = exemptPaths.some(path =>
    url.pathname.startsWith(path) || url.pathname === path
  );

  if (isExempt) {
    return;
  }

  // Get protection settings from Sanity
  const {sanity, passwordSession} = context;

  // Query for just the protection settings
  const PROTECTION_SETTINGS_QUERY = `*[_type == "settings"][0]{
    siteProtection
  }`;

  const {data} = await sanity.loadQuery(
    PROTECTION_SETTINGS_QUERY,
    {},
  ) as {data: {siteProtection?: SiteProtection}};

  const protection = data?.siteProtection;

  // If protection is not enabled, allow access
  if (!protection?.enabled) {
    return;
  }

  // Check if user has password authentication
  const hasPasswordAuth = passwordSession.isAuthenticated();

  // Check if countdown has expired
  let countdownExpired = false;
  if (protection.countdown) {
    const countdownDate = new Date(protection.countdown);
    const now = new Date();
    countdownExpired = now >= countdownDate;
  }

  // Determine access based on mode
  let hasAccess = false;

  switch (protection.accessMode) {
    case 'password':
      // Password only - must have password auth
      hasAccess = hasPasswordAuth;
      break;

    case 'countdown':
      // Countdown only - countdown must be expired
      hasAccess = countdownExpired;
      break;

    case 'both':
      // Both required - must have both password AND countdown expired
      hasAccess = hasPasswordAuth && countdownExpired;
      break;

    case 'either':
      // Either one - password OR countdown expired
      hasAccess = hasPasswordAuth || countdownExpired;
      break;

    default:
      // Default to no access if mode is not set
      hasAccess = false;
  }

  // If no access, redirect to protected page with return URL
  if (!hasAccess) {
    const redirectUrl = `/site-protected?redirectTo=${encodeURIComponent(
      url.pathname + url.search
    )}`;

    throw redirect(redirectUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}