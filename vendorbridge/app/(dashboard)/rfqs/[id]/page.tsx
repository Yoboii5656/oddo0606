'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
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
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import type { RFQ, RFQItem, Quotation, Vendor } from '@/types/database'

interface RFQDetail extends RFQ {
  rfq_items: RFQItem[]
  quotations: (Quotation & { vendors: Vendor })[]
}

export default function RFQDetailPage() {
  const params = useParams()
  const [rfq, setRfq] = useState<RFQDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    fetchRFQ()
  }, [params.id])

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
                      <Badge variant="secondary">{q.status}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(q.submitted_at), 'dd MMM yyyy')}</TableCell>
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
