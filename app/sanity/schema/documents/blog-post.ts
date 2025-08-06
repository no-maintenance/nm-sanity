import {Calendar, MapPin, Users} from 'lucide-react';
import {defineField, defineType, defineArrayMember} from 'sanity';



export default defineType({
  name: 'blogPost',
  title: 'Editorials',
  type: 'document',
  icon: Calendar,
  __experimental_formPreviewTitle: false,
  groups: [
    {
      name: 'content',
      title: 'Content',
      default: true,
    },
    {
      name: 'editorial',
      title: 'Editorial Info',
      icon: Users,
    },
    {
      name: 'publishing',
      title: 'Publishing',
      icon: Calendar,
    },
  ],
  fields: [
    // BASIC CONTENT
    defineField({
      name: 'title',
      type: 'internationalizedArrayString',
      title: 'Title',
      description: 'The title of this editorial',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      group: 'content',
      description: 'Unique URL path for this editorial, generated from the title',
      options: {
        source: (doc: any) => doc.title?.[0]?.value,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      type: 'internationalizedArrayText',
      title: 'Excerpt',
      description: 'Short description that appears in editorial listings',
      group: 'content',
      validation: (Rule) => Rule.max(160).warning('Keep under 160 characters for SEO'),
    }),
    defineField({
      name: 'sections',
      type: 'sections',
      title: 'Content',
      description: 'Build your editorial content using sections',
      group: 'content',
    }),
    defineField({
      name: 'featuredImage',
      type: 'image',
      title: 'Featured Image',
      description: 'Main cover image for this editorial',
      group: 'content',
      options: {
        hotspot: true,
        aiAssist: {
          imageDescriptionField: 'alt',
        },
      },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Describe the image for accessibility and SEO',
        }),
      ],
    }),

    // EDITORIAL METADATA
    defineField({
      name: 'season',
      type: 'string',
      title: 'Season',
      description: 'Fashion season or collection name (e.g., "AW 24", "SS 25", "Resort 2024")',
      group: 'editorial',
      icon: Calendar,
    }),
    defineField({
      name: 'location',
      type: 'internationalizedArrayString',
      title: 'Location',
      description: 'Where this editorial was shot (e.g., "NIKKEI SEKAI TOWER, TOKYO, JAPAN")',
      group: 'editorial',
      icon: MapPin,
    }),
    defineField({
      name: 'credits',
      type: 'array',
      title: 'Credits',
      description: 'People and their roles in this editorial',
      group: 'editorial',
      icon: Users,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'credit',
          title: 'Credit',
          fields: [
            defineField({
              name: 'role',
              type: 'string',
              title: 'Role',
              description: 'e.g., Photography, Styling, Model, Creative Direction',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'name',
              type: 'string',
              title: 'Name',
              description: 'Person or company name',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              role: 'role',
              name: 'name',
            },
            prepare({role, name}) {
              return {
                title: `${role}: ${name}`,
                subtitle: role,
              };
            },
          },
        }),
      ],
    }),

    // PUBLISHING & ORGANIZATION
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      title: 'Publication Date',
      description: 'When this editorial was published. Defaults to current date/time if not set.',
      group: 'publishing',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'categories',
      type: 'array',
      title: 'Categories',
      description: 'Categorize this editorial',
      group: 'publishing',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'blogCategory'}],
        }),
      ],
    }),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      description: 'Add tags for better organization and search',
      group: 'publishing',
      of: [
        defineArrayMember({
          type: 'string',
        }),
      ],
      options: {
        layout: 'tags',
      },
    }),

    // SEO & TECHNICAL
    defineField({
      name: 'seo',
      type: 'seo',
      group: 'publishing',
    })
  ],
  orderings: [
    {
      title: 'Publication Date (Newest First)',
      name: 'publishedAtDesc',
      by: [
        {field: 'publishedAt', direction: 'desc'},
        {field: '_createdAt', direction: 'desc'},
      ],
    },
    {
      title: 'Season (A-Z)',
      name: 'seasonAsc',
      by: [
        {field: 'season', direction: 'asc'},
        {field: 'publishedAt', direction: 'desc'},
      ],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      season: 'season',
      location: 'location',
      featuredImage: 'featuredImage',
      publishedAt: 'publishedAt',
    },
    prepare({title, season, location, featuredImage, publishedAt}) {
      const titleText = title?.[0]?.value || 'Untitled Editorial';
      const locationText = location?.[0]?.value;
      const subtitle = [season, locationText].filter(Boolean).join(' • ');
      const publishedDate = publishedAt ? new Date(publishedAt).toLocaleDateString() : '';
      
      return {
        title: titleText,
        subtitle: subtitle || 'No season or location set',
        media: featuredImage,
        description: publishedDate ? `Published ${publishedDate}` : 'Not yet published',
      };
    },
  },
});
