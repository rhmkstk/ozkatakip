import type { TenantSummary } from '~/types/tenant';

function getSlugFromPath(path: string) {
	const [candidate] = path.split('/').filter(Boolean);
	return candidate || null;
}

export function useTenant() {
	const route = useRoute();
	const activeTenant = useState<TenantSummary | null>('active-tenant', () => null);
	const activeTenantSlugCookie = useCookie<string | null>('active-tenant-slug', {
		sameSite: 'lax',
		path: '/',
	});
	const activeTenantSlug = computed(() => {
		const routeTenant = route.params.tenantSlug;
		if (typeof routeTenant === 'string' && routeTenant.trim()) {
			return routeTenant;
		}

		if (import.meta.client) {
			return getSlugFromPath(window.location.pathname);
		}

		return activeTenant.value?.slug ?? null;
	});

	const setActiveTenant = (tenant: TenantSummary | null) => {
		activeTenant.value = tenant;
		activeTenantSlugCookie.value = tenant?.slug ?? null;
	};

	watch(activeTenantSlug, (slug) => {
		if (slug) {
			activeTenantSlugCookie.value = slug;
		}
	});

	const toTenantPath = (path = '/') => {
		const slug = activeTenantSlug.value ?? activeTenant.value?.slug;
		if (!slug) {
			return path;
		}

		const normalized = path.startsWith('/') ? path : `/${path}`;
		if (normalized === '/') {
			return `/${slug}`;
		}
		if (normalized === '/login') {
			return normalized;
		}
		if (normalized.startsWith(`/${slug}/`) || normalized === `/${slug}`) {
			return normalized;
		}
		return `/${slug}${normalized}`;
	};

	return {
		activeTenant,
		activeTenantSlug,
		setActiveTenant,
		toTenantPath,
	};
}
