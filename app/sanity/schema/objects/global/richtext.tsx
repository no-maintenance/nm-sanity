import {ExternalLink, Link, SquareMousePointer} from 'lucide-react';
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
  ],
});
