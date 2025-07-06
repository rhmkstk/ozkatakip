import type { TablesInsert } from '~/types/database.types';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<TablesInsert<'transactions'>>(event);

		const { data, error } = await event.context.supabase
			.from('transactions')
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
