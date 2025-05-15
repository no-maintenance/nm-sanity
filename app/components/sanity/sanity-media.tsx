import React from 'react';
import { SanityImage } from './sanity-image';
import MuxPlayer from '@mux/mux-player-react';
import ClientOnly from './client-only';

type SanityMediaProps = {
  mediaType?: 'image' | 'video';
  image?: any; // The SanityImage data
  video?: any; // The Mux video data
  className?: string;
  priority?: boolean;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  showBorder?: boolean;
  showShadow?: boolean;
  alt?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  hiddenControls?: boolean; // New prop to control whether to hide controls
};

// This component renders only the video part and is used client-side only
function VideoMedia({
  video,
  className,
  objectFit = 'cover',
  autoPlay = true,
  loop = true,
  muted = true,
  hiddenControls = true, // Default to hiding controls
}: Pick<SanityMediaProps, 'video' | 'className' | 'objectFit' | 'autoPlay' | 'loop' | 'muted' | 'hiddenControls'>) {
  if (!video?.asset?.playbackId) return null;
  
  return (
    <MuxPlayer
      streamType="on-demand"
      playbackId={video.asset.playbackId}
      autoPlay="any" // Enhanced autoplay: first try unmuted, then try muted
      loop={loop}
      muted={muted}
      thumbnailTime={video.asset?.thumbTime || 0}
      preload="auto"
      style={{
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Use Mux Player's CSS variables for object-fit behavior
        ['--media-object-fit' as string]: objectFit,
        ['--media-object-position' as string]: 'center',
        // Hide controls if hiddenControls is true
        ...(hiddenControls ? {
          ['--controls' as string]: 'none',
          ['--loading-indicator' as string]: 'none',
        } : {})
      }}
      className={`${className} w-full h-full`}
    />
  );
}

export function SanityMedia({
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
  hiddenControls = false, // Default to showing controls
}: SanityMediaProps) {
  // If mediaType is video and we have video data
  if (mediaType === 'video' && video?.asset?.playbackId) {
    // Use a placeholder on server, then client-only render the actual video
    return (
      <ClientOnly
        fallback={
          <div 
            className={`${className} w-full h-full`} 
            style={{ 
              backgroundColor: '#000',
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
        <VideoMedia
          video={video}
          className={className}
          objectFit={objectFit}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          hiddenControls={hiddenControls}
        />
      </ClientOnly>
    );
  }

  // Default to image
  return (
    <SanityImage
      data={image}
      alt={alt || image?.alt}
      decoding="sync"
      draggable={false}
      fetchpriority={priority ? 'high' : 'auto'}
      loading={priority ? 'eager' : 'lazy'}
      showBorder={showBorder}
      showShadow={showShadow}
      sizes={sizes}
      className={className}
    />
  );
} 