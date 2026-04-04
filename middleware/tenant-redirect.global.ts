const LEGACY_TOP_LEVEL_PATHS = new Set([
	'',
	'products',
	'planning',
	'history',
	'fill-records',
	'users',
	'insert-data',
	'mobile',
]);

export default defineNuxtRouteMiddleware(async (to) => {
	if (to.path === '/login') {
		return;
	}

	const user = useSupabaseUser();
	if (!user.value) {
		return;
	}

	const { currentUser, loadCurrentUser } = useCurrentAppUser();
	await loadCurrentUser();

	const tenantSlug = currentUser.value?.activeTenant?.slug;
	if (!tenantSlug) {
		return;
	}

	const [firstSegment] = to.path.split('/').filter(Boolean);
	if (!LEGACY_TOP_LEVEL_PATHS.has(firstSegment ?? '')) {
		return;
	}

	return navigateTo(`/${tenantSlug}${to.fullPath === '/' ? '' : to.fullPath}`);
});
