import type { TablesInsert } from '~/types/database.types';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<TablesInsert<'location_buildings'>>(event);

		// Validate required fields
		if (!body.name) {
			throw createError({
				statusCode: 400,
				message: 'Missing required fields: name are required',
			});
		}

		const { data, error } = await event.context.supabase
			.from('location_buildings')
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
