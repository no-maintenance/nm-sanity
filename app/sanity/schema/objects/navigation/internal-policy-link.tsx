import {defineField, defineType} from 'sanity';
import {LinkIcon} from 'lucide-react';

export default defineType({
  name: 'internalPolicyLink',
  title: 'Policy Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'reference',
      title: 'Reference',
      type: 'reference',
      to: [{type: 'storePolicy'}],
      validation: Rule => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'reference.title',
      subtitle: 'reference.policyType',
    },
    prepare({title, subtitle}: {title?: Array<{value: string}>, subtitle?: string}) {
      const policyTypes: Record<string, string> = {
        privacyPolicy: 'Privacy Policy',
        shippingPolicy: 'Shipping Policy',
        refundPolicy: 'Refund Policy',
        termsOfService: 'Terms of Service',
        legalNotice: 'Legal Notice',
      };
      
      return {
        title: title?.[0]?.value || 'Policy Link',
        subtitle: `Policy: ${policyTypes[subtitle as keyof typeof policyTypes] || subtitle || 'Unknown'}`,
      };
    },
  },
});
