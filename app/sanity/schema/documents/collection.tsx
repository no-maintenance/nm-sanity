import {PackageIcon} from '@sanity/icons';
import pluralize from 'pluralize-esm';
import {defineField, defineType} from 'sanity';

import ShopifyIcon from '../../components/icons/shopify-icon';
import CollectionHiddenInput from '../../components/shopify/collection-hidden';
import ShopifyDocumentStatus from '../../components/shopify/shopify-document-status';

const GROUPS = [
  {
    name: 'theme',
    title: 'Theme',
  },
  {
    default: true,
    name: 'editorial',
    title: 'Editorial',
  },
  {
    name: 'shopifySync',
    title: 'Shopify sync',
    icon: ShopifyIcon,
  },
  {
    name: 'seo',
    title: 'SEO',
  },
];

export default defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  __experimental_formPreviewTitle: false,
  icon: PackageIcon,
  groups: GROUPS,
  fields: [
    // Product hidden status
    defineField({
      name: 'hidden',
      type: 'string',
      components: {
        field: CollectionHiddenInput,
      },
      hidden: ({parent}) => {
        const isDeleted = parent?.store?.isDeleted;
        return !isDeleted;
      },
    }),
    // Title (proxy)
    defineField({
      name: 'titleProxy',
      title: 'Title',
      type: 'proxyString',
      options: {field: 'store.title'},
    }),
    // Slug (proxy)
    defineField({
      name: 'slugProxy',
      title: 'Slug',
      type: 'proxyString',
      options: {field: 'store.slug.current'},
    }),
    // Template
    defineField({
      name: 'template',
      description:
        'Select a template to use for this collection. If no template is selected, the default template will be used.',
      type: 'reference',
      to: [{type: 'collectionTemplate'}],
      group: 'editorial',
    }),
    // Protection Configuration
    defineField({
      name: 'protectionConfig',
      title: 'Collection Protection',
      description:
        'Optional protection for this collection. When set, visitors must authenticate to view this collection and its products. Overrides global site protection.',
      type: 'reference',
      to: [{type: 'protectionConfig'}],
      group: 'editorial',
    }),
    // Vector
    // defineField({
    //   name: 'vector',
    //   title: 'Vector artwork',
    //   type: 'image',
    //   description: 'Displayed in collection links using color theme',
    //   options: {
    //     accept: 'image/svg+xml',
    //   },
    //   group: 'theme',
    //   validation: (Rule) =>
    //     Rule.custom((image) => {
    //       if (!image?.asset?._ref) {
    //         return true
    //       }

    //       const format = getExtension(image.asset._ref)

    //       if (format !== 'svg') {
    //         return 'Image must be an SVG'
    //       }
    //       return true
    //     }),
    // }),

    // Shopify collection
    defineField({
      name: 'store',
      title: 'Shopify',
      type: 'shopifyCollection',
      description: 'Collection data from Shopify (read-only)',
      group: 'shopifySync',
    }),
  ],
  orderings: [
    {
      name: 'titleAsc',
      title: 'Title (A-Z)',
      by: [{field: 'store.title', direction: 'asc'}],
    },
    {
      name: 'titleDesc',
      title: 'Title (Z-A)',
      by: [{field: 'store.title', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      imageUrl: 'store.imageUrl',
      isDeleted: 'store.isDeleted',
      rules: 'store.rules',
      title: 'store.title',
      protectionConfig: 'protectionConfig',
    },
    prepare(selection) {
      const {imageUrl, isDeleted, rules, title, protectionConfig} = selection;
      const ruleCount = rules?.length || 0;
      const isProtected = !!protectionConfig;

      const baseSubtitle = ruleCount > 0
        ? `Automated (${pluralize('rule', ruleCount, true)})`
        : 'Manual';

      const subtitle = isProtected
        ? `🔒 Protected • ${baseSubtitle}`
        : baseSubtitle;

      return {
        media: (
          <ShopifyDocumentStatus
            isDeleted={isDeleted}
            title={title}
            type="collection"
            url={imageUrl}
          />
        ),
        subtitle,
        title,
      };
    },
  },
});
