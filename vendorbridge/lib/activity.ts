import { supabase } from '@/lib/supabase/client'

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('activity_logs').insert({
    actor_id: user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || null,
  })
}
