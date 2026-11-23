import {Inbox} from 'lucide-react';
import {defineField, defineType} from 'sanity';

/**
 * A copy of every contact / appointment form submission, written by
 * /api/contact when SANITY_WRITE_TOKEN is configured. The email to the
 * support inbox is the primary delivery; this is the backup record.
 */
export default defineType({
  name: 'contactRequest',
  title: 'Contact request',
  type: 'document',
  icon: Inbox,
  readOnly: true,
  fields: [
    defineField({
      name: 'kind',
      title: 'Form',
      type: 'string',
      options: {
        list: [
          {title: 'Contact', value: 'contact'},
          {title: 'Appointment', value: 'appointment'},
        ],
      },
    }),
    defineField({name: 'name', title: 'Name', type: 'string'}),
    defineField({name: 'email', title: 'Email', type: 'string'}),
    defineField({name: 'details', title: 'Details', type: 'text', rows: 4}),
    defineField({name: 'message', title: 'Message', type: 'text', rows: 8}),
    defineField({name: 'receivedAt', title: 'Received', type: 'datetime'}),
  ],
  orderings: [
    {
      name: 'newest',
      title: 'Newest first',
      by: [{field: 'receivedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {name: 'name', kind: 'kind', receivedAt: 'receivedAt', email: 'email'},
    prepare({name, kind, receivedAt, email}) {
      const when = receivedAt ? new Date(receivedAt).toLocaleString('en-US') : '';
      return {
        title: `${name || email || 'Unknown'}${kind === 'appointment' ? ' · Appointment' : ''}`,
        subtitle: when,
      };
    },
  },
});
