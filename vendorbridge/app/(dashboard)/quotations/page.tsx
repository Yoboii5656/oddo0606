'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GitCompareArrows } from 'lucide-react'
import type { Quotation, Vendor, RFQ } from '@/types/database'

interface QuotationWithDetails extends Quotation {
  vendors: Pick<Vendor, 'name'> | null
  rfqs: Pick<RFQ, 'title' | 'rfq_number'> | null
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  submitted: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
}

export default function QuotationsPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<QuotationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchQuotations = async () => {
      const { data } = await supabase
        .from('quotations')
        .select(`*, vendors:vendor_id (name), rfqs:rfq_id (title, rfq_number)`)
        .order('submitted_at', { ascending: false })

      if (data) setQuotations(data as unknown as QuotationWithDetails[])
      setLoading(false)
    }
    fetchQuotations()
  }, [])

  const filtered = quotations.filter((q) => statusFilter === 'all' || q.status === statusFilter)

  // Group by RFQ for comparison links
  const rfqGroups = filtered.reduce((acc, q) => {
    const rfqId = q.rfq_id
    if (!acc[rfqId]) acc[rfqId] = []
    acc[rfqId].push(q)
    return acc
  }, {} as Record<string, QuotationWithDetails[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quotations</h1>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Delivery Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Compare</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No quotations found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((q) => (
                <TableRow
                  key={q.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/quotations/compare/${q.rfq_id}`)}
                >
                  <TableCell>
                    <span className="font-mono text-xs">{q.rfqs?.rfq_number}</span>
                    <br />
                    <span className="text-muted-foreground text-sm">{q.rfqs?.title}</span>
                  </TableCell>
                  <TableCell className="font-medium">{q.vendors?.name || '—'}</TableCell>
                  <TableCell>
                    {q.total_amount ? `₹${q.total_amount.toLocaleString('en-IN')}` : '—'}
                  </TableCell>
                  <TableCell>{q.delivery_days ? `${q.delivery_days} days` : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={statusColors[q.status] || 'secondary'}>{q.status}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(q.submitted_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell>
                    {(rfqGroups[q.rfq_id]?.length || 0) > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/quotations/compare/${q.rfq_id}`)
                        }}
                      >
                        <GitCompareArrows className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
