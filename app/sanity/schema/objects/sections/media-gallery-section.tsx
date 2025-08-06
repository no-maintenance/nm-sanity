import {EyeOff, Grid3X3, Image as ImageIcon, Video} from 'lucide-react';
import {defineArrayMember, defineField} from 'sanity';

export default defineField({
  name: 'mediaGallerySection',
  title: 'Media Gallery',
  type: 'object',
  icon: Grid3X3,
  fields: [
    // defineField({
    //   name: 'title',
    //   type: 'internationalizedArrayString',
    //   title: 'Section Title',
    //   description: 'Optional title for the gallery section',
    // }),
    defineField({
      name: 'items',
      type: 'array',
      title: 'Gallery Items',
      description: 'Images and videos for the gallery. Use the "+" button or drag & drop multiple files for bulk upload.',
      options: {
        layout: 'grid',
        sortable: true,
      },
      of: [
        // Simplified image-only type for bulk uploads
        defineArrayMember({
          type: 'image',
          name: 'simpleImage',
          title: 'Image (Quick Add)',
          options: {
            hotspot: true,
            aiAssist: {
              imageDescriptionField: 'alt',
            },
          },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              description: 'Describe the image for accessibility and SEO',
            }),
          ],
        }),
        // Full media item with all options
        defineArrayMember({
          type: 'object',
          name: 'galleryItem',
          title: 'Media Item (Full Options)',
          fields: [
            defineField({
              name: 'mediaType',
              title: 'Media Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Image', value: 'image'},
                  {title: 'Video', value: 'video'},
                ],
                layout: 'radio',
              },
              initialValue: 'image',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              hidden: ({parent}) => parent?.mediaType !== 'image',
              options: {
                hotspot: true,
                aiAssist: {
                  imageDescriptionField: 'alt',
                },
              },
              fields: [
                defineField({
                  name: 'alt',
                  type: 'string',
                  title: 'Alt Text',
                  description: 'Describe the image for accessibility and SEO',
                }),
              ],
              validation: (Rule) => 
                Rule.custom((value, context) => {
                  const mediaType = (context.parent as any)?.mediaType;
                  return mediaType === 'image' && !value ? 'Image is required when media type is image' : true;
                }),
            }),
            defineField({
              name: 'video',
              title: 'Video',
              type: 'mux.video',
              hidden: ({parent}) => parent?.mediaType !== 'video',
              validation: (Rule) => 
                Rule.custom((value, context) => {
                  const mediaType = (context.parent as any)?.mediaType;
                  return mediaType === 'video' && !value ? 'Video is required when media type is video' : true;
                }),
            }),
            defineField({
              name: 'caption',
              type: 'internationalizedArrayString',
              title: 'Caption',
              description: 'Optional caption for this item',
            }),
          ],
          preview: {
            select: {
              mediaType: 'mediaType',
              image: 'image',
              caption: 'caption',
            },
            prepare({mediaType, image, caption}) {
              const captionText = caption?.[0]?.value;
              return {
                title: captionText || `${mediaType === 'video' ? 'Video' : 'Image'} Item`,
                subtitle: mediaType === 'video' ? 'Video' : 'Image',
                media: mediaType === 'video' ? Video : (image || ImageIcon),
              };
            },
          },
        }),
      ],
      validation: (Rule) => Rule.min(1).error('At least one gallery item is required'),
    }),
    defineField({
      name: 'layout',
      type: 'object',
      title: 'Layout Settings',
      description: 'Control how the gallery is displayed',
      fields: [
        // defineField({
        //   name: 'mobileColumns',
        //   type: 'string',
        //   title: 'Mobile Columns',
        //   description: 'Number of columns on mobile devices',
        //   options: {
        //     list: [
        //       {title: '1 Column', value: '1'},
        //       {title: '2 Columns', value: '2'},
        //     ],
        //     layout: 'radio',
        //   },
        //   initialValue: '1',
        // }),
        // defineField({
        //   name: 'desktopColumns',
        //   type: 'string',
        //   title: 'Desktop Columns',
        //   description: 'Number of columns on desktop',
        //   options: {
        //     list: [
        //       {title: '2 Columns', value: '2'},
        //       {title: '3 Columns', value: '3'},
        //       {title: '4 Columns', value: '4'},
        //     ],
        //     layout: 'radio',
        //   },
        //   initialValue: '2',
        // }),
        defineField({
          name: 'aspectRatio',
          type: 'string',
          title: 'Image Aspect Ratio',
          description: 'How images should be cropped/displayed',
          options: {
            list: [
              {title: 'Original (No cropping)', value: 'original'},
              {title: 'Square (1:1)', value: 'square'},
              {title: 'Portrait (3:4)', value: 'portrait'},
              {title: 'Landscape (4:3)', value: 'landscape'},
              {title: 'Wide (16:9)', value: 'wide'},
            ],
            layout: 'dropdown',
          },
          initialValue: 'original',
        }),
        defineField({
          name: 'gap',
          type: 'string',
          title: 'Gap Between Items',
          description: 'Spacing between gallery items',
          options: {
            list: [
              {title: 'None', value: 'none'},
              {title: 'Small', value: 'small'},
              {title: 'Medium', value: 'medium'},
              {title: 'Large', value: 'large'},
            ],
            layout: 'radio',
          },
          initialValue: 'medium',
        }),
      ],
    }),
    // defineField({
    //   name: 'enableToggle',
    //   type: 'boolean',
    //   title: 'Enable Column Toggle',
    //   description: 'Allow users to toggle between different column layouts',
    //   initialValue: true,
    // }),
    // defineField({
    //   name: 'enableLightbox',
    //   type: 'boolean',
    //   title: 'Enable Lightbox',
    //   description: 'Allow users to view images/videos in a lightbox overlay',
    //   initialValue: true,
    // }),
    defineField({
      type: 'sectionSettings',
      name: 'settings',
    }),
  ],
  initialValue: {
    layout: {
      mobileColumns: '1',
      desktopColumns: '2',
      aspectRatio: 'original',
      gap: 'medium',
    },
    enableToggle: true,
    enableLightbox: true,
  },
  preview: {
    select: {
      title: 'title',
      items: 'items',
      layout: 'layout',
      settings: 'settings',
    },
    prepare({title, items, layout, settings}) {
      const itemCount = items?.length || 0;
      const titleText = title?.[0]?.value;
      const columns = layout?.desktopColumns || '2';
      
      return {
        title: titleText || 'Media Gallery',
        subtitle: `${itemCount} items • ${columns} columns`,
        media: settings?.hide ? EyeOff : Grid3X3,
      };
    },
  },
});