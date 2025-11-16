import {MediaField} from '../media-field';
import type {ProtectionConfig} from '~/lib/site-protection-states';

interface ProtectionBackgroundProps {
  protection: ProtectionConfig;
  /**
   * Optional animation class to apply to background elements
   * (e.g., 'animate-fade-out-blur' for puzzle completion animations)
   */
  animationClass?: string;
}

/**
 * Shared component for protection background layers:
 * - Background media (image/video)
 * - Overlay with opacity
 * - Watermark logo
 */
export function ProtectionBackground({
  protection,
  animationClass,
}: ProtectionBackgroundProps) {
  return (
    <>
      {/* Background Media */}
      {(protection.backgroundImage || protection.backgroundVideo) && (
        <div className={`absolute inset-0 h-full w-full ${animationClass || ''}`}>
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

      {/* Watermark Logo */}
      <div className={`absolute w-9/12 md:w-full max-w-4xl inset-0 md:top-auto md:bottom-0 left-1/2 -translate-x-1/2 mr-10 z-[5] flex items-center justify-center pointer-events-none ${animationClass || ''}`}>
        <img
          src="/nm-logo-white.png"
          alt=""
          className=" opacity-20 object-contain"
          aria-hidden="true"
        />
      </div>
    </>
  );
}

