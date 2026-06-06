'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Trophy, TrendingDown, Clock } from 'lucide-react'
import type { RFQ, RFQItem, Quotation, Vendor, QuotationItem } from '@/types/database'

interface QuotationWithItems extends Quotation {
  vendors: Pick<Vendor, 'name' | 'email' | 'rating'> | null
  quotation_items: (QuotationItem & { rfq_items: Pick<RFQItem, 'product_name' | 'unit'> | null })[]
}

export default function QuotationComparePage() {
  const params = useParams()
  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([])
  const [quotations, setQuotations] = useState<QuotationWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      // Fetch RFQ
      const { data: rfqData } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', params.rfqId)
        .single()

      if (rfqData) setRfq(rfqData)

      // Fetch RFQ items
      const { data: items } = await supabase
        .from('rfq_items')
        .select('*')
        .eq('rfq_id', params.rfqId)
        .order('created_at')

      if (items) setRfqItems(items)

      // Fetch all quotations with their items
      const { data: quots } = await supabase
        .from('quotations')
        .select(`
          *,
          vendors:vendor_id (name, email, rating),
          quotation_items (*, rfq_items:rfq_item_id (product_name, unit))
        `)
        .eq('rfq_id', params.rfqId)
        .in('status', ['submitted', 'accepted'])
        .order('total_amount', { ascending: true })

      if (quots) setQuotations(quots as unknown as QuotationWithItems[])
      setLoading(false)
    }
    fetchData()
  }, [params.rfqId])

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>
  if (!rfq) return <div className="flex items-center justify-center py-12">RFQ not found.</div>

  // Find cheapest quotation
  const cheapestId = quotations.length > 0
    ? quotations.reduce((min, q) => (q.total_amount || Infinity) < (min.total_amount || Infinity) ? q : min).id
    : null

  // Find fastest delivery
  const fastestId = quotations.length > 0
    ? quotations.reduce((min, q) => (q.delivery_days || Infinity) < (min.delivery_days || Infinity) ? q : min).id
    : null

  // Get price for a specific item from a quotation
  const getItemPrice = (quotation: QuotationWithItems, rfqItemId: string): number | null => {
    const item = quotation.quotation_items?.find((qi) => qi.rfq_item_id === rfqItemId)
    return item ? item.unit_price : null
  }

  // Find cheapest price for each item
  const getCheapestPriceForItem = (rfqItemId: string): number | null => {
    let cheapest: number | null = null
    for (const q of quotations) {
      const price = getItemPrice(q, rfqItemId)
      if (price !== null && (cheapest === null || price < cheapest)) {
        cheapest = price
      }
    }
    return cheapest
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/rfqs/${params.rfqId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Quotation Comparison</h1>
          <p className="text-muted-foreground">
            {rfq.title} ({rfq.rfq_number}) — {quotations.length} quotations received
          </p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quotations available for comparison.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-green-500/30">
              <CardContent className="pt-6 flex items-center gap-3">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Lowest Price</p>
                  <p className="font-bold text-green-600">
                    ₹{quotations[0]?.total_amount?.toLocaleString('en-IN') || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{quotations[0]?.vendors?.name}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Fastest Delivery</p>
                  <p className="font-bold text-blue-600">
                    {quotations.find((q) => q.id === fastestId)?.delivery_days || '—'} days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quotations.find((q) => q.id === fastestId)?.vendors?.name}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Highest Rated</p>
                  <p className="font-bold text-amber-600">
                    {quotations.reduce((best, q) => (q.vendors?.rating || 0) > (best.vendors?.rating || 0) ? q : best).vendors?.rating || '—'}/5 ⭐
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quotations.reduce((best, q) => (q.vendors?.rating || 0) > (best.vendors?.rating || 0) ? q : best).vendors?.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background min-w-[150px]">Criteria</TableHead>
                    {quotations.map((q) => (
                      <TableHead key={q.id} className="text-center min-w-[160px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-semibold">{q.vendors?.name || 'Unknown'}</span>
                          {q.id === cheapestId && (
                            <Badge variant="default" className="text-xs">Best Price</Badge>
                          )}
                          {q.id === fastestId && q.id !== cheapestId && (
                            <Badge variant="secondary" className="text-xs">Fastest</Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Total Amount Row */}
                  <TableRow className="font-semibold bg-muted/30">
                    <TableCell className="sticky left-0 bg-muted/30">Total Amount</TableCell>
                    {quotations.map((q) => (
                      <TableCell key={q.id} className={`text-center ${q.id === cheapestId ? 'text-green-600 font-bold' : ''}`}>
                        ₹{q.total_amount?.toLocaleString('en-IN') || '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Delivery Days Row */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-background">Delivery Days</TableCell>
                    {quotations.map((q) => (
                      <TableCell key={q.id} className={`text-center ${q.id === fastestId ? 'text-blue-600 font-bold' : ''}`}>
                        {q.delivery_days ? `${q.delivery_days} days` : '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Vendor Rating Row */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-background">Vendor Rating</TableCell>
                    {quotations.map((q) => (
                      <TableCell key={q.id} className="text-center">
                        {q.vendors?.rating ? `${q.vendors.rating}/5 ⭐` : '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Notes Row */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-background">Notes</TableCell>
                    {quotations.map((q) => (
                      <TableCell key={q.id} className="text-center text-xs text-muted-foreground max-w-[160px]">
                        {q.notes || '—'}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Separator */}
                  <TableRow>
                    <TableCell colSpan={quotations.length + 1} className="bg-muted/50 py-1">
                      <span className="text-xs font-semibold text-muted-foreground">ITEM-WISE PRICING</span>
                    </TableCell>
                  </TableRow>

                  {/* Per-item price rows */}
                  {rfqItems.map((item) => {
                    const cheapestPrice = getCheapestPriceForItem(item.id)
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="sticky left-0 bg-background">
                          <div>
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit}
                            </p>
                          </div>
                        </TableCell>
                        {quotations.map((q) => {
                          const price = getItemPrice(q, item.id)
                          const isCheapest = price !== null && price === cheapestPrice
                          return (
                            <TableCell key={q.id} className={`text-center ${isCheapest ? 'text-green-600 font-semibold' : ''}`}>
                              {price !== null ? `₹${price.toLocaleString('en-IN')}` : '—'}
                              {price !== null && (
                                <p className="text-xs text-muted-foreground">
                                  = ₹{(price * item.quantity).toLocaleString('en-IN')}
                                </p>
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action - Go to RFQ to accept */}
          <div className="flex justify-end">
            <Button asChild>
              <Link href={`/dashboard/rfqs/${params.rfqId}`}>
                Go to RFQ to Accept & Generate PO →
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
