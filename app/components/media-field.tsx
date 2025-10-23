import React from 'react';
import { SanityImage } from './sanity/sanity-image';
import MuxPlayer from '@mux/mux-player-react';
import ClientOnly from './sanity/client-only';

/**
 * MediaField Component
 *
 * A reusable component for rendering either an image or Mux video based on mediaType.
 * This is a common pattern throughout the app where content editors can choose
 * between image or video backgrounds.
 */

interface MediaFieldProps {
  mediaType?: 'image' | 'video';
  image?: any; // Sanity image data
  video?: any; // Mux video data
  className?: string;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  showBorder?: boolean;
  showShadow?: boolean;
  alt?: string;
  // Video-specific props
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsInline?: boolean;
}

export function MediaField({
  mediaType = 'image',
  image,
  video,
  className = '',
  priority = false,
  sizes = '100vw',
  objectFit = 'cover',
  showBorder = false,
  showShadow = false,
  alt,
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
  playsInline = true,
}: MediaFieldProps) {
  // Render video if mediaType is video and we have video data with playbackId
  if (mediaType === 'video' && video?.asset?.playbackId) {
    // Use ClientOnly to avoid hydration issues with video player
    return (
      <ClientOnly
        fallback={
          <div
            className={`${className} bg-black`}
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        }
      >
        <MuxPlayer
          streamType="on-demand"
          playbackId={video.asset.playbackId}
          autoPlay={autoPlay ? "any" : false}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          thumbnailTime={video?.asset?.thumbTime || 0}
          preload="auto"
          style={{
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            ['--media-object-fit' as string]: objectFit,
            ['--media-object-position' as string]: 'center',
            // Hide controls if specified
            ...(controls === false ? {
              ['--controls' as string]: 'none',
              ['--loading-indicator' as string]: 'none',
            } : {})
          }}
          className={`${className} w-full h-full`}
        />
      </ClientOnly>
    );
  }

  // Log if video was expected but playbackId is missing
  if (mediaType === 'video' && video && !video?.asset?.playbackId) {
    console.warn('MediaField: Video data present but no playbackId found. Structure:', {
      video,
      asset: video?.asset,
      expectedPath: 'video.asset.playbackId',
    });
  }

  // Default to image rendering
  if (image) {
    return (
      <SanityImage
        data={image}
        alt={alt || image?.alt || ''}
        decoding="sync"
        draggable={false}
        fetchpriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        showBorder={showBorder}
        showShadow={showShadow}
        sizes={sizes}
        className={className}
        style={{
          objectFit: objectFit,
        }}
      />
    );
  }

  // Return null if neither image nor video is available
  return null;
}