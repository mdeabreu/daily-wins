import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

export const Wins: CollectionConfig = {
  slug: 'wins',
  admin: {
    useAsTitle: 'name',
  },
  orderable: true,
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
