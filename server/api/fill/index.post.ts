import type { MobileFillPayload } from '~/types/mobile-transaction';
import { requireTenantContext, requireTenantProduct } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<MobileFillPayload>(event);
		const tenant = await requireTenantContext(event);

		if (!body?.product_id) {
			throw createError({
				statusCode: 400,
				message: 'product_id zorunludur',
			});
		}

		await requireTenantProduct(event, Number(body.product_id));

		const { data, error } = await event.context.supabase
			.from('fill_records')
			.insert({
				...body,
				tenant_id: tenant.id,
			})
			.select()
			.single();

		if (error) {
			console.error('Supabase error:', error);
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}

		return data;
	}
	catch (error: unknown) {
		console.error('Unexpected error:', error);

		if (error instanceof Error) {
			const statusCode = (
				'statusCode' in error
				&& typeof error.statusCode === 'number'
			)
				? error.statusCode
				: 500;

			throw createError({
				statusCode,
				message: error.message,
			});
		}

		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
