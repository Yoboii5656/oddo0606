'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Receipt } from 'lucide-react'
import type { PurchaseOrder } from '@/types/database'

interface PODetail extends PurchaseOrder {
  vendors: { name: string; email: string } | null
  rfqs: { title: string; rfq_number: string } | null
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [po, setPO] = useState<PODetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)
  const [hasInvoice, setHasInvoice] = useState(false)

  useEffect(() => {
    const fetchPO = async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select(`*, vendors:vendor_id (name, email), rfqs:rfq_id (title, rfq_number)`)
        .eq('id', params.id)
        .single()

      if (data) setPO(data as unknown as PODetail)

      // Check if invoice already exists for this PO
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('po_id', params.id)
        .maybeSingle()

      if (existingInvoice) setHasInvoice(true)
      setLoading(false)
    }
    fetchPO()
  }, [params.id])

  const handleGenerateInvoice = async () => {
    if (!po) return
    setGeneratingInvoice(true)

    const subtotal = po.total_amount || 0
    const taxPercent = 18
    const taxAmount = Math.round(subtotal * taxPercent / 100)
    const totalAmount = subtotal + taxAmount

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    // Due date is 30 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        po_id: po.id,
        vendor_id: po.vendor_id,
        status: 'draft',
        subtotal,
        tax_percent: taxPercent,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        due_date: dueDate.toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) {
      alert('Failed to generate invoice: ' + error.message)
      setGeneratingInvoice(false)
      return
    }

    // Log activity
    await logActivity(
      'invoice.generated',
      'invoice',
      invoice.id,
      { po_number: po.po_number, vendor: po.vendors?.name, amount: totalAmount }
    )

    alert(`Invoice ${invoiceNumber} generated successfully!`)
    router.push(`/dashboard/invoices/${invoice.id}`)
  }

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>
  if (!po) return <div className="flex items-center justify-center py-12">PO not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/purchase-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{po.po_number}</h1>
          <p className="text-muted-foreground">{po.rfqs?.title}</p>
        </div>
        <Badge>{po.status}</Badge>
      </div>

      {/* Generate Invoice Action */}
      {po.status === 'issued' && !hasInvoice && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-medium">Ready to invoice</p>
              <p className="text-sm text-muted-foreground">
                Generate an invoice for this purchase order (18% GST will be applied)
              </p>
            </div>
            <Button onClick={handleGenerateInvoice} disabled={generatingInvoice}>
              <Receipt className="mr-2 h-4 w-4" />
              {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasInvoice && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6 flex items-center justify-between">
            <p className="text-sm text-green-700 dark:text-green-400">
              ✓ Invoice has been generated for this PO
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Number</span>
              <span className="font-mono">{po.po_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RFQ Reference</span>
              <span>{po.rfqs?.rfq_number || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-semibold">
                {po.total_amount ? `₹${po.total_amount.toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Date</span>
              <span>
                {po.delivery_date ? format(new Date(po.delivery_date), 'dd MMM yyyy') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(po.created_at), 'dd MMM yyyy')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{po.vendors?.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{po.vendors?.email || '—'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
