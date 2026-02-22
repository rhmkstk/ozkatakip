export default defineEventHandler(async (event) => {
	try {
		const [buildingResponse, locationResponse] = await Promise.all([
			event.context.supabase
				.from('location_buildings')
				.select('name'),
			event.context.supabase
				.from('locations')
				.select('room, location_id'),
		]);

		if (buildingResponse.error || locationResponse.error) {
			throw createError({
				statusCode: 500,
				message: buildingResponse.error?.message || locationResponse.error?.message || 'Filter data error',
			});
		}

		const buildingSet = new Set<string>();
		for (const item of buildingResponse.data ?? []) {
			if (item?.name) {
				buildingSet.add(item.name);
			}
		}

		const locationSet = new Set<string>();
		const yscSet = new Set<string>();
		for (const item of locationResponse.data ?? []) {
			if (item?.room) {
				locationSet.add(item.room);
			}
			if (item?.location_id) {
				yscSet.add(item.location_id);
			}
		}

		return {
			buildings: Array.from(buildingSet).sort(),
			locations: Array.from(locationSet).sort(),
			yscNos: Array.from(yscSet).sort(),
		};
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
		if (error instanceof Error) {
			throw createError({
				statusCode: error.statusCode || 500,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
