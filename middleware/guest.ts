import { useSupabaseUser } from '#imports';

export default defineNuxtRouteMiddleware(async () => {
	const user = useSupabaseUser();
	const { currentUser, loadCurrentUser } = useCurrentAppUser();
	if (user.value) {
		await loadCurrentUser();
		if (!currentUser.value?.activeTenant?.slug) {
			return;
		}

		return navigateTo(currentUser.value?.role === 'admin'
			? `/${currentUser.value?.activeTenant?.slug ?? ''}`.replace(/\/$/, '')
			: `/${currentUser.value?.activeTenant?.slug ?? ''}/mobile`.replace(/\/$/, ''));
	}
});
