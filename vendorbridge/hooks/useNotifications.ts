'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useNotificationStore } from '@/store/notificationStore'
import type { Notification } from '@/types/database'

export function useNotifications(userId: string | undefined) {
  const addNotification = useNotificationStore((s) => s.add)
  const setNotifications = useNotificationStore((s) => s.setNotifications)

  useEffect(() => {
    if (!userId) return

    // Fetch existing notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) setNotifications(data)
    }

    fetchNotifications()

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addNotification(payload.new as Notification)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, addNotification, setNotifications])
}
