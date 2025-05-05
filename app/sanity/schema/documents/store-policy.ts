import {defineField, defineType} from 'sanity';
import {FileTextIcon} from 'lucide-react';

export default defineType({
  name: 'storePolicy',
  title: 'Store Policies',
  type: 'document',
  __experimental_formPreviewTitle: false,
  fields: [
    defineField({
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Title',
      description: 'The title for this policy page (defaults to Shopify policy title)',
    }),
    defineField({
      name: 'policyType',
      type: 'string',
      title: 'Policy Type',
      description: 'Select which Shopify policy to display',
      options: {
        list: [
          {title: 'Privacy Policy', value: 'privacyPolicy'},
          {title: 'Shipping Policy', value: 'shippingPolicy'},
          {title: 'Refund Policy', value: 'refundPolicy'},
          {title: 'Terms of Service', value: 'termsOfService'},
          {title: 'Legal Notice', value: 'legalNotice'},
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'additionalContent',
      type: 'richtext',
      title: 'Additional Content',
      description: 'Optional content to display before the Shopify policy text',
    }),
    defineField({
      name: 'sections',
      type: 'sections',
      title: 'Additional Sections',
      description: 'Optional sections to display after the policy content',
    }),
    defineField({
      name: 'seo',
      type: 'seo',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'The URL path for this policy page',
      validation: Rule => Rule.required(),
    }),
  ],
  
  preview: {
    select: {
      title: 'title',
      policyType: 'policyType',
    },
    prepare({title, policyType}: {title?: Array<{value: string}>, policyType?: string}) {
      const policyTypes: Record<string, string> = {
        privacyPolicy: 'Privacy Policy',
        shippingPolicy: 'Shipping Policy',
        refundPolicy: 'Refund Policy',
        termsOfService: 'Terms of Service',
        legalNotice: 'Legal Notice',
      };
      
      return {
        title: title?.[0]?.value || (policyType && policyTypes[policyType]) || 'No title',
        subtitle: `Policy Page - ${(policyType && policyTypes[policyType]) || policyType || ''}`,
      };
    },
  },
});
