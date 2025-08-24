import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  if (!event.context.supabase) {
    event.context.supabase = await serverSupabaseClient<Database>(event)
  }
})
