export default defineNuxtPlugin(() => {
	const tenantFetch = $fetch.create({
		onRequest({ request, options }) {
			if (typeof request !== 'string' || !request.startsWith('/api/')) {
				return;
			}

			const [tenantSlug] = window.location.pathname.split('/').filter(Boolean);
			if (!tenantSlug || tenantSlug === 'login') {
				return;
			}

			const headers = new Headers(options.headers as HeadersInit | undefined);
			if (!headers.has('x-tenant-slug')) {
				headers.set('x-tenant-slug', tenantSlug);
			}
			options.headers = headers;
		},
	});

	globalThis.$fetch = tenantFetch as typeof $fetch;
});
