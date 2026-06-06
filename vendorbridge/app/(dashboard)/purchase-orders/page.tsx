'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import type { PurchaseOrder } from '@/types/database'

interface POWithVendor extends PurchaseOrder {
  vendors: { name: string } | null
  rfqs: { title: string } | null
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<POWithVendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select(`*, vendors:vendor_id (name), rfqs:rfq_id (title)`)
        .order('created_at', { ascending: false })

      if (data) setOrders(data as unknown as POWithVendor[])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  const statusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'default' as const
      case 'delivered':
        return 'secondary' as const
      case 'cancelled':
        return 'destructive' as const
      default:
        return 'default' as const
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Purchase Orders</h1>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO #</TableHead>
              <TableHead>RFQ</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Delivery Date</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No purchase orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/dashboard/purchase-orders/${po.id}`}
                      className="hover:underline font-medium"
                    >
                      {po.po_number}
                    </Link>
                  </TableCell>
                  <TableCell>{po.rfqs?.title || '—'}</TableCell>
                  <TableCell>{po.vendors?.name || '—'}</TableCell>
                  <TableCell>
                    {po.total_amount
                      ? `₹${po.total_amount.toLocaleString('en-IN')}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColor(po.status)}>{po.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {po.delivery_date
                      ? format(new Date(po.delivery_date), 'dd MMM yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>{format(new Date(po.created_at), 'dd MMM yyyy')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
