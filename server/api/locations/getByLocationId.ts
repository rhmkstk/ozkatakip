// getProductWithLocationId.ts
export default defineEventHandler(async (event) => {
	try {
		const locationId = getQuery(event).location_id;

		if (!locationId) {
			throw createError({
				statusCode: 400,
				message: 'Missing location_id parameter',
			});
		}

		const { data } = await event.context.supabase
			.from('locations')
			.select('*, building_id(*)')
			.eq('location_id', locationId);
		return data;
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
		if (error instanceof Error) {
			throw createError({
				name: error.name,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
