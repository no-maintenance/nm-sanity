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
import {ProtectedPuzzleContainer} from '~/components/protection/ProtectedPuzzleContainer';
import {SaleGateExperience} from '~/components/protection/sale-gate-experience';
import {useColorsCssVars} from '~/hooks/use-colors-css-vars';

interface LoaderData {
  protection?: ProtectionConfig;
  protectionContext: ProtectionContext;
  redirectTo: string;
  serverTime: string;
  locale: string;
  currentViewState: ProtectionViewState;
}

function generateErrorKey(): string {
  const cryptoImpl = (globalThis as any).crypto;
  if (cryptoImpl?.randomUUID) {
    return cryptoImpl.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
}

export async function loader({context, request}: LoaderFunctionArgs) {
  const {passwordSession, sanity, locale, env} = context;
  const url = new URL(request.url);
  const redirectParam = url.searchParams.get('redirectTo');
  const pendingRedirect = passwordSession.getPendingRedirect();
  let redirectTo = redirectParam || pendingRedirect || '/';
  let sessionUpdated = false;

  if (redirectParam && redirectParam !== pendingRedirect) {
    passwordSession.setPendingRedirect(redirectParam);
    sessionUpdated = true;
  }

  // Check if site protection is bypassed via environment variable
  const bypassProtection = env?.BYPASS_SITE_PROTECTION === 'true';
  if (bypassProtection) {
    const headers: HeadersInit = {};
    if (sessionUpdated) {
      headers['Set-Cookie'] = await passwordSession.commit();
    }
    return redirect(redirectTo, {headers});
  }

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
    embeddedPuzzle->{
      _id,
      _type,
      title,
      slug,
      puzzleMode,
      themeWords[] {
        word,
        isSpangram,
        difficulty,
        hint
      },
      canonicalGrid,
      gridLocked,
      gridMetadata {
        generatedAt,
        hintWordCount,
        algorithm,
        canonicalPaths
      },
      hintWords,
      theme {
        category,
        clue,
        emoji
      },
      difficulty,
      hintMode,
      timeLimit,
      scoring {
        pointsPerWord,
        spangramBonus
      },
      reward {
        enabled,
        type,
        discountCode,
        discountPercent,
        message
      },
      status,
      publishDate,
      expiryDate,
      puzzleNumber
    },
    puzzleGrantsAccess,
    puzzleCompletionMessage,
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
        "globalProtection": siteProtection->${protectionConfigExpansion}
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
  } else if (data?.globalProtection) {
    protection = data.globalProtection;
    protectionSource = 'global';
  }

  // Clean up query params we now track via session (redirectTo/state)
  const cleanupSearchParams = new URLSearchParams(url.search);
  let shouldCleanUrl = false;
  if (cleanupSearchParams.has('redirectTo')) {
    cleanupSearchParams.delete('redirectTo');
    shouldCleanUrl = true;
  }
  if (cleanupSearchParams.has('state')) {
    cleanupSearchParams.delete('state');
    shouldCleanUrl = true;
  }

  if (shouldCleanUrl) {
    const cleanQuery = cleanupSearchParams.toString();
    const cleanUrl = cleanQuery ? `${url.pathname}?${cleanQuery}` : url.pathname;
    const headers: HeadersInit = {};
    if (sessionUpdated) {
      headers['Set-Cookie'] = await passwordSession.commit();
      sessionUpdated = false;
    }
    return redirect(cleanUrl, {headers});
  }

  // If no protection config exists, redirect to intended page
  if (!protection) {
    const headers: HeadersInit = {};
    if (sessionUpdated) {
      headers['Set-Cookie'] = await passwordSession.commit();
      sessionUpdated = false;
    }
    return redirect(redirectTo, {headers});
  }

  // If protection is explicitly disabled, redirect to intended page
  // Note: undefined/missing enabled field is treated as enabled (matches schema initialValue)
  if (protection.enabled === false) {
    const headers: HeadersInit = {};
    if (sessionUpdated) {
      headers['Set-Cookie'] = await passwordSession.commit();
      sessionUpdated = false;
    }
    return redirect(redirectTo, {headers});
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
  const hasPuzzleAccess = protection._id
    ? passwordSession.hasPuzzleCompletionFor(protection._id)
    : false;

  const protectionState = determineProtectionState(
    protection,
    hasPasswordAuth,
    isCountdownExpired,
    hasPuzzleAccess
  );

  // If fully unlocked, redirect to target page
  if (protectionState.viewState === 'fully-unlocked') {
    // Get redirect page path if configured
    const targetPath = await resolveRedirectTarget(sanity, protection, redirectTo, locale);
    passwordSession.clearPendingRedirect();
    return redirect(targetPath, {
      headers: {
        'Set-Cookie': await passwordSession.commit(),
      },
    });
  }

  const jsonHeaders = sessionUpdated
    ? {headers: {'Set-Cookie': await passwordSession.commit()}}
    : undefined;

  return json<LoaderData>({
    protection,
    protectionContext,
    redirectTo,
    serverTime: new Date().toISOString(),
    locale: locale.language,
    currentViewState: protectionState.viewState,
  }, jsonHeaders);
}

export async function action({context, request}: ActionFunctionArgs) {
  const {passwordSession, sanity} = context;
  const formData = await request.formData();
  const actionType = formData.get('actionType') as string;
  const password = formData.get('password') as string;
  const redirectTo = (formData.get('redirectTo') as string) || passwordSession.getPendingRedirect() || '/';
  const playCompletionAnimation = formData.get('playCompletionAnimation') === 'true';
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
    redirectPage,
    embeddedPuzzle->{
      _id
    },
    puzzleGrantsAccess,
    puzzleCompletionMessage
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
        "globalProtection": siteProtection->${protectionConfigExpansion}
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
  } else if (data?.globalProtection) {
    protection = data.globalProtection;
    protectionSource = 'global';
  }

  // Handle puzzle completion
  if (actionType === 'puzzle-completed') {
    // If puzzleGrantsAccess is not enabled, return error
    if (!protection?.puzzleGrantsAccess) {
      console.error('[Puzzle Completion] puzzleGrantsAccess is not enabled:', {
        hasProtection: !!protection,
        puzzleGrantsAccess: protection?.puzzleGrantsAccess,
      });
      return json({
        error: 'Puzzle completion does not grant access for this protection',
        errorKey: generateErrorKey(),
      });
    }

    // Authenticate using the appropriate method
    if (protectionSource === 'collection' && protection._id) {
      passwordSession.authenticateFor(protection._id);
      passwordSession.markPuzzleCompletion(protection._id);
    } else if (protectionSource === 'global') {
      passwordSession.authenticateGlobally();
      if (protection._id) {
        passwordSession.markPuzzleCompletion(protection._id);
      }
    }

    // When puzzleGrantsAccess is true, puzzle completion bypasses ALL other protection logic
    // and grants immediate full access regardless of accessMode or countdown status
    const targetPath = await resolveRedirectTarget(sanity, protection, redirectTo, context.locale);
    passwordSession.clearPendingRedirect();
    return redirect(targetPath, {
      headers: {
        'Set-Cookie': await passwordSession.commit(),
      },
    });
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

    const targetPath = await resolveRedirectTarget(sanity, protection, redirectTo, context.locale);
    passwordSession.clearPendingRedirect();

    // If there's an embedded puzzle and playCompletionAnimation is requested,
    // return JSON to trigger puzzle completion animation (only for actual puzzle completion)
    // Otherwise, use page fade for password/countdown completion
    if (playCompletionAnimation && protection.embeddedPuzzle) {
      return json(
        {
          success: true,
          newState: 'fully-unlocked',
          startCompletionAnimation: true,
          redirectUrl: targetPath,
        },
        {
          headers: {
            'Set-Cookie': await passwordSession.commit(),
          },
        }
      );
    }

    // For password/countdown completion without puzzle completion, use page fade
    if (protection.embeddedPuzzle) {
      return json(
        {
          success: true,
          newState: 'fully-unlocked',
          startPageFade: true,
          redirectUrl: targetPath,
        },
        {
          headers: {
            'Set-Cookie': await passwordSession.commit(),
          },
        }
      );
    }

    return redirect(targetPath, {
      headers: {
        'Set-Cookie': await passwordSession.commit(),
      },
    });
  }

  return json({
    error: 'Incorrect password',
    errorKey: generateErrorKey(),
  });
}


export default function SiteProtected() {
  const {protection, protectionContext, redirectTo, currentViewState} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Generate CSS variables for color scheme (must be called before early returns)
  const hasColorScheme = protection?.colorScheme != null;
  const colorsCssVars = useColorsCssVars({
    settings: hasColorScheme ? {colorScheme: protection.colorScheme as any} : undefined,
    selector: ':root'
  });

  if (!protection) {
    return null;
  }

  // Handle state transitions from action responses
  // If action indicates a new state and it's different from current, use the new state
  let effectiveViewState = currentViewState;
  if (actionData && 'newState' in actionData && actionData.newState) {
    effectiveViewState = actionData.newState as ProtectionViewState;
  }

  // SS26 sale: the site-wide locked gate uses the custom experience
  // (3D logo + typed price sheet + glitch). Password is still validated
  // server-side by the action above against the Sanity protectionConfig.
  if (
    effectiveViewState === 'locked' &&
    protectionContext.type === 'site' &&
    !protection.embeddedPuzzle
  ) {
    return (
      <SaleGateExperience
        redirectTo={redirectTo}
        actionData={actionData as {error?: string; errorKey?: string | number} | null}
      />
    );
  }

  // If there's an embedded puzzle, render it with protection overlay
  if (protection.embeddedPuzzle) {
    return (
      <div id={hasColorScheme ? "site-protected-page" : undefined}>
        {hasColorScheme && (
          <style dangerouslySetInnerHTML={{__html: colorsCssVars}} />
        )}
        <ProtectedPuzzleContainer
          puzzle={protection.embeddedPuzzle}
          protection={protection}
          protectionContext={protectionContext}
          viewState={effectiveViewState}
          redirectTo={redirectTo}
          actionData={actionData}
        />
      </div>
    );
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
    <div id={hasColorScheme ? "site-protected-page" : undefined}>
      {hasColorScheme && (
        <style dangerouslySetInnerHTML={{__html: colorsCssVars}} />
      )}
      <ProtectionLayout protection={protection}>
        {renderViewComponent()}
      </ProtectionLayout>
    </div>
  );
}

async function resolveRedirectTarget(
  sanity: any,
  protection: ProtectionConfig,
  fallbackPath: string,
  locale: {pathPrefix?: string}
): Promise<string> {
  let targetPath = fallbackPath;
  const pathPrefix = locale.pathPrefix || '';

  if (protection.redirectPage?._ref) {
    try {
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
          targetPath = pathPrefix || '/';
        } else if (pageData._type === 'page' && pageData.slug) {
          targetPath = `${pathPrefix}/${pageData.slug}`;
        } else if (pageData._type === 'collection' && pageData.handle) {
          targetPath = `${pathPrefix}/collections/${pageData.handle}`;
        } else if (pageData._type === 'product' && pageData.handle) {
          targetPath = `${pathPrefix}/products/${pageData.handle}`;
        } else if (pageData.handle) {
          // Fallback for other types with handle
          targetPath = `${pathPrefix}/${pageData.handle}`;
        }
      }
    } catch (error) {
      console.error('[Site Protection] Error resolving redirect page:', error);
    }
  } else {
    // If no redirectPage is set, ensure fallbackPath has locale prefix if it's a collection/product path
    if (pathPrefix && fallbackPath && !fallbackPath.startsWith(pathPrefix)) {
      // Check if it's a collection or product path that needs the prefix
      if (fallbackPath.startsWith('/collections/') || fallbackPath.startsWith('/products/')) {
        targetPath = `${pathPrefix}${fallbackPath}`;
      }
    }
  }

  return targetPath;
}
