import { requireTenantContext } from '~/server/utils/tenant';

// getProductWithLocationId.ts
export default defineEventHandler(async (event) => {
	try {
		const locationID = getQuery(event).location_id;
		const tenant = await requireTenantContext(event);

		if (!locationID) {
			throw createError({
				statusCode: 400,
				message: 'Missing location_id parameter',
			});
		}

		console.log('locationID:', locationID);

		const { data } = await event.context.supabase
			.from('products')
			.select('*')
			.eq('tenant_id', tenant.id)
			.eq('location', locationID);

		console.log('data:', data);
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
