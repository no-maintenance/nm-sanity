import {Image} from 'lucide-react';
import {defineArrayMember, defineField, defineType} from 'sanity';

/**
 * FW26 Roadmap — the product grid at the very bottom of the /fw26 page.
 *
 * Editable in Studio under "FW26 Roadmap". Each row is a product card:
 * drag the rows to reorder the grid, and fill in the name + price (and,
 * optionally, a link and a "Now available / Releasing soon" toggle).
 *
 * If this document is empty, the /fw26 page falls back to the hardcoded grid
 * in `app/routes/($locale).fw26.tsx` (the ROADMAP list), so the grid never
 * renders blank.
 */
export default defineType({
  name: 'fw26Roadmap',
  title: 'FW26 Roadmap',
  type: 'document',
  __experimental_formPreviewTitle: false,
  fields: [
    defineField({
      name: 'products',
      title: 'Products',
      description:
        'Each row is one card in the bottom grid. Drag the rows to change the order. Name and price are optional — leave them empty to show just the photo.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fw26Product',
          title: 'Product',
          fields: [
            defineField({
              name: 'image',
              title: 'Photo',
              type: 'image',
              icon: Image,
              options: {hotspot: true, aiAssist: {imageDescriptionField: 'alt'}},
              fields: [
                defineField({
                  name: 'alt',
                  type: 'string',
                  title: 'Alt text (for accessibility)',
                }),
              ],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              description: 'Product name shown under the photo. Leave empty to hide.',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Description (hover overlay)',
              description:
                'Shown centered over the photo on hover (like the Velum/Torai cards). Leave empty for no overlay.',
              type: 'text',
              rows: 4,
            }),
            defineField({
              name: 'price',
              title: 'Price',
              description: 'Numbers only, e.g. 290. A "$" is added automatically. Leave empty to hide.',
              type: 'string',
            }),
            defineField({
              name: 'available',
              title: 'Now available?',
              description:
                'On = "NOW AVAILABLE" next to the price. Off = "RELEASING SOON".',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'soldOut',
              title: 'Sold out?',
              description:
                'On = "SOLD OUT" label under the photo; the card is no longer clickable. Overrides the availability label.',
              type: 'boolean',
              initialValue: false,
            }),
            defineField({
              name: 'url',
              title: 'Link (optional)',
              description:
                'If set, the whole card becomes clickable, e.g. https://nomaintenance.us/products/...',
              type: 'string',
            }),
          ],
          preview: {
            select: {title: 'name', price: 'price', media: 'image'},
            prepare: ({title, price, media}) => ({
              title: title || '(no name yet)',
              subtitle: price ? `$${price}` : '',
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'FW26 Roadmap'}),
  },
});
