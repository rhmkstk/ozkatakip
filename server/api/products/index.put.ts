// product.put.ts
import { requireTenantContext } from '~/server/utils/tenant';
import type { MobileProductPatchPayload } from '~/types/mobile-transaction';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<MobileProductPatchPayload>(event);
		const tenant = await requireTenantContext(event);

		if (!body?.id) {
			throw createError({
				statusCode: 400,
				message: 'Product ID is required for update',
			});
		}

		const {
			id,
			current_status,
			refill_period,
			refill_date,
			next_refill_date,
			hydrostatic_test_date,
			next_hydrostatic_test_date,
		} = body;

		const updateData = {
			...(current_status !== undefined ? { current_status } : {}),
			...(refill_period !== undefined ? { refill_period } : {}),
			...(refill_date !== undefined ? { refill_date } : {}),
			...(next_refill_date !== undefined ? { next_refill_date } : {}),
			...(hydrostatic_test_date !== undefined ? { hydrostatic_test_date } : {}),
			...(next_hydrostatic_test_date !== undefined ? { next_hydrostatic_test_date } : {}),
		};

		const { data, error } = await event.context.supabase
			.from('products')
			.update(updateData)
			.eq('tenant_id', tenant.id)
			.eq('id', id)
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
