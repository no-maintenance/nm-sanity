import {
  BadgeDollarSign,
  ChevronDown,
  ExternalLink,
  FileText,
  Link,
  ShoppingCart,
  Text,
  Type,
} from 'lucide-react';
import {defineArrayMember, defineField} from 'sanity';

export default defineField({
  name: 'productRichtext',
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
      name: 'shopifyTitle',
      title: 'Title',
      type: 'object',
      fields: [
        defineField({
          name: 'titleProxy',
          title: 'Title',
          type: 'proxyString',
          options: {field: 'store.title'},
        }),
      ],
      icon: () => <Type size="18px" />,
      preview: {
        prepare: () => {
          return {
            title: 'Title',
          };
        },
      },
    }),
    defineArrayMember({
      name: 'shopifyDescription',
      title: 'Description',
      type: 'object',
      fields: [
        defineField({
          name: 'descriptionProxy',
          title: 'Description',
          type: 'proxyString',
          options: {field: 'store.descriptionHtml'},
        }),
      ],
      icon: () => <Text size="18px" />,
      preview: {
        prepare: () => {
          return {
            title: 'Description',
          };
        },
      },
    }),
    defineArrayMember({
      name: 'price',
      type: 'object',
      fields: [
        defineField({
          name: 'priceProxy',
          title: 'Price',
          type: 'proxyString',
          options: {field: 'store.priceRange.minVariantPrice'},
        }),
        defineField({
          name: 'showShopifyBrand',
          title: 'Show Brand',
          type: 'boolean',
          description: 'Show the brand name alongside the price',
          initialValue: false,
        }),
      ],
      icon: () => <BadgeDollarSign size="18px" />,
      preview: {
        prepare: () => {
          return {
            title: 'Price',
          };
        },
      },
    }),
    defineArrayMember({
      name: 'addToCartButton',
      type: 'object',
      fields: [
        defineField({
          name: 'quantitySelector',
          type: 'boolean',
        }),
        defineField({
          name: 'shopPayButton',
          type: 'boolean',
        }),
      ],
      icon: () => <ShoppingCart size="18px" />,
      preview: {
        prepare: () => {
          return {
            title: 'Add to cart button',
          };
        },
      },
    }),
    defineArrayMember({
      name: 'shopifyAccordion',
      title: 'Accordion',
      type: 'object',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'contentType',
          title: 'Content Type',
          type: 'string',
          options: {
            list: [
              { title: 'Product Description', value: 'description' },
              { title: 'Shipping Information', value: 'shipping' },
              { title: 'Custom Content', value: 'custom' },
            ],
            layout: 'radio',
          },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'customContent',
          title: 'Custom Content',
          type: 'array',
          of: [{ type: 'block' }],
          hidden: ({ parent }) => parent?.contentType !== 'custom',
        }),
        defineField({
          name: 'defaultOpen',
          title: 'Default Open',
          type: 'boolean',
          initialValue: false,
        }),
      ],
      icon: () => <ChevronDown size="18px" />,
      preview: {
        select: {
          title: 'title',
          contentType: 'contentType',
        },
        prepare: ({ title, contentType }) => {
          return {
            title: title || 'Accordion',
            subtitle: contentType ? `Content: ${contentType}` : '',
          };
        },
      },
    }),
    defineArrayMember({
      name: 'productModal',
      title: 'Modal',
      type: 'productModal',
      icon: () => <FileText size="18px" />,
    }),
  ],
});
