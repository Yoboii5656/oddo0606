'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase/client'
import { rfqSchema, type RFQFormValues } from '@/lib/validations/rfq'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import type { Vendor } from '@/types/database'

export default function NewRFQPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RFQFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      items: [{ product_name: '', description: '', quantity: 1, unit: 'pcs' }],
      vendor_ids: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('status', 'active')
        .order('name')
      if (data) setVendors(data)
    }
    fetchVendors()
  }, [])

  const toggleVendor = (id: string) => {
    const updated = selectedVendors.includes(id)
      ? selectedVendors.filter((v) => v !== id)
      : [...selectedVendors, id]
    setSelectedVendors(updated)
    setValue('vendor_ids', updated)
  }

  const onSubmit = async (data: RFQFormValues) => {
    setLoading(true)
    setError(null)

    // Create RFQ
    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .insert([{
        title: data.title,
        description: data.description,
        deadline: data.deadline,
        status: 'open',
      }])
      .select()
      .single()

    if (rfqError || !rfq) {
      setError(rfqError?.message || 'Failed to create RFQ')
      setLoading(false)
      return
    }

    // Insert RFQ items
    const items = data.items.map((item) => ({
      rfq_id: rfq.id,
      product_name: item.product_name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
    }))

    await supabase.from('rfq_items').insert(items)

    // Invite vendors
    const rfqVendors = data.vendor_ids.map((vendor_id) => ({
      rfq_id: rfq.id,
      vendor_id,
    }))

    await supabase.from('rfq_vendors').insert(rfqVendors)

    router.push('/dashboard/rfqs')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rfqs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create RFQ</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} placeholder="e.g. Office Furniture Procurement" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} placeholder="Describe what you need..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input id="deadline" type="date" {...register('deadline')} />
              {errors.deadline && <p className="text-sm text-destructive">{errors.deadline.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ product_name: '', description: '', quantity: 1, unit: 'pcs' })}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.items?.root && (
              <p className="text-sm text-destructive">{errors.items.root.message}</p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Item {index + 1}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Product Name *</Label>
                    <Input {...register(`items.${index}.product_name`)} />
                    {errors.items?.[index]?.product_name && (
                      <p className="text-xs text-destructive">{errors.items[index].product_name?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Input {...register(`items.${index}.description`)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Quantity *</Label>
                    <Input type="number" {...register(`items.${index}.quantity`)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Unit *</Label>
                    <Input {...register(`items.${index}.unit`)} placeholder="pcs, kg, liters..." />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {errors.vendor_ids && (
              <p className="text-sm text-destructive mb-3">{errors.vendor_ids.message}</p>
            )}
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active vendors found.{' '}
                <Link href="/dashboard/vendors/new" className="text-primary hover:underline">
                  Register a vendor
                </Link>{' '}
                first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {vendors.map((vendor) => (
                  <label
                    key={vendor.id}
                    className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedVendors.includes(vendor.id) ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor.id)}
                      onChange={() => toggleVendor(vendor.id)}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.category}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/dashboard/rfqs">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create RFQ'}
          </Button>
        </div>
      </form>
    </div>
  )
}
