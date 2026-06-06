'use client'

import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Download,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  FileText,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

// Monthly spend data
const spendData = [
  { month: 'Jan', spend: 245000, budget: 300000 },
  { month: 'Feb', spend: 312000, budget: 300000 },
  { month: 'Mar', spend: 287000, budget: 320000 },
  { month: 'Apr', spend: 410000, budget: 380000 },
  { month: 'May', spend: 365000, budget: 400000 },
  { month: 'Jun', spend: 428000, budget: 420000 },
  { month: 'Jul', spend: 390000, budget: 400000 },
  { month: 'Aug', spend: 445000, budget: 430000 },
  { month: 'Sep', spend: 378000, budget: 400000 },
  { month: 'Oct', spend: 492000, budget: 450000 },
  { month: 'Nov', spend: 465000, budget: 470000 },
  { month: 'Dec', spend: 510000, budget: 500000 },
]

// Category breakdown
const categoryData = [
  { name: 'IT', value: 35 },
  { name: 'Logistics', value: 25 },
  { name: 'Raw Materials', value: 20 },
  { name: 'Office Supplies', value: 12 },
  { name: 'Other', value: 8 },
]

// RFQ trend data
const rfqTrendData = [
  { month: 'Jan', created: 12, awarded: 8, cancelled: 1 },
  { month: 'Feb', created: 18, awarded: 14, cancelled: 2 },
  { month: 'Mar', created: 15, awarded: 11, cancelled: 1 },
  { month: 'Apr', created: 22, awarded: 18, cancelled: 3 },
  { month: 'May', created: 20, awarded: 16, cancelled: 2 },
  { month: 'Jun', created: 25, awarded: 20, cancelled: 1 },
  { month: 'Jul', created: 19, awarded: 15, cancelled: 2 },
  { month: 'Aug', created: 28, awarded: 22, cancelled: 3 },
  { month: 'Sep', created: 24, awarded: 19, cancelled: 1 },
  { month: 'Oct', created: 30, awarded: 25, cancelled: 2 },
  { month: 'Nov', created: 27, awarded: 21, cancelled: 4 },
  { month: 'Dec', created: 32, awarded: 26, cancelled: 2 },
]

// Order status data
const orderStatusData = [
  { name: 'Delivered', value: 45 },
  { name: 'In Transit', value: 20 },
  { name: 'Processing', value: 18 },
  { name: 'Pending', value: 12 },
  { name: 'Cancelled', value: 5 },
]

// Savings trend
const savingsData = [
  { month: 'Jan', savings: 32000 },
  { month: 'Feb', savings: 45000 },
  { month: 'Mar', savings: 28000 },
  { month: 'Apr', savings: 67000 },
  { month: 'May', savings: 52000 },
  { month: 'Jun', savings: 74000 },
  { month: 'Jul', savings: 61000 },
  { month: 'Aug', savings: 83000 },
  { month: 'Sep', savings: 55000 },
  { month: 'Oct', savings: 91000 },
  { month: 'Nov', savings: 78000 },
  { month: 'Dec', savings: 95000 },
]

// Delivery performance
const deliveryData = [
  { month: 'Jan', onTime: 85, late: 15 },
  { month: 'Feb', onTime: 88, late: 12 },
  { month: 'Mar', onTime: 82, late: 18 },
  { month: 'Apr', onTime: 91, late: 9 },
  { month: 'May', onTime: 87, late: 13 },
  { month: 'Jun', onTime: 93, late: 7 },
  { month: 'Jul', onTime: 90, late: 10 },
  { month: 'Aug', onTime: 86, late: 14 },
  { month: 'Sep', onTime: 92, late: 8 },
  { month: 'Oct', onTime: 89, late: 11 },
  { month: 'Nov', onTime: 94, late: 6 },
  { month: 'Dec', onTime: 91, late: 9 },
]

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(270, 70%, 60%)']
const STATUS_COLORS = ['hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(38, 92%, 50%)', 'hsl(270, 70%, 60%)', 'hsl(0, 84%, 60%)']

export default function ReportsPage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const axisColor = isDark ? '#a1a1aa' : '#71717a'
  const gridColor = isDark ? '#27272a' : '#e4e4e7'
  const tooltipBg = isDark ? '#18181b' : '#ffffff'
  const tooltipBorder = isDark ? '#3f3f46' : '#e4e4e7'
  const tooltipText = isDark ? '#fafafa' : '#09090b'

  const exportCSV = () => {
    const headers = 'Month,Spend,Budget,Savings\n'
    const rows = spendData.map((d, i) => `${d.month},${d.spend},${d.budget},${savingsData[i]?.savings ?? 0}`).join('\n')
    const csv = headers + rows
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'procurement-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">Reports & Analytics</h1>
        <Button variant="outline" onClick={exportCSV} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-100 p-1.5 dark:bg-blue-900/30 sm:p-2">
                <IndianRupee className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground sm:text-sm">Total Spend</p>
                <p className="text-sm font-bold sm:text-lg">₹47.27L</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>+12.5% vs last year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-100 p-1.5 dark:bg-green-900/30 sm:p-2">
                <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground sm:text-sm">Total Orders</p>
                <p className="text-sm font-bold sm:text-lg">284</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>+8.3% vs last year</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-1.5 dark:bg-purple-900/30 sm:p-2">
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground sm:text-sm">Active RFQs</p>
                <p className="text-sm font-bold sm:text-lg">18</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <TrendingDown className="h-3 w-3" />
              <span>-3.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-1.5 dark:bg-amber-900/30 sm:p-2">
                <Users className="h-4 w-4 text-amber-600 dark:text-amber-400 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground sm:text-sm">Active Vendors</p>
                <p className="text-sm font-bold sm:text-lg">42</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3" />
              <span>+5 new this quarter</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Spend vs Budget Chart */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Monthly Spend vs Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} width={50} />
                  <Tooltip
                    formatter={(value, name) =>
                      [`₹${Number(value).toLocaleString('en-IN')}`, name === 'spend' ? 'Actual Spend' : 'Budget']
                    }
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="spend" name="Actual Spend" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="budget" name="Budget" fill="hsl(221, 83%, 53%, 0.3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spend by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Legend wrapperStyle={{ color: axisColor, fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={`status-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Legend wrapperStyle={{ color: axisColor, fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFQ Trend & Savings */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">RFQ Trends (Monthly)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rfqTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="created" name="Created" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="awarded" name="Awarded" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Savings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Cost Savings from Negotiations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} width={40} />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Savings']}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Area type="monotone" dataKey="savings" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%, 0.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <p className="text-xs font-medium text-green-700 dark:text-green-300 sm:text-sm">
                Total Savings This Year: <span className="font-bold">₹7,61,000</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Delivery Performance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deliveryData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} />
                  <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={{ stroke: gridColor }} tickLine={{ stroke: gridColor }} width={30} domain={[0, 100]} />
                  <Tooltip
                    formatter={(value, name) => [`${value}%`, name === 'onTime' ? 'On Time' : 'Late']}
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipText,
                    }}
                    labelStyle={{ color: tooltipText }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="onTime" name="On Time" stackId="a" fill="hsl(142, 76%, 36%)" />
                  <Bar dataKey="late" name="Late" stackId="a" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 sm:text-sm">
                Avg On-Time Delivery: <span className="font-bold">89%</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors & Pending Actions */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Top Vendors by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {[
                { name: 'TechSupply Co.', spend: 580000, orders: 12, rating: 4.8 },
                { name: 'LogiFreight Ltd.', spend: 420000, orders: 8, rating: 4.5 },
                { name: 'MaterialMax', spend: 350000, orders: 15, rating: 4.2 },
                { name: 'OfficeHub', spend: 180000, orders: 6, rating: 4.6 },
                { name: 'BuildRight Inc.', spend: 150000, orders: 4, rating: 3.9 },
              ].map((vendor, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium sm:text-base">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {vendor.orders} orders · ⭐ {vendor.rating}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold sm:text-base">₹{vendor.spend.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions / Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: Clock, label: 'POs awaiting approval', count: 5, color: 'text-amber-500' },
                { icon: FileText, label: 'Invoices pending review', count: 8, color: 'text-blue-500' },
                { icon: AlertTriangle, label: 'Overdue deliveries', count: 3, color: 'text-red-500' },
                { icon: CheckCircle2, label: 'Quotations to evaluate', count: 6, color: 'text-green-500' },
                { icon: XCircle, label: 'RFQs expiring soon', count: 2, color: 'text-purple-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <item.icon className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${item.color}`} />
                    <p className="text-sm sm:text-base">{item.label}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold sm:text-sm">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Procurement Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Recent Procurement Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground sm:text-sm">
                  <th className="pb-2 pl-4 pr-2 font-medium sm:pl-0">Date</th>
                  <th className="px-2 pb-2 font-medium">Type</th>
                  <th className="px-2 pb-2 font-medium">Reference</th>
                  <th className="px-2 pb-2 font-medium">Vendor</th>
                  <th className="px-2 pb-2 font-medium text-right">Amount</th>
                  <th className="pb-2 pl-2 pr-4 font-medium sm:pr-0">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { date: '05 Jun', type: 'PO', ref: 'PO-2024-0284', vendor: 'TechSupply Co.', amount: 125000, status: 'Approved' },
                  { date: '04 Jun', type: 'Invoice', ref: 'INV-2024-0156', vendor: 'LogiFreight Ltd.', amount: 87000, status: 'Pending' },
                  { date: '03 Jun', type: 'RFQ', ref: 'RFQ-2024-0032', vendor: '—', amount: 200000, status: 'Open' },
                  { date: '02 Jun', type: 'PO', ref: 'PO-2024-0283', vendor: 'MaterialMax', amount: 64000, status: 'Delivered' },
                  { date: '01 Jun', type: 'Invoice', ref: 'INV-2024-0155', vendor: 'OfficeHub', amount: 32000, status: 'Paid' },
                  { date: '31 May', type: 'RFQ', ref: 'RFQ-2024-0031', vendor: '—', amount: 150000, status: 'Awarded' },
                  { date: '30 May', type: 'PO', ref: 'PO-2024-0282', vendor: 'BuildRight Inc.', amount: 98000, status: 'In Transit' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="py-2.5 pl-4 pr-2 text-muted-foreground sm:pl-0">{row.date}</td>
                    <td className="px-2 py-2.5">{row.type}</td>
                    <td className="px-2 py-2.5 font-medium">{row.ref}</td>
                    <td className="px-2 py-2.5">{row.vendor}</td>
                    <td className="px-2 py-2.5 text-right font-medium">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 pl-2 pr-4 sm:pr-0">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === 'Approved' || row.status === 'Paid' || row.status === 'Delivered' || row.status === 'Awarded'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : row.status === 'Pending' || row.status === 'Open' || row.status === 'In Transit'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
