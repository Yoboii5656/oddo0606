'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download, Printer, Send } from 'lucide-react'
import type { Invoice } from '@/types/database'

interface InvoiceDetail extends Invoice {
  vendors: { name: string; email: string; address: string | null } | null
  purchase_orders: { po_number: string } | null
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      const { data } = await supabase
        .from('invoices')
        .select(`*, vendors:vendor_id (name, email, address), purchase_orders:po_id (po_number)`)
        .eq('id', params.id)
        .single()

      if (data) setInvoice(data as unknown as InvoiceDetail)
      setLoading(false)
    }
    fetchInvoice()
  }, [params.id])

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>
  if (!invoice) return <div className="flex items-center justify-center py-12">Invoice not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
          <p className="text-muted-foreground">
            PO: {invoice.purchase_orders?.po_number || '—'}
          </p>
        </div>
        <Badge
          variant={
            invoice.status === 'paid'
              ? 'default'
              : invoice.status === 'cancelled'
              ? 'destructive'
              : 'secondary'
          }
        >
          {invoice.status}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button size="sm">
          <Send className="mr-2 h-4 w-4" />
          Send via Email
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Vendor</p>
              <p className="font-medium">{invoice.vendors?.name || '—'}</p>
              <p className="text-sm text-muted-foreground">{invoice.vendors?.email}</p>
              {invoice.vendors?.address && (
                <p className="text-sm text-muted-foreground">{invoice.vendors.address}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '—'}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{invoice.subtotal?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST ({invoice.tax_percent}%)</span>
              <span>₹{invoice.tax_amount?.toLocaleString('en-IN') || '0'}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{invoice.total_amount?.toLocaleString('en-IN') || '0'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
