export default defineNuxtRouteMiddleware(async () => {
	const user = useSupabaseUser();
	const { toTenantPath } = useTenant();

	if (!user.value) {
		return navigateTo('/login');
	}

	const { currentUser, loadCurrentUser } = useCurrentAppUser();
	await loadCurrentUser();

	if (!currentUser.value || currentUser.value.role !== 'admin') {
		return navigateTo(toTenantPath('/mobile'));
	}
});
