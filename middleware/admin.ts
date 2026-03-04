export default defineNuxtRouteMiddleware(async () => {
	const user = useSupabaseUser();

	if (!user.value) {
		return navigateTo('/login');
	}

	const { currentUser, loadCurrentUser } = useCurrentAppUser();
	await loadCurrentUser();

	if (!currentUser.value || currentUser.value.role !== 'admin') {
		return navigateTo('/mobile');
	}
});
