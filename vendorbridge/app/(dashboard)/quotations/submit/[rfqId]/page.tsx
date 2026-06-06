'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { logActivity } from '@/lib/activity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import type { RFQ, RFQItem, Vendor } from '@/types/database'

interface ItemPricing {
  rfq_item_id: string
  product_name: string
  quantity: number
  unit: string
  unit_price: string
}

export default function SubmitQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendor, setSelectedVendor] = useState('')
  const [deliveryDays, setDeliveryDays] = useState('')
  const [notes, setNotes] = useState('')
  const [itemPricing, setItemPricing] = useState<ItemPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      const { data: itemsData } = await supabase
        .from('rfq_items')
        .select('*')
        .eq('rfq_id', params.rfqId)

      if (itemsData) {
        setRfqItems(itemsData)
        setItemPricing(
          itemsData.map((item) => ({
            rfq_item_id: item.id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: '',
          }))
        )
      }

      // Fetch invited vendors for this RFQ
      const { data: rfqVendors } = await supabase
        .from('rfq_vendors')
        .select('vendor_id, vendors:vendor_id (id, name, email)')
        .eq('rfq_id', params.rfqId)

      if (rfqVendors) {
        const vendorList = rfqVendors
          .map((rv: any) => rv.vendors)
          .filter(Boolean) as Vendor[]
        setVendors(vendorList)
      }

      setLoading(false)
    }
    fetchData()
  }, [params.rfqId])

  const updatePrice = (index: number, price: string) => {
    const updated = [...itemPricing]
    updated[index].unit_price = price
    setItemPricing(updated)
  }

  const totalAmount = itemPricing.reduce((sum, item) => {
    const price = parseFloat(item.unit_price) || 0
    return sum + price * item.quantity
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!selectedVendor) {
      setError('Please select a vendor')
      setSubmitting(false)
      return
    }

    const hasEmptyPrices = itemPricing.some((item) => !item.unit_price || parseFloat(item.unit_price) <= 0)
    if (hasEmptyPrices) {
      setError('Please enter unit price for all items')
      setSubmitting(false)
      return
    }

    // Create quotation
    const { data: quotation, error: qError } = await supabase
      .from('quotations')
      .insert({
        rfq_id: params.rfqId as string,
        vendor_id: selectedVendor,
        status: 'submitted',
        delivery_days: deliveryDays ? parseInt(deliveryDays) : null,
        notes: notes || null,
        total_amount: totalAmount,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (qError || !quotation) {
      setError(qError?.message || 'Failed to create quotation')
      setSubmitting(false)
      return
    }

    // Insert quotation items
    const quotationItems = itemPricing.map((item) => ({
      quotation_id: quotation.id,
      rfq_item_id: item.rfq_item_id,
      unit_price: parseFloat(item.unit_price),
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('quotation_items')
      .insert(quotationItems)

    if (itemsError) {
      setError('Quotation created but failed to save line items: ' + itemsError.message)
      setSubmitting(false)
      return
    }

    // Update rfq_vendors status
    await supabase
      .from('rfq_vendors')
      .update({ status: 'submitted' })
      .eq('rfq_id', params.rfqId)
      .eq('vendor_id', selectedVendor)

    // Log activity
    await logActivity(
      'quotation.submitted',
      'quotation',
      quotation.id,
      { rfq_id: params.rfqId, vendor_id: selectedVendor, total: totalAmount }
    )

    router.push(`/dashboard/rfqs/${params.rfqId}`)
  }

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>
  if (!rfq) return <div className="flex items-center justify-center py-12">RFQ not found.</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/rfqs/${params.rfqId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Submit Quotation</h1>
          <p className="text-muted-foreground">
            For: {rfq.title} ({rfq.rfq_number})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Vendor & Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select value={selectedVendor} onValueChange={(val) => setSelectedVendor(val ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_days">Delivery Days</Label>
                <Input
                  id="delivery_days"
                  type="number"
                  placeholder="e.g. 15"
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Terms</Label>
              <Textarea
                id="notes"
                placeholder="Any special terms, conditions, or remarks..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-1">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-1 text-center">Unit</div>
                <div className="col-span-2 text-right">Unit Price (₹)</div>
                <div className="col-span-3 text-right">Total</div>
              </div>

              {itemPricing.map((item, index) => {
                const lineTotal = (parseFloat(item.unit_price) || 0) * item.quantity
                return (
                  <div key={item.rfq_item_id} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3">
                    <div className="col-span-4">
                      <p className="font-medium text-sm">{item.product_name}</p>
                    </div>
                    <div className="col-span-2 text-center text-sm">{item.quantity}</div>
                    <div className="col-span-1 text-center text-sm text-muted-foreground">{item.unit}</div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.unit_price}
                        onChange={(e) => updatePrice(index, e.target.value)}
                        className="text-right"
                      />
                    </div>
                    <div className="col-span-3 text-right font-medium text-sm">
                      ₹{lineTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-end border-t pt-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-2xl font-bold">₹{totalAmount.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href={`/dashboard/rfqs/${params.rfqId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Quotation'}
          </Button>
        </div>
      </form>
    </div>
  )
}
