export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const ids = body?.ids as string[] | undefined;

	if (!Array.isArray(ids) || ids.length === 0) {
		throw createError({
			statusCode: 400,
			message: 'An array of product IDs is required',
		});
	}

	const { data, error } = await event.context.supabase
		.from('products')
		.delete()
		.in('id', ids)
		.select(); // returns deleted rows

	if (error) {
		throw createError({
			statusCode: 500,
			message: error.message,
		});
	}

	return {
		message: 'Products deleted successfully',
		count: data.length,
		deleted: data,
	};
});
