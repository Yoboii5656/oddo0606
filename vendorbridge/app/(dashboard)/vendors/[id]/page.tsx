'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Phone, MapPin, Building2 } from 'lucide-react'
import type { Vendor } from '@/types/database'

export default function VendorDetailPage() {
  const params = useParams()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVendor = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) setVendor(data)
      setLoading(false)
    }
    fetchVendor()
  }, [params.id])

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>
  }

  if (!vendor) {
    return <div className="flex items-center justify-center py-12">Vendor not found.</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/vendors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{vendor.name}</h1>
          <p className="text-muted-foreground">{vendor.category || 'Uncategorized'}</p>
        </div>
        <Badge
          variant={
            vendor.status === 'active'
              ? 'default'
              : vendor.status === 'blacklisted'
              ? 'destructive'
              : 'secondary'
          }
        >
          {vendor.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{vendor.email}</span>
            </div>
            {vendor.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{vendor.phone}</span>
              </div>
            )}
            {vendor.contact_person && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{vendor.contact_person}</span>
              </div>
            )}
            {vendor.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[vendor.address, vendor.city, vendor.state, vendor.pincode]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST Number</span>
              <span>{vendor.gst_number || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAN Number</span>
              <span>{vendor.pan_number || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rating</span>
              <span>{vendor.rating ? `${vendor.rating}/5 ⭐` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registered</span>
              <span>{new Date(vendor.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
