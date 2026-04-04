import type { TablesInsert } from '~/types/database.types';
import { requireTenantContext, requireTenantProduct } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<TablesInsert<'transactions'>>(event);
		const tenant = await requireTenantContext(event);

		await requireTenantProduct(event, Number(body.product_id));

		const { data, error } = await event.context.supabase
			.from('transactions')
			.insert({
				...body,
				tenant_id: tenant.id,
			})
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
