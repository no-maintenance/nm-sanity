import {defineField, defineType} from 'sanity';

const GROUPS = [
  {
    name: 'navigation',
    title: 'Navigation',
    default: true,
  },
  {
    name: 'announcementBar',
    title: 'Announcement Bar',
  },
  {
    name: 'settings',
    title: 'Settings',
  },
];

export default defineType({
  name: 'header',
  type: 'document',
  __experimental_formPreviewTitle: false,
  groups: GROUPS,
  fields: [
    defineField({
      name: 'announcementBar',
      group: 'announcementBar',
      type: 'internationalizedArrayAnnouncementBar',
    }),
    defineField({
      name: 'announcementBarColorScheme',
      type: 'reference',
      group: 'announcementBar',
      to: [{type: 'colorScheme'}],
    }),
    defineField({
      name: 'autoRotateAnnouncements',
      type: 'boolean',
      group: 'announcementBar',
      initialValue: false,
    }),
    defineField({
      name: 'menu',
      group: 'navigation',
      type: 'internationalizedArrayHeaderNavigation',
    }),
    defineField({
      name: 'colorScheme',
      title: 'Color scheme',
      type: 'reference',
      group: 'settings',
      to: [{type: 'colorScheme'}],
    }),
    defineField({
      name: 'blur',
      title: 'Background blur',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    }),
    defineField({
      name: 'sticky',
      title: 'Sticky header',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'On scroll up', value: 'onScrollUp'},
          {title: 'Always', value: 'always'},
        ],
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'enableFluidHeader',
      title: 'Enable fluid header',
      description: 'When enabled, the header will be transparent at the top of the page and become solid when scrolling',
      type: 'boolean',
      group: 'settings',
      initialValue: false,
    }),
    defineField({
      name: 'fluidHeaderOnHomePage',
      title: 'Enable fluid header on home page',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
      hidden: ({parent}) => !parent?.enableFluidHeader,
    }),
    defineField({
      name: 'fluidHeaderTextColor',
      title: 'Fluid header text color (when transparent)',
      description: 'Choose the text color to use when the header is transparent',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'White', value: 'white'},
          {title: 'Black', value: 'black'},
          {title: 'Current foreground color', value: 'foreground'},
        ],
      },
      initialValue: 'white',
      hidden: ({parent}) => !parent?.enableFluidHeader,
    }),
    defineField({
      name: 'showSearchIcon',
      title: 'Show search icon',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'showCountrySelectorIcon',
      title: 'Show country selector icon',
      type: 'boolean',
      group: 'settings',
      initialValue: true
    }),
    defineField({
      name: 'showSeparatorLine',
      title: 'Show separator line',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'showHamburgerMenuOnDesktop',
      title: 'Show hamburger menu on desktop',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    }),
    defineField({
      name: 'logoPosition',
      title: 'Logo position',
      type: 'string',
      group: 'settings',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Center', value: 'center'},
          {title: 'Right', value: 'right'},
        ],
      },
      initialValue: 'center',
    }),
    defineField({
      name: 'padding',
      title: 'Header padding',
      type: 'padding',
      group: 'settings',
    }),
    defineField({
      name: 'desktopLogoWidth',
      title: 'Desktop logo width',
      type: 'rangeSlider',
      group: 'settings',
      options: {
        min: 0,
        max: 400,
        suffix: 'px',
      },
      initialValue: 100,
      validation: (Rule) => Rule.min(0).max(400),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Header'}),
  },
});
