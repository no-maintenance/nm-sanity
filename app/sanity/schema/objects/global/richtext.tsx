import {ExternalLink, Link, SquareMousePointer, Columns, GalleryHorizontal} from 'lucide-react';
import {defineArrayMember, defineField} from 'sanity';

export default defineField({
  name: 'richtext',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      marks: {
        decorators: [
          {title: 'Strong', value: 'strong'},
          {title: 'Emphasis', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Strike-through', value: 'strike-through'},
        ],
        annotations: [
          {
            name: 'internalLink',
            type: 'object',
            title: 'Internal link',
            icon: () => (
              <Link
                aria-label="Internal link icon"
                size="1em"
                strokeWidth={1}
              />
            ),
            fields: [
              defineField({
                name: 'link',
                type: 'link',
              }),
              defineField({
                name: 'anchor',
                type: 'anchor',
              }),
            ],
          },
          {
            name: 'externalLink',
            type: 'object',
            title: 'External link',
            icon: () => <ExternalLink size="1em" strokeWidth={1} />,
            fields: [
              defineField({
                name: 'link',
                type: 'url',
              }),
              defineField({
                name: 'openInNewTab',
                type: 'boolean',
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({
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
    }),
    defineArrayMember({
      name: 'button',
      type: 'button',
    }),
    defineArrayMember({
      name: 'form',
      title: 'Form',
      type: 'object',
      icon: () => (
        <SquareMousePointer
          aria-label="Form icon"
          size="1em"
          strokeWidth={1}
        />
      ),
      fields: [
        defineField({
          name: 'formType',
          title: 'Form Type',
          description: 'Select which type of form to display in the content',
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
          description: 'Optional title to display above the form',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'Form Description',
          description: 'Optional description text to display below the title',
          type: 'text',
          rows: 2,
        }),
      ],
      preview: {
        select: {
          formType: 'formType',
          title: 'title',
        },
        prepare({formType, title}) {
          const formTypeTitle = formType 
            ? formType.charAt(0).toUpperCase() + formType.slice(1)
            : 'Form';
          return {
            title: title || `${formTypeTitle} Form`,
            subtitle: `Form Type: ${formTypeTitle}`,
          };
        },
      },
    }),
    // Inline Carousel/Gallery Block
    defineArrayMember({
      name: 'carousel',
      title: 'Image Carousel',
      type: 'object',
      icon: () => (
        <GalleryHorizontal
          aria-label="Carousel icon"
          size="1em"
          strokeWidth={1}
        />
      ),
      fields: [
        defineField({
          name: 'slides',
          title: 'Images',
          description: 'Add images to the carousel',
          type: 'array',
          of: [
            defineArrayMember({
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
                      description: 'Important for accessibility and SEO. Describes the content and function of the image.',
                      rows: 2,
                      validation: (Rule) => Rule.required(),
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
            }),
          ],
          validation: (Rule) => Rule.min(1).max(10),
        }),
        defineField({
          name: 'slidesPerViewDesktop',
          title: 'Slides per view (Desktop)',
          description: 'How many slides to show at once on desktop',
          type: 'rangeSlider',
          options: {
            min: 1,
            max: 6,
          },
          initialValue: 3,
        }),
        defineField({
          name: 'pagination',
          title: 'Show dot pagination',
          type: 'boolean',
          initialValue: true,
        }),
        defineField({
          name: 'arrows',
          title: 'Show navigation arrows',
          type: 'boolean',
          initialValue: true,
        }),
      ],
      preview: {
        select: {
          slides: 'slides',
          image0: 'slides.0.image',
          slidesPerView: 'slidesPerViewDesktop',
        },
        prepare({slides, image0, slidesPerView}) {
          const count = slides?.length || 0;
          return {
            title: `Image Carousel (${slidesPerView || 3} per view)`,
            subtitle: `${count} image${count !== 1 ? 's' : ''}`,
            media: image0,
          };
        },
      },
    }),
    // Two Column Layout Block
    defineArrayMember({
      name: 'twoColumnBlock',
      title: 'Two Column Layout',
      type: 'object',
      icon: () => (
        <Columns
          aria-label="Two column layout icon"
          size="1em"
          strokeWidth={1}
        />
      ),
      fields: [
        defineField({
          name: 'layout',
          title: 'Column Layout',
          description: 'Choose how the columns should be sized',
          type: 'string',
          options: {
            list: [
              {title: '50% / 50% (Equal)', value: 'equal'},
              {title: '60% / 40% (Content Focus)', value: 'content-focus'},
              {title: '40% / 60% (Media Focus)', value: 'media-focus'},
              {title: '70% / 30% (Heavy Content)', value: 'heavy-content'},
              {title: '30% / 70% (Heavy Media)', value: 'heavy-media'},
            ],
            layout: 'radio',
          },
          initialValue: 'equal',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'verticalAlignment',
          title: 'Vertical Alignment',
          description: 'How should the columns align vertically',
          type: 'string',
          options: {
            list: [
              {title: 'Top', value: 'top'},
              {title: 'Center', value: 'center'},
              {title: 'Bottom', value: 'bottom'},
            ],
            layout: 'radio',
          },
          initialValue: 'top',
        }),
        defineField({
          name: 'gap',
          title: 'Column Gap',
          description: 'Space between the columns',
          type: 'string',
          options: {
            list: [
              {title: 'Small', value: 'small'},
              {title: 'Medium', value: 'medium'},
              {title: 'Large', value: 'large'},
            ],
            layout: 'radio',
          },
          initialValue: 'medium',
        }),
        defineField({
          name: 'leftColumn',
          title: 'Left Column',
          description: 'Content for the left column',
          type: 'columnContent',
        }),
        defineField({
          name: 'rightColumn',
          title: 'Right Column',
          description: 'Content for the right column',
          type: 'columnContent',
        }),
      ],
      preview: {
        select: {
          layout: 'layout',
          leftType: 'leftColumn.contentType',
          rightType: 'rightColumn.contentType',
        },
        prepare({layout, leftType, rightType}) {
          const layoutLabel = layout?.replace('-', ' ') || 'equal';
          return {
            title: `Two Column Layout (${layoutLabel})`,
            subtitle: `${leftType || 'empty'} | ${rightType || 'empty'}`,
          };
        },
      },
    }),
  ],
});
