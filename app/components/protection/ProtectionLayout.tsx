import {ReactNode} from 'react';
import {MediaField} from '../media-field';
import {useColorsCssVars} from '~/hooks/use-colors-css-vars';
import type {ProtectionConfig} from '~/lib/site-protection-states';

interface ProtectionLayoutProps {
  protection: ProtectionConfig;
  children: ReactNode;
}

/**
 * Common layout wrapper for all protection view states
 * Handles background media, overlays, and color schemes
 */
export function ProtectionLayout({
  protection,
  children,
}: ProtectionLayoutProps) {
  // Generate CSS variables for color scheme
  const hasColorScheme = protection?.colorScheme != null;
  const colorsCssVars = useColorsCssVars({
    settings: hasColorScheme ? {colorScheme: protection.colorScheme as any} : undefined,
    selector: '#site-protected-page'
  });

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
          {children}
        </div>
      </div>
    </div>
  );
}