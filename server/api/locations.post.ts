import type { TablesInsert } from '~/types/database.types';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<TablesInsert<'locations'>>(event);

		// Validate required fields
		if (!body.building_area || !body.location || !body.location_id) {
			throw createError({
				statusCode: 400,
				message: 'Missing required fields: building_area, location, and location_id are required',
			});
		}

		const { data, error } = await event.context.supabase
			.from('locations')
			.insert(body)
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
