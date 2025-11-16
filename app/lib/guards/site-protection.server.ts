import {redirect} from '@shopify/remix-oxygen';
import {determineProtectionState, type ProtectionConfig as StateProtectionConfig} from '../site-protection-states';

/**
 * Protection configuration from Sanity
 * Using the extended interface from state management
 */
type ProtectionConfig = StateProtectionConfig;

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

  // Check if site protection is bypassed via environment variable
  const bypassProtection = context.env?.BYPASS_SITE_PROTECTION === 'true';
  if (bypassProtection) {
    return;
  }

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

  // Detect what type of content is being accessed
  const protectionContext = detectProtectionContext(url);

  // Get context services
  const {sanity, passwordSession} = context;

  // Query for protection configurations based on context
  let query = '';
  let queryParams = {};

  switch (protectionContext.type) {
    case 'collection':
      // Query collection-specific protection + global protection
      query = `{
        "collectionProtection": *[_type == "collection" && store.slug.current == $collectionHandle][0]{
          protectionConfig->{
            _id,
            name,
            enabled,
            accessMode,
            password,
            countdown,
            redirectPage,
            puzzleGrantsAccess
          }
        }.protectionConfig,
        "globalProtection": *[_type == "settings"][0]{
          siteProtection->{
            _id,
            name,
            enabled,
            accessMode,
            password,
            countdown,
            redirectPage,
            puzzleGrantsAccess
          }
        }.siteProtection
      }`;
      queryParams = { collectionHandle: protectionContext.collectionHandle };
      break;

    case 'product':
      // Query product's collection protection + global protection
      query = `{
        "productCollectionProtection": *[_type == "product" && store.slug.current == $productHandle][0]{
          "collection": store.collections[0]{
            "protectionConfig": *[_type == "collection" && store.gid == ^.gid][0].protectionConfig->{
              _id,
              name,
              enabled,
              accessMode,
              password,
              countdown,
              redirectPage,
              puzzleGrantsAccess
            }
          }
        }.collection.protectionConfig,
        "globalProtection": *[_type == "settings"][0]{
          siteProtection->{
            _id,
            name,
            enabled,
            accessMode,
            password,
            countdown,
            redirectPage,
            puzzleGrantsAccess
          }
        }.siteProtection
      }`;
      queryParams = { productHandle: protectionContext.productHandle };
      break;

    default:
      // Query only global protection for site-level access
      query = `*[_type == "settings"][0]{
        "globalProtection": siteProtection->{
          _id,
          name,
          enabled,
          accessMode,
          password,
          countdown,
          redirectPage,
          puzzleGrantsAccess
        }
      }`;
  }

  const {data} = await sanity.loadQuery(query, queryParams);

  // Determine which protection config to use (priority: collection → global)
  let activeProtection: ProtectionConfig | null = null;
  let protectionSource: 'collection' | 'global' | 'none' = 'none';

  if (protectionContext.type === 'collection' && data?.collectionProtection) {
    activeProtection = data.collectionProtection;
    protectionSource = 'collection';
  } else if (protectionContext.type === 'product' && data?.productCollectionProtection) {
    activeProtection = data.productCollectionProtection;
    protectionSource = 'collection';
  } else if (data?.globalProtection) {
    activeProtection = data.globalProtection;
    protectionSource = 'global';
  }

  // If no protection is configured, allow access
  if (!activeProtection) {
    return;
  }

  // If protection is explicitly disabled, allow access
  // Note: undefined/missing enabled field is treated as enabled (matches schema initialValue)
  if (activeProtection.enabled === false) {
    return;
  }

  // Check if user has password authentication for this specific protection
  let hasPasswordAuth = false;

  if (protectionSource === 'collection' && activeProtection?._id) {
    // Check collection-specific authentication
    hasPasswordAuth = passwordSession.isAuthenticatedFor(activeProtection._id);
  } else if (protectionSource === 'global') {
    // Check global authentication (backward compatibility)
    hasPasswordAuth = passwordSession.isGloballyAuthenticated();
  }

  // Check if countdown has expired
  const countdownExpired = isCountdownExpired(activeProtection.countdown);

  // Determine the current protection state using the new state management system
  const hasPuzzleAccess = activeProtection?._id
    ? passwordSession.hasPuzzleCompletionFor(activeProtection._id)
    : false;

  const protectionState = determineProtectionState(
    activeProtection,
    hasPasswordAuth,
    countdownExpired,
    hasPuzzleAccess
  );

  // If not fully unlocked, redirect to protected page with context info
  if (protectionState.viewState !== 'fully-unlocked') {
    // Persist attempted path so the protection page doesn't need query params
    passwordSession.setPendingRedirect(url.pathname + url.search);

    const searchParams = new URLSearchParams();

    // Add context information for the protection page
    if (protectionSource === 'collection') {
      searchParams.set('context', 'collection');
      if (protectionContext.collectionHandle) {
        searchParams.set('collection', protectionContext.collectionHandle);
      }
    } else if (protectionContext.type === 'product') {
      searchParams.set('context', 'product');
      if (protectionContext.productHandle) {
        searchParams.set('product', protectionContext.productHandle);
      }
    }

    const queryString = searchParams.toString();
    const redirectUrl = queryString ? `/site-protected?${queryString}` : '/site-protected';

    throw redirect(redirectUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Set-Cookie': await passwordSession.commit(),
      },
    });
  }
}
