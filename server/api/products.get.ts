// import { TablesInsert } from '~/types/database.types'

export default defineEventHandler(async (event) => {
	try {
		const { data, error } = await event.context.supabase
			.from('products')
			.select('*, locations(location,building_area,location_id)');

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
