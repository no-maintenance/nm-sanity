import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'protectionConfig',
  title: 'Protection Configuration',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Configuration Name',
      description: 'A name to identify this protection configuration (e.g., "BFCM Early Access", "VIP Member Launch")',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Optional description of when and how this protection config should be used',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'enabled',
      title: 'Enable Protection',
      description: 'When enabled, visitors must pass protection requirements to access protected content',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'accessMode',
      title: 'Access Mode',
      description: 'Choose how visitors can gain access to the protected content',
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
      validation: (Rule) => Rule.custom((value, context) => {
        const parent = context?.parent as any;
        if (parent?.enabled && !value) {
          return 'Access Mode is required when protection is enabled';
        }
        return true;
      }),
    }),
    defineField({
      name: 'password',
      title: 'Password',
      description: 'The password visitors must enter to access the protected content',
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
      description: 'Content will be accessible after this date/time',
      type: 'datetime',
      hidden: ({parent}) => !parent?.enabled || !['countdown', 'both', 'either'].includes(parent?.accessMode),
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
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
      name: 'passwordGrantedTitle',
      title: 'Password Granted - Title',
      description: 'Title shown when password is correct but countdown is still active (for "both" and "either" modes)',
      type: 'internationalizedArrayString',
      hidden: ({parent}) => !parent?.enabled || !['both', 'either'].includes(parent?.accessMode),
    }),
    defineField({
      name: 'passwordGrantedMessage',
      title: 'Password Granted - Message',
      description: 'Message shown when password is correct but countdown is still active',
      type: 'internationalizedArrayText',
      hidden: ({parent}) => !parent?.enabled || !['both', 'either'].includes(parent?.accessMode),
    }),
    defineField({
      name: 'countdownExpiredTitle',
      title: 'Countdown Expired - Title',
      description: 'Title shown when countdown has ended but password is still required (for "both" and "either" modes)',
      type: 'internationalizedArrayString',
      hidden: ({parent}) => !parent?.enabled || !['both', 'either'].includes(parent?.accessMode),
    }),
    defineField({
      name: 'countdownExpiredMessage',
      title: 'Countdown Expired - Message',
      description: 'Message shown when countdown has ended but password is still required',
      type: 'internationalizedArrayText',
      hidden: ({parent}) => !parent?.enabled || !['both', 'either'].includes(parent?.accessMode),
    }),
    defineField({
      name: 'redirectPage',
      title: 'Redirect After Access',
      description: 'Page to redirect to after successful access (defaults to homepage)',
      type: 'reference',
      to: [{type: 'page'}, {type: 'home'}, {type: 'collection'}, {type: 'product'}],
      hidden: ({parent}) => !parent?.enabled,
    }),
    defineField({
      name: 'embeddedPuzzle',
      title: 'Embedded Puzzle',
      description: 'Optional: Embed a Strands puzzle that appears immediately (puzzle completion can grant access)',
      type: 'reference',
      to: [{type: 'strandsPuzzle'}],
      hidden: ({parent}) => !parent?.enabled,
    }),
    defineField({
      name: 'puzzleGrantsAccess',
      title: 'Puzzle Completion Grants Access',
      description: 'When enabled, completing the puzzle can grant access based on the access mode',
      type: 'boolean',
      initialValue: true,
      hidden: ({parent}) => !parent?.enabled || !parent?.embeddedPuzzle,
    }),
    defineField({
      name: 'puzzleCompletionMessage',
      title: 'Puzzle Completion Message',
      description: 'Message shown when puzzle is completed (e.g., promo code or success message)',
      type: 'internationalizedArrayText',
      hidden: ({parent}) => !parent?.enabled || !parent?.embeddedPuzzle,
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
      description: 'Color scheme for the protection page (overrides default)',
      type: 'reference',
      to: [{type: 'colorScheme'}],
      hidden: ({parent}) => !parent?.enabled,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      enabled: 'enabled',
      accessMode: 'accessMode',
      password: 'password',
      countdown: 'countdown',
    },
    prepare({title, enabled, accessMode, password, countdown}) {
      const subtitle = enabled
        ? `${accessMode?.toUpperCase()} mode ${password ? '(Password set)' : ''} ${countdown ? '(Countdown set)' : ''}`
        : 'DISABLED';

      return {
        title,
        subtitle,
        // media: enabled ? '🔒' : '🔓',
      };
    },
  },
  orderings: [
    {
      title: 'Name',
      name: 'name',
      by: [
        {field: 'name', direction: 'asc'},
      ],
    },
    {
      title: 'Recently Updated',
      name: 'updatedDesc',
      by: [
        {field: '_updatedAt', direction: 'desc'},
      ],
    },
  ],
})