import type {ActionFunctionArgs, LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {json, redirect} from '@shopify/remix-oxygen';
import {Form, useActionData, useLoaderData} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {MediaField} from '~/components/media-field';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {useColorsCssVars} from '~/hooks/use-colors-css-vars';

interface ColorScheme {
  _id?: string;
  name?: string;
  background?: any;
  foreground?: any;
  primary?: any;
  primaryForeground?: any;
  border?: any;
  card?: any;
  cardForeground?: any;
}

interface SiteProtectionSettings {
  enabled?: boolean;
  accessMode?: 'password' | 'countdown' | 'both' | 'either';
  password?: string;
  countdown?: string;
  title?: any[];
  message?: any[];
  countdownLabel?: any[];
  passwordLabel?: any[];
  redirectPage?: {
    _ref?: string;
    _type?: string;
  };
  mediaType?: 'image' | 'video';
  backgroundImage?: any;
  backgroundVideo?: any;
  overlayOpacity?: number;
  colorScheme?: ColorScheme;
}

interface LoaderData {
  protection?: SiteProtectionSettings;
  redirectTo: string;
  serverTime: string;
  locale: string;
  hasPasswordAuth: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export async function loader({context, request}: LoaderFunctionArgs) {
  const {passwordSession, sanity, locale} = context;
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';

  // Query for protection settings with color scheme and expanded video
  const PROTECTION_QUERY = `*[_type == "settings"][0]{
    siteProtection {
      ...,
      backgroundVideo {
        ...,
        asset->
      },
      colorScheme-> {
        _id,
        name,
        background {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        foreground {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        primary {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        primaryForeground {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        border {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        card {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        cardForeground {
          hex,
          rgb {
            r,
            g,
            b
          }
        }
      }
    }
  }`;

  const {data} = await sanity.loadQuery<{siteProtection?: SiteProtectionSettings}>(
    PROTECTION_QUERY,
    {},
  );

  const protection = data?.siteProtection;

  // If protection is not enabled, redirect to intended page
  if (!protection?.enabled) {
    return redirect(redirectTo);
  }

  // Check if user already has access
  const hasPasswordAuth = passwordSession.isAuthenticated();
  const countdownExpired = protection.countdown
    ? new Date(protection.countdown) <= new Date()
    : false;

  let hasAccess = false;
  switch (protection.accessMode) {
    case 'password':
      hasAccess = hasPasswordAuth;
      break;
    case 'countdown':
      hasAccess = countdownExpired;
      break;
    case 'both':
      hasAccess = hasPasswordAuth && countdownExpired;
      break;
    case 'either':
      hasAccess = hasPasswordAuth || countdownExpired;
      break;
  }

  if (hasAccess) {
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
    redirectTo,
    serverTime: new Date().toISOString(),
    locale: locale.language,
    hasPasswordAuth,
  });
}

export async function action({context, request}: ActionFunctionArgs) {
  const {passwordSession, sanity} = context;
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string || '/';

  // Query for protection settings with color scheme and expanded video
  const PROTECTION_QUERY = `*[_type == "settings"][0]{
    siteProtection {
      ...,
      backgroundVideo {
        ...,
        asset->
      },
      colorScheme-> {
        _id,
        name,
        background {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        foreground {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        primary {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        primaryForeground {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        border {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        card {
          hex,
          rgb {
            r,
            g,
            b
          }
        },
        cardForeground {
          hex,
          rgb {
            r,
            g,
            b
          }
        }
      }
    }
  }`;

  const {data} = await sanity.loadQuery<{siteProtection?: SiteProtectionSettings}>(
    PROTECTION_QUERY,
    {},
  );

  const protection = data?.siteProtection;

  if (password === protection?.password) {
    passwordSession.authenticate();

    // Check if countdown has expired
    const countdownExpired = protection.countdown
      ? new Date(protection.countdown) <= new Date()
      : false;

    // If accessMode is 'both', only redirect if countdown has also expired
    // Otherwise, return success to show waiting state
    if (protection.accessMode === 'both' && !countdownExpired) {
      return json(
        {success: true, waitingForCountdown: true},
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

function calculateTimeLeft(targetDate: string): TimeLeft {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return {days: 0, hours: 0, minutes: 0, seconds: 0, total: 0};
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

function TimeUnit({value, label}: {value: number; label: string}) {
  return (
    <div className="flex flex-col items-center" style={{minWidth: '60px'}}>
      <div
        className="text-4xl md:text-5xl font-bold tabular-nums"
        style={{
          lineHeight: '1.2',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {value.toString().padStart(2, '0')}
      </div>
      <div
        className="text-sm md:text-base uppercase mt-1"
        style={{
          opacity: 0.75,
          lineHeight: '1.2',
          minHeight: '20px'
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function SiteProtected() {
  const {protection, redirectTo, serverTime, locale, hasPasswordAuth} = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Start with null to avoid hydration mismatch
  // Countdown will be initialized on client only
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Generate CSS variables for color scheme
  const hasColorScheme = protection?.colorScheme != null;
  const colorsCssVars = useColorsCssVars({
    settings: hasColorScheme ? {colorScheme: protection.colorScheme as any} : undefined,
    selector: '#site-protected-page'
  });

  // Initialize and update countdown (client-side only)
  useEffect(() => {
    // Mark as hydrated immediately
    setIsHydrated(true);

    if (!protection?.countdown) return;

    // Calculate initial time on client
    const initialRemaining = calculateTimeLeft(protection.countdown);
    setTimeLeft(initialRemaining);

    // If already expired, DON'T reload - just show the "NOW LIVE" state
    // The loader has already checked and denied access, so reloading creates a loop
    if (initialRemaining.total <= 0) {
      return;
    }

    // Update countdown every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(protection.countdown!);
      setTimeLeft(remaining);

      // When countdown reaches zero, trigger revalidation ONCE
      if (remaining.total <= 0) {
        clearInterval(interval);
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [protection?.countdown, redirectTo]);

  if (!protection) {
    return null;
  }

  const showPassword = ['password', 'both', 'either'].includes(protection.accessMode || '');
  const showCountdown = ['countdown', 'both', 'either'].includes(protection.accessMode || '');

  // Check if countdown has already expired (for showing "NOW LIVE" instead of timer)
  const countdownExpired = protection.countdown
    ? new Date(protection.countdown) <= new Date()
    : false;

  // Check if password is authenticated but waiting for countdown (only for 'both' mode)
  const waitingForCountdown = protection.accessMode === 'both' && 
    (hasPasswordAuth || (actionData && 'waitingForCountdown' in actionData && actionData.waitingForCountdown)) && 
    !countdownExpired;

  // Get localized content (use first value if array, or the value itself)
  // Only use defaults when field is truly empty, not when explicitly set to empty string
  const title = Array.isArray(protection.title) && protection.title.length > 0
    ? (protection.title[0] as any)?.value
    : protection.title !== undefined ? protection.title : 'Coming Soon';
  const message = Array.isArray(protection.message) && protection.message.length > 0
    ? (protection.message[0] as any)?.value
    : protection.message;
  const countdownLabel = Array.isArray(protection.countdownLabel) && protection.countdownLabel.length > 0
    ? (protection.countdownLabel[0] as any)?.value
    : protection.countdownLabel;
  const passwordLabel = Array.isArray(protection.passwordLabel) && protection.passwordLabel.length > 0
    ? (protection.passwordLabel[0] as any)?.value
    : protection.passwordLabel;

  return (
    <div id={hasColorScheme ? "site-protected-page" : undefined} className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {hasColorScheme && <style dangerouslySetInnerHTML={{__html: colorsCssVars}} />}
      {/* Background Media */}
      {(protection.backgroundImage || protection.backgroundVideo) && (
        <div className="absolute inset-0 h-full w-full">
          <MediaField
            mediaType={protection.mediaType || 'image'}
            image={protection.backgroundImage}
            video={protection.backgroundVideo}
            className="h-full w-full object-cover"
            objectFit="cover"
            priority
            controls={false}
            autoPlay={true}
            loop={true}
            muted={true}
            playsInline={true}
          />
        </div>
      )}

      {/* Overlay */}
      {protection.overlayOpacity !== undefined && protection.overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgb(0 0 0)',
            opacity: protection.overlayOpacity / 100
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 md:p-8">
        <div className="max-w-md w-full text-center">
          {title && (
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
              {title}
            </h1>
          )}

          {message && (
            <p className="text-lg md:text-xl mb-8 text-muted-foreground">
              {message}
            </p>
          )}

          {showCountdown && (
            <div className="mb-8">
              {countdownExpired ? (
                // Show "NOW LIVE" when countdown has expired
                <div className="text-center">
                  <p className="text-4xl md:text-6xl font-bold text-foreground">
                    NOW LIVE
                  </p>
                </div>
              ) : (
                // Show countdown timer when not expired
                <>
                  {countdownLabel && (
                    <p className="mb-6 text-sm md:text-base uppercase tracking-wider text-muted-foreground">
                      {countdownLabel}
                    </p>
                  )}
                  <div
                    className="flex justify-center gap-2 md:gap-4 text-foreground"
                    style={{
                      minHeight: '80px',
                      // Apply fade-in animation after hydration
                      opacity: isHydrated && timeLeft ? 1 : 0.3,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                  >
                    {/* Always render the same structure to avoid hydration mismatch */}
                    <TimeUnit value={timeLeft?.days ?? 0} label="Days" />
                    <div className="text-3xl md:text-4xl font-bold self-start mt-2" style={{opacity: 0.5}}>:</div>
                    <TimeUnit value={timeLeft?.hours ?? 0} label="Hours" />
                    <div className="text-3xl md:text-4xl font-bold self-start mt-2" style={{opacity: 0.5}}>:</div>
                    <TimeUnit value={timeLeft?.minutes ?? 0} label="Minutes" />
                    <div className="text-3xl md:text-4xl font-bold self-start mt-2" style={{opacity: 0.5}}>:</div>
                    <TimeUnit value={timeLeft?.seconds ?? 0} label="Seconds" />
                  </div>
                </>
              )}
            </div>
          )}

          {showCountdown && showPassword && protection.accessMode === 'either' && !countdownExpired && (
            <div className="my-6 md:my-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 uppercase tracking-wider bg-background text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>
            </div>
          )}

          {waitingForCountdown ? (
            // Show waiting state when password is correct but countdown hasn't expired
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
                <p className="text-lg font-semibold mb-2">
                  Password Accepted
                </p>
                <p className="text-muted-foreground">
                  Please wait for the countdown to complete to access the site.
                </p>
              </div>
            </div>
          ) : showPassword && (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <div className="space-y-4">

                <Input
                  type="password"
                  name="password"
                  placeholder={passwordLabel ?? "Enter password"}
                  required
                  autoComplete="off"
                  className="bg-foreground text-background"
                />
                {actionData && 'error' in actionData && actionData.error && (
                  <p className="text-sm text-destructive">
                    {actionData.error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                >
                  Enter Site
                </Button>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}