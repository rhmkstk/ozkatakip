// product.put.ts

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event);

		if (!body?.id) {
			throw createError({
				statusCode: 400,
				message: 'Product ID is required for update',
			});
		}

		const { id, ...updateData } = body;

		const { data, error } = await event.context.supabase
			.from('products')
			.update(updateData)
			.eq('id', id)
			.select(); // return the updated row(s)

		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}

		return data;
	}
	catch (error: unknown) {
		console.log('PUT ERROR:', error);
		if (error instanceof Error) {
			throw createError({
				name: error.name,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred during product update',
		});
	}
});
