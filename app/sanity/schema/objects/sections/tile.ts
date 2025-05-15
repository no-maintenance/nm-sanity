import {defineField, defineType} from 'sanity';
import {Image, Video, Link2, AlignVerticalSpaceAround} from 'lucide-react';

export default defineType({
  name: 'tile',
  title: 'Tile',
  type: 'object',
  icon: AlignVerticalSpaceAround,
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
      description: 'Choose whether to use an image or video for this tile.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      icon: Image,
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
          description: 'Describe the image for accessibility and SEO.',
        }),
      ],
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'mux.video',
      icon: Video,
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'richtext',
      title: 'Banner Rich Text',
      type: 'internationalizedArrayBannerRichtext', // Assuming this is a defined type
      description: 'Text and formatting for this tile.',
    }),
    defineField({
        name: 'link',
        type: 'link',
        description: 'If set, the entire tile will be clickable.',
    }),
    defineField({
        name: 'externalLink',
        description: "Will be used if internal link isn't provided.",
        type: 'url',
    }),
    defineField({
        name: 'openInNewTab',
        title: 'Open external link in new tab',
        type: 'boolean',
    }),
    defineField({
      type: 'contentPosition', // Assuming this is a defined type in your schema
      name: 'contentPosition',
      title: 'Content Position',
      description: 'Position of the text content within the tile.',
      initialValue: 'middle_center',
    }),
    defineField({
      name: 'contentAlignment',
      type: 'contentAlignment', // Assuming this is a defined type in your schema
      title: 'Content Alignment',
      description: 'Alignment of the text content within the tile.',
      initialValue: 'center',
    }),
    defineField({
        type: 'sectionSettings',
        name: 'settings',
    }),
  ],
}); 