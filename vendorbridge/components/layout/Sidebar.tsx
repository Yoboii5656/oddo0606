'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Receipt,
  CheckCircle,
  Activity,
  BarChart3,
  Building2,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/dashboard/vendors', icon: Building2 },
  { name: 'RFQs', href: '/dashboard/rfqs', icon: FileText },
  { name: 'Approvals', href: '/dashboard/approvals', icon: CheckCircle },
  { name: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: ShoppingCart },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { name: 'Activity', href: '/dashboard/activity', icon: Activity },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r bg-card pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">VendorBridge</span>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
