const DEFAULT_LEGACY_INSPECTION_TENANT_SLUG = 'tuprag';

export default defineNuxtRouteMiddleware((to) => {
	if (to.path !== '/inspections' && !to.path.startsWith('/inspections/')) {
		return;
	}

	return navigateTo(`/${DEFAULT_LEGACY_INSPECTION_TENANT_SLUG}${to.fullPath}`, {
		replace: true,
		redirectCode: 301,
	});
});
