import {
  BadgeDollarSign,
  ExternalLink,
  Link,
  ShoppingCart,
  Text,
  Type,
} from 'lucide-react';
import {defineArrayMember, defineField} from 'sanity';

export default defineField({
  name: 'productBaseRichtext',
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
      name: 'productDetails',
      title: 'Product Details',
      type: 'object',
      readOnly: true,
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
          readOnly: true,
          initialValue: 'Product Details',
          hidden: true,
        })
      ],
      description: 'Displays the details rich text associated with the current product',
      icon: () => <Text size="18px" />,
      preview: {
        prepare: () => {
          return {
            title: 'Product Details',
          };
        },
      },
    }),
  ],
}); 