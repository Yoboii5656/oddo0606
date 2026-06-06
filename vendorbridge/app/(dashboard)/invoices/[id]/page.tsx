'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, Printer, Send } from 'lucide-react'
import type { Invoice, PurchaseOrder, Vendor, QuotationItem, RFQItem } from '@/types/database'

interface InvoiceDetail extends Invoice {
  vendors: {
    name: string
    email: string
    address: string | null
    city: string | null
    state: string | null
    gst_number: string | null
  } | null
  purchase_orders: (PurchaseOrder & {
    rfqs: { title: string; rfq_number: string } | null
    quotations_data: {
      id: string
      quotation_items: (QuotationItem & { rfq_items: RFQItem | null })[]
    } | null
  }) | null
}

interface LineItem {
  product_name: string
  quantity: number
  unit_price: number
  total: number
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      // Fetch invoice with vendor and PO details
      const { data } = await supabase
        .from('invoices')
        .select(`
          *,
          vendors:vendor_id (name, email, address, city, state, gst_number),
          purchase_orders:po_id (
            *,
            rfqs:rfq_id (title, rfq_number)
          )
        `)
        .eq('id', params.id)
        .single()

      if (data) {
        setInvoice(data as unknown as InvoiceDetail)

        // Fetch line items from quotation linked to the PO
        if (data.purchase_orders?.quotation_id) {
          const { data: qItems } = await supabase
            .from('quotation_items')
            .select(`*, rfq_items:rfq_item_id (product_name, unit)`)
            .eq('quotation_id', data.purchase_orders.quotation_id)

          if (qItems) {
            const items: LineItem[] = qItems.map((qi: any) => ({
              product_name: qi.rfq_items?.product_name || 'Item',
              quantity: qi.quantity,
              unit_price: qi.unit_price,
              total: qi.total_price || qi.unit_price * qi.quantity,
            }))
            setLineItems(items)
          }
        }
      }

      setLoading(false)
    }
    fetchInvoice()
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = async () => {
    if (!invoice || !invoice.vendors?.email) {
      alert('No vendor email available.')
      return
    }

    setSending(true)

    await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invoice.id)

    await logActivity(
      'invoice.sent',
      'invoice',
      invoice.id,
      { invoice_number: invoice.invoice_number, vendor_email: invoice.vendors.email }
    )

    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number} — VendorBridge`)
    const body = encodeURIComponent(
      `Dear ${invoice.vendors.name},\n\n` +
      `Please find the details of invoice ${invoice.invoice_number}:\n\n` +
      `PO Reference: ${invoice.purchase_orders?.po_number || 'N/A'}\n` +
      `Subtotal: ₹${invoice.subtotal?.toLocaleString('en-IN') || '0'}\n` +
      `CGST (9%): ₹${((invoice.tax_amount || 0) / 2).toLocaleString('en-IN')}\n` +
      `SGST (9%): ₹${((invoice.tax_amount || 0) / 2).toLocaleString('en-IN')}\n` +
      `Grand Total: ₹${invoice.total_amount?.toLocaleString('en-IN') || '0'}\n` +
      `Due Date: ${invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : 'N/A'}\n\n` +
      `Please process the payment at your earliest convenience.\n\n` +
      `Regards,\nVendorBridge Procurement Team`
    )

    window.open(`mailto:${invoice.vendors.email}?subject=${subject}&body=${body}`, '_self')

    setInvoice({ ...invoice, status: 'sent', sent_at: new Date().toISOString() })
    setSending(false)
  }

  const handleMarkPaid = async () => {
    if (!invoice) return
    setMarkingPaid(true)

    await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', invoice.id)

    await logActivity(
      'invoice.paid',
      'invoice',
      invoice.id,
      { invoice_number: invoice.invoice_number, amount: invoice.total_amount }
    )

    setInvoice({ ...invoice, status: 'paid', paid_at: new Date().toISOString() })
    setMarkingPaid(false)
  }

  const handleDownloadPDF = () => {
    // Use print-to-PDF as a simple approach
    window.print()
  }

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>
  if (!invoice) return <div className="flex items-center justify-center py-12">Invoice not found.</div>

  const cgst = (invoice.tax_amount || 0) / 2
  const sgst = (invoice.tax_amount || 0) / 2

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header - hidden when printing */}
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Purchase Order & Invoice</h1>
          <p className="text-muted-foreground font-mono">
            {invoice.purchase_orders?.po_number || invoice.invoice_number} — auto-generated after approval
          </p>
        </div>
      </div>

      {/* Action Buttons - hidden when printing */}
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        {(invoice.status === 'draft' || invoice.status === 'sent') && (
          <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={sending}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? 'Sending...' : 'Email Invoice'}
          </Button>
        )}
      </div>

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Print-only title */}
          <div className="hidden print:block text-center mb-6">
            <h1 className="text-2xl font-bold">PURCHASE ORDER & INVOICE</h1>
          </div>

          {/* Bill To / Vendor Section */}
          <div className="grid grid-cols-2 gap-6 border rounded-lg p-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Bill to:</p>
              <p className="font-medium">Your Organization Name</p>
              <p className="text-sm text-muted-foreground">123 Business Park</p>
              <p className="text-sm text-muted-foreground">Ahmedabad, Gujarat</p>
              <p className="text-sm text-muted-foreground">GSTIN: 24XXXXXXXXXXXZ</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Vendor:</p>
              <p className="font-medium">{invoice.vendors?.name || '—'}</p>
              {invoice.vendors?.address && (
                <p className="text-sm text-muted-foreground">{invoice.vendors.address}</p>
              )}
              {(invoice.vendors?.city || invoice.vendors?.state) && (
                <p className="text-sm text-muted-foreground">
                  {[invoice.vendors.city, invoice.vendors.state].filter(Boolean).join(', ')}
                </p>
              )}
              {invoice.vendors?.gst_number && (
                <p className="text-sm text-muted-foreground">GSTIN: {invoice.vendors.gst_number}</p>
              )}
            </div>
          </div>

          {/* PO & Invoice Dates */}
          <div className="grid grid-cols-2 gap-6 border rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">PO Number:</span>
                <span className="text-sm font-mono font-medium">{invoice.purchase_orders?.po_number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">PO Date:</span>
                <span className="text-sm">
                  {invoice.purchase_orders?.created_at
                    ? format(new Date(invoice.purchase_orders.created_at), 'dd MMM yyyy')
                    : '—'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Invoice Date:</span>
                <span className="text-sm">{format(new Date(invoice.created_at), 'dd MMM yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Due Date:</span>
                <span className="text-sm font-medium">
                  {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Item</TableHead>
                  <TableHead className="font-semibold text-center">Qty</TableHead>
                  <TableHead className="font-semibold text-right">Unit Price</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.length > 0 ? (
                  lineItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        ₹{item.unit_price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{item.total.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell>Goods / Services</TableCell>
                    <TableCell className="text-center">—</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(invoice.subtotal || 0).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                )}

                {/* Summary Rows */}
                <TableRow className="border-t-2">
                  <TableCell colSpan={3} className="text-right font-medium">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{(invoice.subtotal || 0).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">
                    CGST (9%)
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{cgst.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right text-muted-foreground">
                    SGST (9%)
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{sgst.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t-2 bg-muted/30">
                  <TableCell colSpan={3} className="text-right text-lg font-bold">
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold">
                    ₹{(invoice.total_amount || 0).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-4 pt-2 print:hidden">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge
              variant={
                invoice.status === 'paid'
                  ? 'default'
                  : invoice.status === 'cancelled'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-xs"
            >
              {invoice.status === 'sent' ? 'Pending Payment' : invoice.status}
            </Badge>
            {invoice.status === 'sent' && (
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 h-auto"
                onClick={handleMarkPaid}
                disabled={markingPaid}
              >
                {markingPaid ? 'Updating...' : 'Mark as Paid'}
              </Button>
            )}
            {invoice.status === 'draft' && (
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 h-auto"
                onClick={handleSendEmail}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send to Vendor'}
              </Button>
            )}
          </div>

          {/* Print status */}
          <div className="hidden print:block pt-4 border-t">
            <p className="text-sm">
              <span className="font-medium">Status:</span>{' '}
              <span className="uppercase">{invoice.status === 'sent' ? 'Pending Payment' : invoice.status}</span>
            </p>
            {invoice.paid_at && (
              <p className="text-sm">Paid on: {format(new Date(invoice.paid_at), 'dd MMM yyyy')}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-sm text-gray-500 mt-8 pt-4 border-t">
        <p>This is a computer-generated invoice. No signature required.</p>
        <p className="mt-1">Generated by VendorBridge — Procurement & Vendor Management</p>
      </div>
    </div>
  )
}
