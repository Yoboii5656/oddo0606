'use client'

import Link from 'next/link'
import { FileText, Building2, ShoppingCart, Receipt, CheckCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ProcurementChart } from '@/components/dashboard/ProcurementChart'

export default function DashboardPage() {
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
          value={12}
          description="3 closing this week"
          icon={FileText}
        />
        <StatsCard
          title="Active Vendors"
          value={48}
          description="5 added this month"
          icon={Building2}
        />
        <StatsCard
          title="Pending Approvals"
          value={4}
          description="Awaiting manager review"
          icon={CheckCircle}
        />
        <StatsCard
          title="Purchase Orders"
          value={23}
          description="₹12.4L total this month"
          icon={ShoppingCart}
        />
      </div>

      <ProcurementChart />
    </div>
  )
}
