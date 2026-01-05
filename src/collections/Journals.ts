import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const Journals: CollectionConfig = {
  slug: 'journals',
  admin: {
    useAsTitle: 'date',
    defaultColumns: ['date', 'rating', 'journal', 'wins'],
  },
  defaultSort: '-date',
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMM yyy',
        },
      },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
    },
    {
      name: 'journal',
      type: 'textarea',
    },
    {
      name: 'wins',
      type: 'array',
      fields: [
        {
          name: 'win',
          type: 'relationship',
          relationTo: 'wins',
          required: true,
        },
        {
          name: 'note',
          type: 'textarea',
        },
        {
          name: 'completed',
          type: 'checkbox',
        },
      ],
    },
  ],
}
