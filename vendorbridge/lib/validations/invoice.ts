import { z } from 'zod'

export const invoiceSchema = z.object({
  po_id: z.string().uuid('Valid purchase order is required'),
  due_date: z.string().min(1, 'Due date is required'),
  tax_percent: z.coerce.number().min(0).max(100).default(18),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>
