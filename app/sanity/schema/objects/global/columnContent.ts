import {defineField, defineType} from 'sanity';
import {Type, Image, SquareMousePointer, GalleryHorizontal} from 'lucide-react';

export default defineType({
  name: 'columnContent',
  title: 'Column Content',
  type: 'object',
  fields: [
    defineField({
      name: 'contentType',
      title: 'Content Type',
      description: 'What type of content should this column contain',
      type: 'string',
      options: {
        list: [
          {title: 'Rich Text', value: 'richtext'},
          {title: 'Single Image', value: 'image'},
          {title: 'Image Carousel', value: 'carousel'},
          {title: 'Form', value: 'form'},
          {title: 'Button Group', value: 'buttons'},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'richtext',
      title: 'Rich Text Content',
      description: 'Rich text with headings, paragraphs, and formatting',
      type: 'richtext',
      hidden: ({parent}) => parent?.contentType !== 'richtext',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      description: 'A single image for this column',
      type: 'image',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative Text',
          type: 'text',
          description: 'Important for accessibility and SEO. Describes the content and function of the image.',
          rows: 2,
        }),
        defineField({
          name: 'maxWidth',
          type: 'rangeSlider',
          options: {
            min: 0,
            max: 3840,
            suffix: 'px',
          },
        }),
        defineField({
          name: 'alignment',
          type: 'contentAlignment',
        }),
      ],
      options: {
        hotspot: true,
        aiAssist: {
          imageDescriptionField: 'alt',
        },
      },
      initialValue: {
        maxWidth: 900,
        alignment: 'center',
      },
      hidden: ({parent}) => parent?.contentType !== 'image',
    }),
    defineField({
      name: 'carousel',
      title: 'Image Carousel',
      description: 'Multiple images in a carousel format',
      type: 'object',
      fields: [
        defineField({
          name: 'slides',
          title: 'Images',
          type: 'array',
          of: [
            {
              name: 'slide',
              type: 'object',
              fields: [
                defineField({
                  name: 'image',
                  type: 'image',
                  options: {
                    hotspot: true,
                    aiAssist: {
                      imageDescriptionField: 'alt',
                    },
                  },
                  fields: [
                    defineField({
                      name: 'alt',
                      title: 'Alternative Text',
                      type: 'text',
                      description: 'Important for accessibility and SEO',
                      rows: 2,
                    }),
                  ],
                }),
              ],
              preview: {
                select: {
                  media: 'image',
                },
                prepare(context) {
                  return {
                    title: 'Slide',
                    media: context.media,
                  };
                },
              },
            },
          ],
          validation: (Rule) => Rule.min(1).max(6),
        }),
        defineField({
          name: 'slidesPerViewDesktop',
          title: 'Slides per view',
          type: 'rangeSlider',
          options: {
            min: 1,
            max: 4,
          },
          initialValue: 2,
        }),
      ],
      hidden: ({parent}) => parent?.contentType !== 'carousel',
    }),
    defineField({
      name: 'form',
      title: 'Form',
      description: 'A form embedded in this column',
      type: 'object',
      fields: [
        defineField({
          name: 'formType',
          title: 'Form Type',
          type: 'string',
          options: {
            list: [
              {title: 'Newsletter', value: 'newsletter'},
              {title: 'Contact', value: 'contact'},
              {title: 'Appointment', value: 'appointment'},
            ],
            layout: 'radio',
          },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'title',
          title: 'Form Title',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'Form Description',
          type: 'text',
          rows: 2,
        }),
      ],
      hidden: ({parent}) => parent?.contentType !== 'form',
    }),
    defineField({
      name: 'buttons',
      title: 'Buttons',
      description: 'A group of buttons for this column',
      type: 'array',
      of: [{type: 'button'}],
      validation: (Rule) => Rule.min(1).max(3),
      hidden: ({parent}) => parent?.contentType !== 'buttons',
    }),
  ],
  preview: {
    select: {
      contentType: 'contentType',
      image: 'image.asset',
      carouselImage: 'carousel.slides.0.image.asset',
      formType: 'form.formType',
    },
    prepare({contentType, image, carouselImage, formType}) {
      const icons = {
        richtext: Type,
        image: Image,
        carousel: GalleryHorizontal,
        form: SquareMousePointer,
        buttons: SquareMousePointer,
      };
      
      const Icon = icons[contentType as keyof typeof icons] || Type;
      
      let subtitle = contentType?.charAt(0).toUpperCase() + contentType?.slice(1);
      if (contentType === 'form' && formType) {
        subtitle = `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form`;
      }
      
      return {
        title: subtitle || 'Column Content',
        media: image || carouselImage || Icon,
      };
    },
  },
}); 