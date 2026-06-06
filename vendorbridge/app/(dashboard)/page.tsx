'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, Building2, ShoppingCart, Receipt, CheckCircle, Plus, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ProcurementChart } from '@/components/dashboard/ProcurementChart'
import type { ActivityLog } from '@/types/database'

interface ActivityLogWithActor extends ActivityLog {
  profiles: { full_name: string } | null
}

export default function DashboardPage() {
  const [recentActivity, setRecentActivity] = useState<ActivityLogWithActor[]>([])
  const [stats, setStats] = useState({
    rfqs: 0,
    vendors: 0,
    approvals: 0,
    pos: 0,
  })

  useEffect(() => {
    // Fetch real stats
    const fetchStats = async () => {
      const [rfqRes, vendorRes, approvalRes, poRes] = await Promise.all([
        supabase.from('rfqs').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
        supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('purchase_orders').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        rfqs: rfqRes.count || 0,
        vendors: vendorRes.count || 0,
        approvals: approvalRes.count || 0,
        pos: poRes.count || 0,
      })
    }

    // Fetch recent activity
    const fetchActivity = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select(`*, profiles:actor_id (full_name)`)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) setRecentActivity(data as unknown as ActivityLogWithActor[])
    }

    fetchStats()
    fetchActivity()
  }, [])

  const formatAction = (action: string) => {
    return action
      .replace('.', ' › ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/rfqs/new">
              <Plus className="mr-2 h-4 w-4" />
              New RFQ
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/vendors/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active RFQs"
          value={stats.rfqs}
          description="Open or under review"
          icon={FileText}
        />
        <StatsCard
          title="Active Vendors"
          value={stats.vendors}
          description="Registered vendors"
          icon={Building2}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.approvals}
          description="Awaiting manager review"
          icon={CheckCircle}
        />
        <StatsCard
          title="Purchase Orders"
          value={stats.pos}
          description="Total POs generated"
          icon={ShoppingCart}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProcurementChart />
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Link href="/dashboard/activity" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 pb-3 border-b last:border-0 last:pb-0">
                    <Activity className="h-3 w-3 mt-1.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs truncate">
                        <span className="font-medium">{log.profiles?.full_name || 'System'}</span>
                        {' — '}
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'dd MMM, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
