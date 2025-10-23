import {getAllLocales} from 'countries';
import {defineArrayMember, defineField, defineType} from 'sanity';

import {setShowTrailingZeroKeyValue} from '~/lib/utils';

const GROUPS = [
  {
    name: 'brand',
    default: true,
  },
  {
    name: 'siteProtection',
  },
  {
    name: 'layout',
  },
  {
    name: 'buttons',
  },
  {
    name: 'inputs',
  },
  {
    name: 'cards',
  },
  {
    name: 'media',
  },
  {
    name: 'badges',
  },
  {
    name: 'dropdownsAndPopups',
  },
  {
    name: 'currencyFormat',
  },
  {
    name: 'cart',
  },
  {
    name: 'socialMedia',
  },
];

export default defineType({
  title: 'Settings',
  name: 'settings',
  groups: GROUPS,
  type: 'document',
  __experimental_formPreviewTitle: false,
  fields: [
    defineField({
      name: 'siteName',
      title: 'Site name',
      type: 'string',
      group: 'brand',
      initialValue: 'Fluid',
    }),
    defineField({
      name: 'siteDescription',
      description: 'Short description of your store used for SEO purposes.',
      title: 'Site description',
      type: 'string',
      group: 'brand',
    }),
    defineField({
      name: 'logo',
      type: 'image',
      group: 'brand',
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
        }),
      ],
    }),
    defineField({
      name: 'favicon',
      description: 'Will be scaled down to 32 x 32 px',
      group: 'brand',
      type: 'image',
      options: {
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
        }),
      ],
    }),
    defineField({
      name: 'siteProtection',
      title: 'Site Protection',
      type: 'object',
      group: 'siteProtection',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enable Protection',
          description: 'When enabled, visitors must pass protection requirements to access the site',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'accessMode',
          title: 'Access Mode',
          description: 'Choose how visitors can gain access to the site',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
          options: {
            list: [
              {title: 'Password Only', value: 'password'},
              {title: 'Countdown Only', value: 'countdown'},
              {title: 'Both Required (Password AND Countdown)', value: 'both'},
              {title: 'Either (Password OR Countdown)', value: 'either'},
            ],
            layout: 'radio',
          },
          initialValue: 'password',
        }),
        defineField({
          name: 'password',
          title: 'Password',
          description: 'The password visitors must enter to access the site',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled || !['password', 'both', 'either'].includes(parent?.accessMode),
          validation: (Rule) => Rule.custom((value, context) => {
            const parent = context?.parent as any;
            if (parent?.enabled && ['password', 'both', 'either'].includes(parent?.accessMode) && !value) {
              return 'Password is required when using password access mode';
            }
            return true;
          }),
        }),
        defineField({
          name: 'countdown',
          title: 'Countdown End Date/Time',
          description: 'Site will be accessible after this date/time',
          type: 'datetime',
          hidden: ({parent}) => !parent?.enabled || !['countdown', 'both', 'either'].includes(parent?.accessMode),
          options: {
            dateFormat: 'YYYY-MM-DD',
            timeFormat: 'HH:mm',
            timeStep: 15,
          },
          validation: (Rule) => Rule.custom((value, context) => {
            const parent = context?.parent as any;
            if (parent?.enabled && ['countdown', 'both', 'either'].includes(parent?.accessMode) && !value) {
              return 'Countdown date is required when using countdown access mode';
            }
            return true;
          }),
        }),
        defineField({
          name: 'title',
          title: 'Page Title',
          description: 'Main title shown on the protection page',
          type: 'internationalizedArrayString',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'message',
          title: 'Message',
          description: 'Additional message or description shown below the title',
          type: 'internationalizedArrayText',
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'countdownLabel',
          title: 'Countdown Label',
          description: 'Label shown above the countdown timer (e.g., "Launching in")',
          type: 'internationalizedArrayString',
          hidden: ({parent}) => !parent?.enabled || !['countdown', 'both', 'either'].includes(parent?.accessMode),
        }),
        defineField({
          name: 'passwordLabel',
          title: 'Password Field Label',
          description: 'Label for the password input field',
          type: 'internationalizedArrayString',
          hidden: ({parent}) => !parent?.enabled || !['password', 'both', 'either'].includes(parent?.accessMode),
        }),
        defineField({
          name: 'redirectPage',
          title: 'Redirect After Access',
          description: 'Page to redirect to after successful access (defaults to homepage)',
          type: 'reference',
          to: [{type: 'page'}, {type: 'home'}],
          hidden: ({parent}) => !parent?.enabled,
        }),
        defineField({
          name: 'mediaType',
          title: 'Background Media Type',
          description: 'Choose whether to use an image or video as background',
          type: 'string',
          hidden: ({parent}) => !parent?.enabled,
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
          name: 'backgroundImage',
          title: 'Background Image',
          type: 'image',
          hidden: ({parent}) => !parent?.enabled || parent?.mediaType === 'video',
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
              description: 'Important for accessibility and SEO.',
              rows: 2,
            }),
          ],
        }),
        defineField({
          name: 'backgroundVideo',
          title: 'Background Video',
          description: 'Video for the protection page background',
          type: 'mux.video',
          hidden: ({parent}) => !parent?.enabled || parent?.mediaType !== 'video',
        }),
        defineField({
          name: 'overlayOpacity',
          title: 'Overlay Opacity',
          description: 'Darkness of the overlay on top of the background media',
          type: 'rangeSlider',
          hidden: ({parent}) => !parent?.enabled,
          options: {
            min: 0,
            max: 100,
            suffix: '%',
          },
          initialValue: 40,
        }),
        defineField({
          name: 'colorScheme',
          title: 'Color Scheme',
          description: 'Color scheme for the site protection page (overrides default)',
          type: 'reference',
          to: [{type: 'colorScheme'}],
          hidden: ({parent}) => !parent?.enabled,
        }),
      ],
    }),
    defineField({
      name: 'socialSharingImagePreview',
      description:
        'When you share a link to your store on social media, an image is usually shown in your post. This one will be used if another relevant image cannot be found. (Recommended size: 1200 x 628 px)',
      type: 'image',
      group: 'brand',
      options: {
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
        }),
      ],
    }),
    defineField({
      name: 'spaceBetweenTemplateSections',
      type: 'rangeSlider',
      group: 'layout',
      options: {
        min: 0,
        max: 100,
        suffix: 'px',
      },
      initialValue: 0,
    }),
    defineField({
      name: 'buttonsBorder',
      title: 'Border',
      type: 'object',
      group: 'buttons',
      fields: [...borderFields()],
    }),
    defineField({
      name: 'buttonsShadow',
      title: 'Shadow',
      type: 'object',
      group: 'buttons',
      fields: [...shadowFields()],
    }),
    defineField({
      name: 'inputsBorder',
      title: 'Border',
      type: 'object',
      group: 'inputs',
      fields: [...borderFields()],
    }),
    defineField({
      name: 'inputsShadow',
      title: 'Shadow',
      type: 'object',
      group: 'inputs',
      fields: [...shadowFields()],
    }),
    defineField({
      name: 'productCards',
      type: 'object',
      group: 'cards',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        ...cardFields(),
        defineField({
          name: 'border',
          type: 'object',
          fields: [...borderFields()],
        }),
        defineField({
          name: 'shadow',
          type: 'object',
          fields: [...shadowFields()],
        }),
      ],
    }),
    defineField({
      name: 'collectionCards',
      type: 'object',
      group: 'cards',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        ...cardFields(),
        defineField({
          name: 'border',
          type: 'object',
          fields: [...borderFields()],
        }),
        defineField({
          name: 'shadow',
          type: 'object',
          fields: [...shadowFields()],
        }),
      ],
    }),
    defineField({
      name: 'blogCards',
      type: 'object',
      group: 'cards',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        ...cardFields(),
        defineField({
          name: 'border',
          type: 'object',
          fields: [...borderFields()],
        }),
        defineField({
          name: 'shadow',
          type: 'object',
          fields: [...shadowFields()],
        }),
      ],
    }),
    defineField({
      title: 'Border',
      name: 'mediaBorder',
      type: 'object',
      group: 'media',
      fields: [...borderFields()],
    }),
    defineField({
      title: 'Shadow',
      name: 'mediaShadow',
      type: 'object',
      group: 'media',
      fields: [...shadowFields()],
    }),
    defineField({
      title: 'Border',
      name: 'dropdownsAndPopupsBorder',
      type: 'object',
      group: 'dropdownsAndPopups',
      fields: [...borderFields()],
    }),
    defineField({
      title: 'Shadow',
      name: 'dropdownsAndPopupsShadow',
      type: 'object',
      group: 'dropdownsAndPopups',
      fields: [...shadowFields()],
    }),
    defineField({
      name: 'badgesPosition',
      title: 'Position on cards',
      group: 'badges',
      type: 'string',
      options: {
        list: [
          {
            title: 'Bottom Left',
            value: 'bottom_left',
          },
          {
            title: 'Bottom Right',
            value: 'bottom_right',
          },
          {
            title: 'Top Left',
            value: 'top_left',
          },
          {
            title: 'Top Right',
            value: 'top_right',
          },
        ],
      },
    }),
    defineField({
      name: 'badgesCornerRadius',
      type: 'rangeSlider',
      group: 'badges',
      options: {
        min: 0,
        max: 50,
        suffix: 'px',
      },
      initialValue: 50,
    }),
    defineField({
      name: 'badgesSaleColorScheme',
      title: 'Sale badge color scheme',
      group: 'badges',
      type: 'reference',
      to: [{type: 'colorScheme'}],
    }),
    defineField({
      name: 'badgesSoldOutColorScheme',
      title: 'Sold out badge color scheme',
      group: 'badges',
      type: 'reference',
      to: [{type: 'colorScheme'}],
    }),
    defineField({
      name: 'showCurrencyCodes',
      group: 'currencyFormat',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'showTrailingZeros',
      group: 'currencyFormat',
      description:
        'Select which countries where you want to show trailing zeros ($15.00).',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {
        list: getAllLocales().map((locale) => {
          return {
            title: locale.label,
            value: setShowTrailingZeroKeyValue(locale),
          };
        }),
      },
    }),
    defineField({
      name: 'cartCollection',
      group: 'cart',
      type: 'reference',
      description: 'Visible when cart is empty.',
      to: [{type: 'collection'}],
    }),
    defineField({
      name: 'cartColorScheme',
      description: 'Default color scheme is used if none is set.',
      group: 'cart',
      type: 'reference',
      to: [{type: 'colorScheme'}],
    }),
    defineField({
      name: 'grid',
      type: 'object',
      description: 'Affects areas with multiple columns or rows.',
      group: 'layout',
      fields: [
        defineField({
          name: 'horizontalSpace',
          type: 'rangeSlider',
          options: {
            min: 4,
            max: 40,
            step: 2,
            suffix: 'px',
          },
          initialValue: 10,
        }),
        defineField({
          name: 'verticalSpace',
          type: 'rangeSlider',
          options: {
            min: 4,
            max: 40,
            step: 2,
            suffix: 'px',
          },
          initialValue: 10,
        }),
      ],
    }),
    defineField({
      name: 'facebook',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'instagram',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'tiktok',
      title: 'TikTok',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'twitter',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      title: 'YouTube',
      name: 'youtube',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'linkedin',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'snapchat',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'pinterest',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'tumblr',
      type: 'url',
      group: 'socialMedia',
    }),
    defineField({
      name: 'vimeo',
      type: 'url',
      group: 'socialMedia',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Settings'}),
  },
});

function borderFields() {
  return [
    {
      name: 'thickness',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 12,
        suffix: 'px',
      },
    },
    {
      name: 'opacity',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 100,
        suffix: '%',
      },
    },
    {
      name: 'cornerRadius',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 50,
        suffix: 'px',
      },
    },
  ] as const;
}

function shadowFields() {
  return [
    {
      name: 'opacity',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 100,
        suffix: '%',
      },
    },
    {
      name: 'horizontalOffset',
      type: 'rangeSlider',
      options: {
        min: -12,
        max: 12,
        suffix: 'px',
      },
    },
    {
      name: 'verticalOffset',
      type: 'rangeSlider',
      options: {
        min: -12,
        max: 12,
        suffix: 'px',
      },
    },
    {
      name: 'blur',
      type: 'rangeSlider',
      options: {
        min: 0,
        max: 20,
        suffix: 'px',
      },
    },
  ] as const;
}

function cardFields() {
  return [
    defineField({
      name: 'style',
      type: 'string',
      options: {
        list: [
          {
            title: 'Standard',
            value: 'standard',
          },
          {
            title: 'Card',
            value: 'card',
          },
        ],
      },
    }),
    defineField({
      name: 'imageAspectRatio',
      title: 'Image aspect ratio',
      type: 'aspectRatios',
    }),
    defineField({
      name: 'textAlignment',
      type: 'string',
      options: {
        list: [
          {
            title: 'Left',
            value: 'left',
          },
          {
            title: 'Center',
            value: 'center',
          },
          {
            title: 'Right',
            value: 'right',
          },
        ],
      },
    }),
  ];
}
