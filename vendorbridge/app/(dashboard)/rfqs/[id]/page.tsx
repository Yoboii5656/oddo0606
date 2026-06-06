'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Calendar, FileText, ShoppingCart, CheckCircle, ClipboardList, GitCompareArrows } from 'lucide-react'
import type { RFQ, RFQItem, Quotation, Vendor } from '@/types/database'

interface RFQDetail extends RFQ {
  rfq_items: RFQItem[]
  quotations: (Quotation & { vendors: Vendor })[]
}

export default function RFQDetailPage() {
  const params = useParams()
  const [rfq, setRfq] = useState<RFQDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    fetchRFQ()
  }, [params.id])

  const fetchRFQ = async () => {
    const { data } = await supabase
      .from('rfqs')
      .select(`
        *,
        rfq_items (*),
        quotations (*, vendors:vendor_id (*))
      `)
      .eq('id', params.id)
      .single()

    if (data) setRfq(data as unknown as RFQDetail)
    setLoading(false)
  }

  const handleAcceptQuotation = async (quotationId: string, vendorName: string) => {
    setGenerating(quotationId)

    // First create an approval record
    const { data: approval, error: approvalError } = await supabase
      .from('approvals')
      .insert({
        quotation_id: quotationId,
        requested_by: (await supabase.auth.getUser()).data.user?.id,
        status: 'approved',
        actioned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (approvalError || !approval) {
      alert('Failed to create approval: ' + (approvalError?.message || 'Unknown error'))
      setGenerating(null)
      return
    }

    // Call the RPC to generate PO
    const { data: poId, error: poError } = await supabase
      .rpc('generate_purchase_order', { p_approval_id: approval.id })

    if (poError) {
      alert('Failed to generate PO: ' + poError.message)
      setGenerating(null)
      return
    }

    // Log activity
    await logActivity(
      'purchase_order.generated',
      'purchase_order',
      poId,
      { rfq_id: rfq?.id, vendor: vendorName, quotation_id: quotationId }
    )

    alert(`Purchase Order generated successfully!`)
    setGenerating(null)
    fetchRFQ()
  }

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>
  if (!rfq) return <div className="flex items-center justify-center py-12">RFQ not found.</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rfqs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{rfq.title}</h1>
          <p className="text-muted-foreground font-mono">{rfq.rfq_number}</p>
        </div>
        <Badge>{rfq.status.replace('_', ' ')}</Badge>
      </div>

      {/* Action buttons */}
      {rfq.status === 'open' && (
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/dashboard/quotations/submit/${rfq.id}`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Submit Quotation
            </Link>
          </Button>
          {rfq.quotations && rfq.quotations.length > 1 && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/quotations/compare/${rfq.id}`}>
                <GitCompareArrows className="mr-2 h-4 w-4" />
                Compare Quotations
              </Link>
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="font-medium">{format(new Date(rfq.deadline), 'dd MMM yyyy')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="font-medium">{rfq.rfq_items?.length || 0} line items</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Quotations</p>
              <p className="font-medium">{rfq.quotations?.length || 0} received</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {rfq.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{rfq.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfq.rfq_items?.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell>{item.description || '—'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {rfq.quotations && rfq.quotations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quotations Received</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Delivery Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.quotations.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.vendors?.name || '—'}</TableCell>
                    <TableCell>
                      {q.total_amount
                        ? `₹${q.total_amount.toLocaleString('en-IN')}`
                        : '—'}
                    </TableCell>
                    <TableCell>{q.delivery_days ? `${q.delivery_days} days` : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={q.status === 'accepted' ? 'default' : 'secondary'}>
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(q.submitted_at), 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {q.status === 'submitted' && rfq.status !== 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptQuotation(q.id, q.vendors?.name || '')}
                          disabled={generating === q.id}
                        >
                          {generating === q.id ? (
                            'Generating...'
                          ) : (
                            <>
                              <ShoppingCart className="mr-1 h-3 w-3" />
                              Generate PO
                            </>
                          )}
                        </Button>
                      )}
                      {q.status === 'accepted' && (
                        <span className="flex items-center text-sm text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Accepted
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
