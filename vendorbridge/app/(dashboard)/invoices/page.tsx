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
import type { Invoice } from '@/types/database'

interface InvoiceWithVendor extends Invoice {
  vendors: { name: string } | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithVendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data } = await supabase
        .from('invoices')
        .select(`*, vendors:vendor_id (name)`)
        .order('created_at', { ascending: false })

      if (data) setInvoices(data as unknown as InvoiceWithVendor[])
      setLoading(false)
    }
    fetchInvoices()
  }, [])

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default' as const
      case 'sent':
        return 'secondary' as const
      case 'draft':
        return 'outline' as const
      case 'cancelled':
        return 'destructive' as const
      default:
        return 'default' as const
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Invoices</h1>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
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
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No invoices yet.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="hover:underline font-medium"
                    >
                      {inv.invoice_number}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.vendors?.name || '—'}</TableCell>
                  <TableCell>
                    {inv.total_amount
                      ? `₹${inv.total_amount.toLocaleString('en-IN')}`
                      : '—'}
                  </TableCell>
                  <TableCell>{inv.tax_percent}%</TableCell>
                  <TableCell>
                    <Badge variant={statusColor(inv.status)}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '—'}
                  </TableCell>
                  <TableCell>{format(new Date(inv.created_at), 'dd MMM yyyy')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
