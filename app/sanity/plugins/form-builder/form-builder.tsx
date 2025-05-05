import { FormInput } from 'lucide-react'
import { defineType } from 'sanity'
export default defineType({
  name: 'formBuilder',
  title: 'Form Builder',
  icon: FormInput,
  type: 'object',
  fields: [
    {
      name: 'formFields',
      title: 'Form Fields',
      type: 'array',
      of: [{type: 'formFields'}],
    },
    {
      name: 'formId',
      title: 'Form ID',
      type: 'string',
    },
  ],
  preview: {
    prepare() {
      return {
        title: `Custom form setup`,
        subtitle: `Form Builder`,
        media: FormInput,
      }
    },
  },
})
