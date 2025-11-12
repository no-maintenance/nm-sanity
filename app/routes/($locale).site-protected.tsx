import type {ActionFunctionArgs, LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {json, redirect} from '@shopify/remix-oxygen';
import {useActionData, useLoaderData} from '@remix-run/react';
import {
  determineProtectionState,
  type ProtectionConfig,
  type ProtectionContext,
  type ProtectionViewState,
} from '~/lib/site-protection-states';
import {ProtectionLayout} from '~/components/protection/ProtectionLayout';
import {LockedView} from '~/components/protection/LockedView';
import {PasswordGrantedView} from '~/components/protection/PasswordGrantedView';
import {CountdownExpiredView} from '~/components/protection/CountdownExpiredView';

interface LoaderData {
  protection?: ProtectionConfig;
  protectionContext: ProtectionContext;
  redirectTo: string;
  serverTime: string;
  locale: string;
  currentViewState: ProtectionViewState;
}

export async function loader({context, request}: LoaderFunctionArgs) {
  const {passwordSession, sanity, locale} = context;
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  // Parse protection context from URL parameters
  const contextParam = url.searchParams.get('context') || 'site';
  const collectionHandle = url.searchParams.get('collection');
  const productHandle = url.searchParams.get('product');

  const protectionContext: ProtectionContext = {
    type: contextParam as 'site' | 'collection' | 'product',
    collectionHandle: collectionHandle || undefined,
    productHandle: productHandle || undefined,
  };

  // Build query based on context
  let query = '';
  let queryParams = {};

  // Color scheme expansion for all queries
  const colorSchemeExpansion = `colorScheme-> {
    _id,
    name,
    background {
      hex,
      rgb { r, g, b }
    },
    foreground {
      hex,
      rgb { r, g, b }
    },
    primary {
      hex,
      rgb { r, g, b }
    },
    primaryForeground {
      hex,
      rgb { r, g, b }
    },
    border {
      hex,
      rgb { r, g, b }
    },
    card {
      hex,
      rgb { r, g, b }
    },
    cardForeground {
      hex,
      rgb { r, g, b }
    }
  }`;

  const protectionConfigExpansion = `{
    _id,
    name,
    enabled,
    accessMode,
    password,
    countdown,
    title,
    message,
    countdownLabel,
    passwordLabel,
    passwordGrantedTitle,
    passwordGrantedMessage,
    countdownExpiredTitle,
    countdownExpiredMessage,
    redirectPage,
    mediaType,
    backgroundImage,
    backgroundVideo {
      ...,
      asset->
    },
    overlayOpacity,
    ${colorSchemeExpansion}
  }`;

  switch (protectionContext.type) {
    case 'collection':
      query = `{
        "collection": *[_type == "collection" && store.slug.current == $collectionHandle][0]{
          "title": store.title,
          protectionConfig->${protectionConfigExpansion}
        },
        "globalProtection": *[_type == "settings"][0]{
          siteProtection->${protectionConfigExpansion}
        }.siteProtection
      }`;
      queryParams = { collectionHandle };
      break;

    case 'product':
      query = `{
        "product": *[_type == "product" && store.slug.current == $productHandle][0]{
          "title": store.title,
          "collection": store.collections[0]{
            "title": *[_type == "collection" && store.gid == ^.gid][0].store.title,
            "protectionConfig": *[_type == "collection" && store.gid == ^.gid][0].protectionConfig->${protectionConfigExpansion}
          }
        },
        "globalProtection": *[_type == "settings"][0]{
          siteProtection->${protectionConfigExpansion}
        }.siteProtection
      }`;
      queryParams = { productHandle };
      break;

    default:
      query = `*[_type == "settings"][0]{
        siteProtection->${protectionConfigExpansion}
      }`;
  }

  const {data} = await sanity.loadQuery(query, queryParams);

  // Determine active protection config and add context names
  let protection: ProtectionConfig | undefined;
  let protectionSource: 'collection' | 'global' | 'none' = 'none';

  if (protectionContext.type === 'collection' && data?.collection?.protectionConfig) {
    protection = data.collection.protectionConfig;
    protectionContext.collectionName = data.collection.title;
    protectionSource = 'collection';
  } else if (protectionContext.type === 'product' && data?.product?.collection?.protectionConfig) {
    protection = data.product.collection.protectionConfig;
    protectionContext.productName = data.product.title;
    protectionContext.collectionName = data.product.collection.title;
    protectionSource = 'collection';
  } else if (data?.globalProtection || data?.siteProtection) {
    protection = data.globalProtection || data.siteProtection;
    protectionSource = 'global';
  }

  // If protection is not enabled, redirect to intended page
  if (!protection?.enabled) {
    return redirect(redirectTo);
  }

  // Check user authentication status using granular authentication
  let hasPasswordAuth = false;
  if (protectionSource === 'collection' && protection._id) {
    hasPasswordAuth = passwordSession.isAuthenticatedFor(protection._id);
  } else if (protectionSource === 'global') {
    hasPasswordAuth = passwordSession.isGloballyAuthenticated();
  }

  const isCountdownExpired = protection.countdown
    ? new Date(protection.countdown) <= new Date()
    : false;

  // Determine the current protection state
  const protectionState = determineProtectionState(
    protection,
    hasPasswordAuth,
    isCountdownExpired
  );

  // If fully unlocked, redirect to target page
  if (protectionState.viewState === 'fully-unlocked') {
    // Get redirect page path if configured
    let targetPath = redirectTo;
    if (protection.redirectPage?._ref) {
      // Query for the page path
      const PAGE_PATH_QUERY = `*[_id == $ref][0]{
        _type,
        "slug": slug.current,
        "handle": store.slug.current
      }`;

      const {data: pageData} = await sanity.loadQuery(
        PAGE_PATH_QUERY,
        {ref: protection.redirectPage._ref},
      );

      if (pageData) {
        if (pageData._type === 'home') {
          targetPath = '/';
        } else if (pageData._type === 'page' && pageData.slug) {
          targetPath = `/pages/${pageData.slug}`;
        } else if (pageData.handle) {
          targetPath = `/${pageData.handle}`;
        }
      }
    }

    return redirect(targetPath);
  }

  return json<LoaderData>({
    protection,
    protectionContext,
    redirectTo,
    serverTime: new Date().toISOString(),
    locale: locale.language,
    currentViewState: protectionState.viewState,
  });
}

export async function action({context, request}: ActionFunctionArgs) {
  const {passwordSession, sanity} = context;
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string || '/';
  const url = new URL(request.url);

  // Parse protection context from URL parameters (same as loader)
  const contextParam = url.searchParams.get('context') || 'site';
  const collectionHandle = url.searchParams.get('collection');
  const productHandle = url.searchParams.get('product');

  // Build query based on context to get the active protection config
  let query = '';
  let queryParams = {};

  const protectionConfigExpansion = `{
    _id,
    name,
    enabled,
    accessMode,
    password,
    countdown,
    redirectPage
  }`;

  switch (contextParam) {
    case 'collection':
      query = `{
        "collection": *[_type == "collection" && store.slug.current == $collectionHandle][0]{
          protectionConfig->${protectionConfigExpansion}
        },
        "globalProtection": *[_type == "settings"][0]{
          siteProtection->${protectionConfigExpansion}
        }.siteProtection
      }`;
      queryParams = { collectionHandle };
      break;

    case 'product':
      query = `{
        "product": *[_type == "product" && store.slug.current == $productHandle][0]{
          "collection": store.collections[0]{
            "protectionConfig": *[_type == "collection" && store.gid == ^.gid][0].protectionConfig->${protectionConfigExpansion}
          }
        },
        "globalProtection": *[_type == "settings"][0]{
          siteProtection->${protectionConfigExpansion}
        }.siteProtection
      }`;
      queryParams = { productHandle };
      break;

    default:
      query = `*[_type == "settings"][0]{
        siteProtection->${protectionConfigExpansion}
      }`;
  }

  const {data} = await sanity.loadQuery(query, queryParams);

  // Determine active protection config (same priority logic as loader)
  let protection: ProtectionConfig | undefined;
  let protectionSource: 'collection' | 'global' | 'none' = 'none';

  if (contextParam === 'collection' && data?.collection?.protectionConfig) {
    protection = data.collection.protectionConfig;
    protectionSource = 'collection';
  } else if (contextParam === 'product' && data?.product?.collection?.protectionConfig) {
    protection = data.product.collection.protectionConfig;
    protectionSource = 'collection';
  } else if (data?.globalProtection || data?.siteProtection) {
    protection = data.globalProtection || data.siteProtection;
    protectionSource = 'global';
  }

  // Verify password
  if (password === protection?.password) {
    // Authenticate using the appropriate method
    if (protectionSource === 'collection' && protection._id) {
      passwordSession.authenticateFor(protection._id);
    } else if (protectionSource === 'global') {
      passwordSession.authenticateGlobally();
    }

    // Check if countdown has expired
    const isCountdownExpired = protection.countdown
      ? new Date(protection.countdown) <= new Date()
      : false;

    // Determine what state we'll be in after password authentication
    const postAuthState = determineProtectionState(
      protection,
      true, // Password will be authenticated
      isCountdownExpired
    );

    // If not fully unlocked after password entry, return success without redirect
    // This handles cases where countdown is still active in 'both' mode
    if (postAuthState.viewState !== 'fully-unlocked') {
      return json(
        {success: true, newState: postAuthState.viewState},
        {
          headers: {
            'Set-Cookie': await passwordSession.commit(),
          },
        }
      );
    }

    // Get redirect page path if configured
    let targetPath = redirectTo;
    if (protection.redirectPage?._ref) {
      const PAGE_PATH_QUERY = `*[_id == $ref][0]{
        _type,
        "slug": slug.current,
        "handle": store.slug.current
      }`;

      const {data: pageData} = await sanity.loadQuery(
        PAGE_PATH_QUERY,
        {ref: protection.redirectPage._ref},
      );

      if (pageData) {
        if (pageData._type === 'home') {
          targetPath = '/';
        } else if (pageData._type === 'page' && pageData.slug) {
          targetPath = `/pages/${pageData.slug}`;
        } else if (pageData.handle) {
          targetPath = `/${pageData.handle}`;
        }
      }
    }

    return redirect(targetPath, {
      headers: {
        'Set-Cookie': await passwordSession.commit(),
      },
    });
  }

  return json({error: 'Incorrect password'});
}


export default function SiteProtected() {
  const {protection, protectionContext, redirectTo, currentViewState} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  if (!protection) {
    return null;
  }

  // Handle state transitions from action responses
  // If action indicates a new state and it's different from current, use the new state
  let effectiveViewState = currentViewState;
  if (actionData && 'newState' in actionData && actionData.newState) {
    effectiveViewState = actionData.newState as ProtectionViewState;
  }

  // Render the appropriate view component based on effective state
  const renderViewComponent = () => {
    switch (effectiveViewState) {
      case 'locked':
        return (
          <LockedView
            protection={protection}
            protectionContext={protectionContext}
            redirectTo={redirectTo}
            actionData={actionData}
          />
        );

      case 'password-granted':
        return (
          <PasswordGrantedView
            protection={protection}
            protectionContext={protectionContext}
          />
        );

      case 'countdown-expired':
        return (
          <CountdownExpiredView
            protection={protection}
            protectionContext={protectionContext}
            redirectTo={redirectTo}
            actionData={actionData}
          />
        );

      default:
        // Fallback to locked state
        return (
          <LockedView
            protection={protection}
            protectionContext={protectionContext}
            redirectTo={redirectTo}
            actionData={actionData}
          />
        );
    }
  };

  return (
    <ProtectionLayout protection={protection}>
      {renderViewComponent()}
    </ProtectionLayout>
  );
}