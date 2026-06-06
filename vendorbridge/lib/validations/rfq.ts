import { z } from 'zod'

export const rfqItemSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
})

export const rfqSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  items: z.array(rfqItemSchema).min(1, 'At least one item is required'),
  vendor_ids: z.array(z.string()).min(1, 'At least one vendor must be selected'),
})

export type RFQFormValues = z.infer<typeof rfqSchema>
export type RFQItemFormValues = z.infer<typeof rfqItemSchema>
