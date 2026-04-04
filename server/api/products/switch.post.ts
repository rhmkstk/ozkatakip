import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { requireTenantContext, requireTenantProduct } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	const client = await serverSupabaseClient(event);
	const user = await serverSupabaseUser(event);
	const tenant = await requireTenantContext(event);

	if (!user) {
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
	}

	const body = await readBody(event);
	const { currentProduct, newProduct, details } = body;

	if (!currentProduct?.id || !newProduct?.id) {
		throw createError({ statusCode: 400, statusMessage: 'Missing product data' });
	}

	const currentTenantProduct = await requireTenantProduct(event, Number(currentProduct.id));
	const newTenantProduct = await requireTenantProduct(event, Number(newProduct.id));

	const { error: updateCurrentError } = await client
		.from('products')
		.update({
			location: newTenantProduct.location,
			current_status: 'damaged',
		})
		.eq('tenant_id', tenant.id)
		.eq('id', currentTenantProduct.id);

	if (updateCurrentError) throw updateCurrentError;

	const { error: updateNewError } = await client
		.from('products')
		.update({
			location: currentTenantProduct.location,
			current_status: 'active',
		})
		.eq('tenant_id', tenant.id)
		.eq('id', newTenantProduct.id);

	if (updateNewError) throw updateNewError;

	const { error: insertTransactionError } = await client.from('transactions').insert({
		tenant_id: tenant.id,
		type: 'change',
		user: user.id,
		product_id: newTenantProduct.id,
		details,
	});

	if (insertTransactionError) throw insertTransactionError;

	return { success: true };
});
