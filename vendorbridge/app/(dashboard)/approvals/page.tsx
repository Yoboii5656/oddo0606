'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import type { Approval } from '@/types/database'

interface ApprovalWithDetails extends Approval {
  quotations: {
    total_amount: number | null
    vendors: { name: string } | null
    rfqs: { title: string; rfq_number: string } | null
  } | null
  profiles: { full_name: string } | null
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    const { data } = await supabase
      .from('approvals')
      .select(`
        *,
        quotations:quotation_id (
          total_amount,
          vendors:vendor_id (name),
          rfqs:rfq_id (title, rfq_number)
        ),
        profiles:requested_by (full_name)
      `)
      .order('requested_at', { ascending: false })

    if (data) setApprovals(data as unknown as ApprovalWithDetails[])
    setLoading(false)
  }

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    await supabase
      .from('approvals')
      .update({ status, actioned_at: new Date().toISOString() })
      .eq('id', id)

    fetchApprovals()
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Approvals</h1>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading approvals...</div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No approval requests yet.</div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <Card key={approval.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {statusIcon(approval.status)}
                    <div>
                      <h3 className="font-semibold">
                        {approval.quotations?.rfqs?.title || 'Unknown RFQ'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {approval.quotations?.rfqs?.rfq_number} • Vendor:{' '}
                        {approval.quotations?.vendors?.name || '—'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Amount: ₹
                        {approval.quotations?.total_amount?.toLocaleString('en-IN') || '—'} •
                        Requested by {approval.profiles?.full_name || '—'} on{' '}
                        {format(new Date(approval.requested_at), 'dd MMM yyyy')}
                      </p>
                      {approval.remarks && (
                        <p className="text-sm mt-2 italic">&ldquo;{approval.remarks}&rdquo;</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {approval.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(approval.id, 'rejected')}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(approval.id, 'approved')}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      </>
                    ) : (
                      <Badge
                        variant={approval.status === 'approved' ? 'default' : 'destructive'}
                      >
                        {approval.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
