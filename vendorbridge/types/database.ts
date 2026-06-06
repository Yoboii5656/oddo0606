export type UserRole = 'admin' | 'procurement_officer' | 'manager' | 'vendor'

export type VendorStatus = 'active' | 'inactive' | 'blacklisted'

export type RFQStatus = 'draft' | 'open' | 'under_review' | 'approved' | 'closed' | 'cancelled'

export type QuotationStatus = 'draft' | 'submitted' | 'accepted' | 'rejected'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type POStatus = 'issued' | 'delivered' | 'cancelled'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'

export type RFQVendorStatus = 'invited' | 'submitted' | 'declined'

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  email: string
  phone: string | null
  category: string | null
  gst_number: string | null
  pan_number: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  status: VendorStatus
  rating: number | null
  contact_person: string | null
  user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RFQ {
  id: string
  rfq_number: string
  title: string
  description: string | null
  status: RFQStatus
  deadline: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RFQItem {
  id: string
  rfq_id: string
  product_name: string
  description: string | null
  quantity: number
  unit: string
  created_at: string
}

export interface RFQVendor {
  id: string
  rfq_id: string
  vendor_id: string
  invited_at: string
  status: RFQVendorStatus
}

export interface Quotation {
  id: string
  rfq_id: string
  vendor_id: string
  status: QuotationStatus
  delivery_days: number | null
  notes: string | null
  total_amount: number | null
  submitted_at: string
  updated_at: string
}

export interface QuotationItem {
  id: string
  quotation_id: string
  rfq_item_id: string
  unit_price: number
  quantity: number
  total_price: number
}

export interface Approval {
  id: string
  quotation_id: string
  requested_by: string | null
  approved_by: string | null
  status: ApprovalStatus
  remarks: string | null
  requested_at: string
  actioned_at: string | null
}

export interface PurchaseOrder {
  id: string
  po_number: string
  quotation_id: string | null
  vendor_id: string | null
  rfq_id: string | null
  status: POStatus
  delivery_date: string | null
  total_amount: number | null
  created_by: string | null
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  po_id: string | null
  vendor_id: string | null
  status: InvoiceStatus
  subtotal: number | null
  tax_percent: number
  tax_amount: number | null
  total_amount: number | null
  due_date: string | null
  sent_at: string | null
  paid_at: string | null
  created_at: string
}

export interface Attachment {
  id: string
  entity_type: 'rfq' | 'quotation' | 'invoice'
  entity_id: string
  file_name: string
  file_path: string
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
}
