import { useSupabaseUser } from '#imports';

export default defineNuxtRouteMiddleware(async (to) => {
	const user = useSupabaseUser();
	// Exclude login page
	if (to.path === '/login') {
		return;
	}
	if (!user.value) {
		return navigateTo('/login');
	}
});
