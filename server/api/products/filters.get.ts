import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const tenant = await requireTenantContext(event);
		const [locationResponse, modelTypeResponse] = await Promise.all([
			event.context.supabase
				.from('locations')
				.select('room')
				.eq('tenant_id', tenant.id),
			event.context.supabase
				.from('products')
				.select('model_type')
				.eq('tenant_id', tenant.id),
		]);

		if (locationResponse.error || modelTypeResponse.error) {
			throw createError({
				statusCode: 500,
				message: locationResponse.error?.message || modelTypeResponse.error?.message || 'Filter data error',
			});
		}

		const locationSet = new Set<string>();
		const modelTypeSet = new Set<string>();

		for (const item of locationResponse.data ?? []) {
			if (item?.room) {
				locationSet.add(item.room);
			}
		}

		for (const item of modelTypeResponse.data ?? []) {
			if (item?.model_type) {
				modelTypeSet.add(item.model_type);
			}
		}

		return {
			locations: Array.from(locationSet).sort(),
			modelTypes: Array.from(modelTypeSet).sort(),
		};
	}
	catch (error: unknown) {
		console.error('ERROR:', error);
		if (error instanceof Error) {
			throw createError({
				statusCode: (error as any).statusCode || 500,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
