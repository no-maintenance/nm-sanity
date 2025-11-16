import {ReactNode} from 'react';
import type {ProtectionConfig} from '~/lib/site-protection-states';
import {ProtectionBackground} from './protection-background';

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
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      <ProtectionBackground protection={protection} />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6 md:p-8">
        <div className="max-w-md w-full text-center">
          {children}
        </div>
      </div>
    </div>
  );
}