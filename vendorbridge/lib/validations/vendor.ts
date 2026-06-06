import { z } from 'zod'

export const vendorSchema = z.object({
  name: z.string().min(2, 'Vendor name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  category: z.string().optional(),
  gst_number: z.string().optional(),
  pan_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  contact_person: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blacklisted']),
})

export type VendorFormValues = z.infer<typeof vendorSchema>
