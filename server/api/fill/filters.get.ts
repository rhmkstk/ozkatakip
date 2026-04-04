import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const tenant = await requireTenantContext(event);
		const [buildingResponse, productResponse] = await Promise.all([
			event.context.supabase
				.from('location_buildings')
				.select('name')
				.eq('tenant_id', tenant.id),
			event.context.supabase
				.from('products')
				.select('unit, model_type')
				.eq('tenant_id', tenant.id),
		]);

		if (buildingResponse.error || productResponse.error) {
			throw createError({
				statusCode: 500,
				message: buildingResponse.error?.message
					|| productResponse.error?.message
					|| 'Filter data error',
			});
		}

		const buildingSet = new Set<string>();
		for (const item of buildingResponse.data ?? []) {
			if (item?.name) {
				buildingSet.add(item.name);
			}
		}

		const unitSet = new Set<string>();
		const modelTypeSet = new Set<string>();
		for (const item of productResponse.data ?? []) {
			if (item?.unit) {
				unitSet.add(item.unit);
			}
			if (item?.model_type) {
				modelTypeSet.add(item.model_type);
			}
		}

		return {
			buildings: Array.from(buildingSet).sort(),
			units: Array.from(unitSet).sort(),
			modelTypes: Array.from(modelTypeSet).sort(),
		};
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
		if (error instanceof Error) {
			const errorWithStatus = error as Error & { statusCode?: number };
			throw createError({
				statusCode: errorWithStatus.statusCode || 500,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
