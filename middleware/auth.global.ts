import { useSupabaseClient, useSupabaseUser } from '#imports'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  // Exclude login page 
  if (to.path === '/login' || to.path === '/register') {
    return // allow access without auth
  }
  // If user is not loaded yet, try to fetch session
  if (!user.value) {
    const { data: { session } } = await supabase.auth.getSession()

  }

  if (!user.value) {
    // Not logged in, redirect to login page
    return navigateTo('/login')
  }
})