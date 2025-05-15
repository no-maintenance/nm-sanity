import {EyeOff} from 'lucide-react';
import {defineField, defineArrayMember} from 'sanity';

export default defineField({
  name: 'imageBannerSection',
  title: 'Image Banner',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      type: 'internationalizedArrayBannerRichtext',
    }),
    defineField({
      type: 'contentPosition',
      name: 'contentPosition',
    }),
    defineField({
      name: 'contentAlignment',
      type: 'contentAlignment',
    }),
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      description: 'Choose whether to use an image or video as background',
      type: 'string',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
      },
      initialValue: 'image',
    }),
    defineField({
      type: 'image',
      name: 'backgroundImage',
      description: 'Background image for the banner',
      hidden: ({parent}) => parent?.mediaType === 'video',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'text',
          description: 'Important for accessibility and SEO. Describes the content and function of the image.',
          rows: 2,
        }),
      ],
      options: {
        hotspot: true,
        aiAssist: {
          imageDescriptionField: 'alt',
        },
      },
    }),
    defineField({
      name: 'backgroundVideo',
      title: 'Background Video',
      description: 'Video for the banner background',
      type: 'mux.video',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'heightMode',
      title: 'Height Mode',
      description: 'Choose how to determine the height of the banner',
      type: 'string',
      options: {
        list: [
          {title: 'Fixed Height', value: 'fixed'},
          {title: 'Aspect Ratio', value: 'aspectRatio'},
          {title: 'Fullscreen', value: 'fullscreen'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'bannerHeight',
      title: 'Banner Height',
      type: 'rangeSlider',
      description: 'Set a specific pixel height for the banner',
      options: {
        min: 0,
        max: 2000,
        suffix: 'px',
      },
      validation: (Rule) => Rule.min(0).max(2000),
      hidden: ({parent}) => parent?.heightMode !== 'fixed',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect Ratio',
      description: 'Select a common aspect ratio for the banner',
      type: 'string',
      options: {
        list: [
          {title: '16:9 (Widescreen)', value: '16:9'},
          {title: '4:3 (Standard)', value: '4:3'},
          {title: '1:1 (Square)', value: '1:1'},
          {title: '2:1 (Panoramic)', value: '2:1'},
          {title: '1:2 (Portrait)', value: '1:2'},
          {title: '3:2 (Classic)', value: '3:2'},
          {title: '4:6 (Portrait)', value: '4:6'},
          {title: '9:16 (Vertical)', value: '9:16'},
          {title: 'Custom', value: 'custom'},
        ],
      },
      hidden: ({parent}) => parent?.heightMode !== 'aspectRatio',
    }),
    defineField({
      name: 'customAspectRatio',
      title: 'Custom Aspect Ratio',
      description: 'Enter a custom aspect ratio (width:height)',
      type: 'string',
      hidden: ({parent}) => parent?.heightMode !== 'aspectRatio' || parent?.aspectRatio !== 'custom',
    }),
    // defineField({
    //   name: 'responsiveAspectRatio',
    //   title: 'Use Different Aspect Ratio for Mobile',
    //   description: 'Set a different aspect ratio for mobile devices',
    //   type: 'boolean',
    //   hidden: ({parent}) => parent?.heightMode !== 'aspectRatio',
    // }),
    // defineField({
    //   name: 'mobileAspectRatio',
    //   title: 'Mobile Aspect Ratio',
    //   description: 'Select aspect ratio for mobile devices',
    //   type: 'string',
    //   options: {
    //     list: [
    //       {title: '9:16 (Vertical)', value: '9:16'},
    //       {title: '16:9 (Widescreen)', value: '16:9'},
    //       {title: '4:3 (Standard)', value: '4:3'},
    //       {title: '1:1 (Square)', value: '1:1'},
    //       {title: '2:1 (Panoramic)', value: '2:1'},
    //       {title: '1:2 (Portrait)', value: '1:2'},
    //       {title: '3:2 (Classic)', value: '3:2'},
    //       {title: '4:6 (Portrait)', value: '4:6'},
    //       {title: 'Custom', value: 'custom'},
    //     ],
    //   },
    //   hidden: ({parent}) => parent?.heightMode !== 'aspectRatio' || !parent?.responsiveAspectRatio,
    // }),
    // defineField({
    //   name: 'customMobileAspectRatio',
    //   title: 'Custom Mobile Aspect Ratio',
    //   description: 'Enter a custom aspect ratio for mobile (width:height)',
    //   type: 'string',
    //   hidden: ({parent}) => 
    //     parent?.heightMode !== 'aspectRatio' || 
    //     !parent?.responsiveAspectRatio || 
    //     parent?.mobileAspectRatio !== 'custom',
    // }),
    defineField({
      name: 'overlayOpacity',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 100,
        suffix: '%',
      },
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      type: 'sectionSettings',
      name: 'settings',
    }),
  ],
  initialValue: {
    overlayOpacity: 0,
    contentPosition: 'middle_center',
    heightMode: 'fixed',
    bannerHeight: 450,
    aspectRatio: '16:9',
    mediaType: 'image',
    responsiveAspectRatio: false,
    settings: {
      padding: {
        top: 0,
        bottom: 0,
      },
    },
  },
  preview: {
    select: {
      media: 'backgroundImage',
      settings: 'settings',
      heightMode: 'heightMode',
      mediaType: 'mediaType',
    },
    prepare({media, settings, heightMode, mediaType}) {
      let subtitle = mediaType === 'video' ? 'Video Banner' : 'Image Banner';
      
      if (heightMode === 'aspectRatio') {
        subtitle += ' (Aspect Ratio)';
      } else if (heightMode === 'fullscreen') {
        subtitle += ' (Fullscreen)';
      } else {
        subtitle += ' (Fixed Height)';
      }
      
      return {
        title: subtitle,
        media: settings.hide ? EyeOff : media,
      };
    },
  },
});
