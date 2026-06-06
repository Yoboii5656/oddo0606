'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { Activity } from 'lucide-react'
import type { ActivityLog } from '@/types/database'

interface ActivityLogWithActor extends ActivityLog {
  profiles: { full_name: string } | null
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLogWithActor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select(`*, profiles:actor_id (full_name)`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setLogs(data as unknown as ActivityLogWithActor[])
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const formatAction = (action: string) => {
    return action
      .replace('.', ' › ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Activity Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{log.profiles?.full_name || 'System'}</span>
                      {' — '}
                      {formatAction(log.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
