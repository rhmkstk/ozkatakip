import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event);
	const user = await serverSupabaseUser(event);

	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
	}

	const body = await readBody(event);
	const { currentProduct, newProduct, details } = body;

	if (!currentProduct?.id || !newProduct?.id) {
		throw createError({ statusCode: 400, statusMessage: 'Missing product data' });
	}

	const { error: updateCurrentError } = await client
		.from('products')
		.update({
			location: newProduct.location,
			current_status: 'damaged',
		})
		.eq('id', currentProduct.id);

	if (updateCurrentError) throw updateCurrentError;

	const { error: updateNewError } = await client
		.from('products')
		.update({
			location: currentProduct.location,
			current_status: 'active',
		})
		.eq('id', newProduct.id);

	if (updateNewError) throw updateNewError;

	const { error: insertTransactionError } = await client.from('transactions').insert({
		type: 'change',
		user: user.id,
		product_id: newProduct.id,
		details,
	});

	if (insertTransactionError) throw insertTransactionError;

	return { success: true };
});