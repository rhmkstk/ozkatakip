import { useSupabaseUser } from '#imports';

const PUBLIC_PATHS = ['/login', '/inspections'];

export default defineNuxtRouteMiddleware((to) => {
	const user = useSupabaseUser();
	const targetPath = to.path ?? '';
	const isPublicRoute = PUBLIC_PATHS.some((path) => targetPath === path || targetPath.startsWith(`${path}/`));

	if (isPublicRoute) {
		return;
	}
	if (!user.value) {
		return navigateTo('/login');
	}
});
