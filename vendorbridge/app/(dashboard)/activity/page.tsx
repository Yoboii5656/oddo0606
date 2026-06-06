'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Clock,
  FileText,
  UserPlus,
  Send,
} from 'lucide-react'
import type { ActivityLog } from '@/types/database'

interface ActivityLogWithActor extends ActivityLog {
  profiles: { full_name: string } | null
}

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'RFQ', value: 'rfq' },
  { label: 'Approvals', value: 'approval' },
  { label: 'Invoices', value: 'invoice' },
  { label: 'Vendors', value: 'vendor' },
] as const

type FilterValue = (typeof FILTERS)[number]['value']

function getIcon(action: string, entityType: string) {
  if (action.includes('selected') || action.includes('approved') || action.includes('paid')) {
    return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  }
  if (action.includes('pending') || action.includes('awaiting')) {
    return <Clock className="h-5 w-5 text-blue-400" />
  }
  if (entityType === 'rfq' || action.includes('published') || action.includes('rfq')) {
    return <FileText className="h-5 w-5 text-teal-500" />
  }
  if (entityType === 'vendor' || action.includes('vendor')) {
    return <UserPlus className="h-5 w-5 text-purple-400" />
  }
  if (entityType === 'invoice' || action.includes('invoice') || action.includes('sent')) {
    return <Send className="h-5 w-5 text-amber-400" />
  }
  return <FileText className="h-5 w-5 text-muted-foreground" />
}

function formatDescription(log: ActivityLogWithActor): string {
  const action = log.action
  const meta = log.metadata || {}

  // Build a human-readable description from action + metadata
  const parts: string[] = []

  // Map common action patterns
  if (action === 'quotation.selected') {
    parts.push(`Quotation selected`)
    if (meta.vendor_name) parts[0] += ` — ${meta.vendor_name}`
    if (meta.rfq_title) parts[0] += ` selected for ${meta.rfq_title}`
  } else if (action === 'approval.pending' || action === 'approval.requested') {
    parts.push(`Approval pending`)
    if (meta.po_number) parts[0] += ` — ${meta.po_number}`
    if (meta.approver_name) parts[0] += ` awaiting approval by ${meta.approver_name}`
  } else if (action === 'rfq.published' || action === 'rfq.created') {
    parts.push(`RFQ published`)
    if (meta.title) parts[0] += ` — ${meta.title}`
    if (meta.vendor_count) parts[0] += ` sent to ${meta.vendor_count} vendors`
  } else if (action === 'vendor.created' || action === 'vendor.added') {
    parts.push(`Vendor added`)
    if (meta.vendor_name) parts[0] += ` — ${meta.vendor_name}`
    parts[0] += ` registered and pending verification`
  } else if (action === 'invoice.sent') {
    parts.push(`Invoice sent`)
    if (meta.invoice_number) parts[0] += ` — ${meta.invoice_number}`
  } else if (action === 'invoice.paid') {
    parts.push(`Invoice paid`)
    if (meta.invoice_number) parts[0] += ` — ${meta.invoice_number}`
  } else if (action === 'po.created') {
    parts.push(`Purchase order created`)
    if (meta.po_number) parts[0] += ` — ${meta.po_number}`
  } else if (action === 'approval.approved') {
    parts.push(`Approval granted`)
    if (meta.po_number) parts[0] += ` — ${meta.po_number}`
  } else {
    // Generic fallback
    const readable = action.replace('.', ' ').replace(/_/g, ' ')
    parts.push(readable.charAt(0).toUpperCase() + readable.slice(1))
    if (meta.title) parts[0] += ` — ${meta.title}`
    if (meta.vendor_name) parts[0] += ` — ${meta.vendor_name}`
  }

  return parts[0]
}

function matchesFilter(log: ActivityLogWithActor, filter: FilterValue): boolean {
  if (filter === 'all') return true
  // Match on entity_type or action prefix
  const et = log.entity_type?.toLowerCase() || ''
  const act = log.action?.toLowerCase() || ''
  return et.includes(filter) || act.includes(filter)
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLogWithActor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('all')

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select(`*, profiles:actor_id (full_name)`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setLogs(data as unknown as ActivityLogWithActor[])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const filtered = logs.filter((log) => matchesFilter(log, filter))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Activity & Logs</h1>
        <p className="text-muted-foreground">Procurement audit trail</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
              filter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="space-y-1">
        {loading ? (
          <p className="text-center py-12 text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No activity found.</p>
        ) : (
          filtered.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 py-4 border-b border-border last:border-0"
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {getIcon(log.action, log.entity_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                  {formatDescription(log)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(log.created_at), 'dd MMM yyyy, h:mm a')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
