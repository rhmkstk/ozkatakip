import { requireAdminUser } from '~/server/utils/user-management';

type UpdateBuildingBody = {
	id?: number | string;
	name?: string;
};

export default defineEventHandler(async (event) => {
	try {
		const { tenant } = await requireAdminUser(event);
		const body = await readBody<UpdateBuildingBody>(event);
		const rawId = body?.id;
		const buildingId = typeof rawId === 'string'
			? Number.parseInt(rawId, 10)
			: rawId;
		const name = body?.name?.trim();

		if (!Number.isFinite(buildingId)) {
			throw createError({
				statusCode: 400,
				message: 'Valid building id is required',
			});
		}

		if (!name) {
			throw createError({
				statusCode: 400,
				message: 'Building name is required',
			});
		}

		const { data: building, error: buildingError } = await event.context.supabase
			.from('location_buildings')
			.select('id')
			.eq('tenant_id', tenant.id)
			.eq('id', buildingId)
			.maybeSingle();

		if (buildingError) {
			throw createError({
				statusCode: 500,
				message: `Failed to fetch building: ${buildingError.message}`,
			});
		}

		if (!building) {
			throw createError({
				statusCode: 404,
				message: 'Building not found',
			});
		}

		const { data, error } = await event.context.supabase
			.from('location_buildings')
			.update({ name })
			.eq('tenant_id', tenant.id)
			.eq('id', buildingId)
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
		console.error('[api/location-buildings PUT] Error:', error);

		if (error && typeof error === 'object') {
			const knownError = error as {
				statusCode?: number;
				message?: string;
			};

			throw createError({
				statusCode: knownError.statusCode ?? 500,
				message: knownError.message ?? 'Unknown error while updating building',
			});
		}

		throw createError({
			statusCode: 500,
			message: 'Unknown error while updating building',
		});
	}
});
