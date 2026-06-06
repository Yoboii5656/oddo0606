'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/database'
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
  ClipboardList,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: typeof LayoutDashboard
  roles: UserRole[] // which roles can see this item
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { name: 'Vendors', href: '/dashboard/vendors', icon: Building2, roles: ['admin', 'procurement_officer', 'manager'] },
  { name: 'RFQs', href: '/dashboard/rfqs', icon: FileText, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { name: 'Quotations', href: '/dashboard/quotations', icon: ClipboardList, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { name: 'Approvals', href: '/dashboard/approvals', icon: CheckCircle, roles: ['admin', 'manager'] },
  { name: 'Purchase Orders', href: '/dashboard/purchase-orders', icon: ShoppingCart, roles: ['admin', 'procurement_officer', 'manager'] },
  { name: 'Invoices', href: '/dashboard/invoices', icon: Receipt, roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
  { name: 'Activity', href: '/dashboard/activity', icon: Activity, roles: ['admin', 'manager'] },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['admin', 'procurement_officer', 'manager'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role || 'vendor'

  const visibleNavigation = navigation.filter((item) => item.roles.includes(userRole))

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r bg-card pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-bold">VendorBridge</span>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {visibleNavigation.map((item) => {
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
