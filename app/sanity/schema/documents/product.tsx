import {uuid} from '@sanity/uuid';
import pluralize from 'pluralize-esm';
import {defineField, defineType} from 'sanity';

import ShopifyIcon from '../../components/icons/shopify-icon';
import ProductHiddenInput from '../../components/shopify/product-hidden';
import ShopifyDocumentStatus from '../../components/shopify/shopify-document-status';
import {getPriceRange} from '../../utils/get-price-range';

const GROUPS = [
  {
    name: 'editorial',
    title: 'Editorial',
    default: true,
  },
  {
    name: 'shopifySync',
    title: 'Shopify sync',
    icon: ShopifyIcon,
  },
];

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  __experimental_formPreviewTitle: false,
  groups: GROUPS,
  fields: [
    defineField({
      name: 'hidden',
      type: 'string',
      components: {
        field: ProductHiddenInput,
      },
      group: GROUPS.map((group) => group.name),
      hidden: ({parent}) => {
        const isActive = parent?.store?.status === 'active';
        const isDeleted = parent?.store?.isDeleted;
        return !parent?.store || (isActive && !isDeleted);
      },
    }),
    // Template
    defineField({
      name: 'template',
      description:
        'Select a template to use for this product. If no template is selected, the default template will be used.',
      type: 'reference',
      to: [{type: 'productTemplate'}],
      group: 'editorial',
    }),
    defineField({
      name: 'sizeChart',
      title: 'Size Chart',
      type: 'reference',
      to: [{type: 'sizeChart'}],
      group: 'editorial',
    }),
    defineField({
      name: 'extraProductInformation',
      title: 'Details',
      description: 'Detailed product information, displayed as rich text. This can be pulled into product templates via modal or rich text components.',
      type: 'internationalizedArrayRichtext',
      group: 'editorial',
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
    defineField({
      name: 'store',
      title: 'Shopify',
      type: 'shopifyProduct',
      description: 'Product data from Shopify (read-only)',
      group: 'shopifySync',
    }),
  ],
  initialValue: () => ({
    sections: [
      {
        _type: 'productInformationSection',
        _key: uuid(),
      },
    ],
  }),
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
    {
      name: 'priceDesc',
      title: 'Price (Highest first)',
      by: [{field: 'store.priceRange.minVariantPrice', direction: 'desc'}],
    },
    {
      name: 'priceAsc',
      title: 'Price (Lowest first)',
      by: [{field: 'store.priceRange.minVariantPrice', direction: 'asc'}],
    },
  ],

  preview: {
    select: {
      isDeleted: 'store.isDeleted',
      options: 'store.options',
      previewImageUrl: 'store.previewImageUrl',
      priceRange: 'store.priceRange',
      status: 'store.status',
      title: 'store.title',
      variants: 'store.variants',
    },
    prepare(selection) {
      const {
        isDeleted,
        options,
        previewImageUrl,
        priceRange,
        status,
        title,
        variants,
      } = selection;

      const optionCount = options?.length;
      const variantCount = variants?.length;

      const description = [
        variantCount ? pluralize('variant', variantCount, true) : 'No variants',
        optionCount ? pluralize('option', optionCount, true) : 'No options',
      ];

      let subtitle = getPriceRange(priceRange);
      if (status !== 'active') {
        subtitle = '(Unavailable in Shopify)';
      }
      if (isDeleted) {
        subtitle = '(Deleted from Shopify)';
      }

      return {
        description: description.join(' / '),
        subtitle,
        title,
        media: () => (
          <ShopifyDocumentStatus
            isActive={status === 'active'}
            isDeleted={isDeleted}
            title={title}
            type="product"
            url={previewImageUrl}
          />
        ),
      };
    },
  },
});
