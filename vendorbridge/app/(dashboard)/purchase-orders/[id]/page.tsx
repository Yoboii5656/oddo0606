'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import type { PurchaseOrder } from '@/types/database'

interface PODetail extends PurchaseOrder {
  vendors: { name: string; email: string } | null
  rfqs: { title: string; rfq_number: string } | null
}

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const [po, setPO] = useState<PODetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPO = async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select(`*, vendors:vendor_id (name, email), rfqs:rfq_id (title, rfq_number)`)
        .eq('id', params.id)
        .single()

      if (data) setPO(data as unknown as PODetail)
      setLoading(false)
    }
    fetchPO()
  }, [params.id])

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
