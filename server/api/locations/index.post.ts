import type { TablesInsert } from '~/types/database.types';
import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<TablesInsert<'locations'>>(event);
		const tenant = await requireTenantContext(event);

		const { data: building, error: buildingError } = await event.context.supabase
			.from('location_buildings')
			.select('id')
			.eq('tenant_id', tenant.id)
			.eq('id', body.building_id)
			.maybeSingle();

		if (buildingError) {
			throw createError({
				statusCode: 500,
				message: buildingError.message,
			});
		}

		if (!building) {
			throw createError({
				statusCode: 404,
				message: 'Building not found in active tenant',
			});
		}

		const { data, error } = await event.context.supabase
			.from('locations')
			.upsert({
				...body,
				tenant_id: tenant.id,
			}, { onConflict: 'tenant_id,location_id' })
			.select()
			.single();

		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}

		return data;
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
