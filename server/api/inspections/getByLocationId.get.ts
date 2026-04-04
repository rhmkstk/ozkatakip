import { getAdminClient } from '~/server/utils/user-management';
import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const locationID = getQuery(event).location_id;
		const tenant = await requireTenantContext(event);
		const supabase = process.env.SUPABASE_SERVICE_KEY
			? await getAdminClient(event)
			: event.context.supabase;

		if (!locationID) {
			throw createError({
				statusCode: 400,
				message: 'Missing location_id parameter',
			});
		}

			const { data, error } = await supabase
				.from('inspections')
			.select(`
        *,
        products!inner(
          id,
          brand,
          model_type,
          serial_number,
          unit,
          refill_date,
          next_refill_date,
          locations!inner(
            id,
            location_id,
            room,
            building_id(*)
          )
        )
      `)
				.eq('tenant_id', tenant.id)
				.eq('products.locations.location_id', String(locationID))
			.not('created_at', 'is', null)
			.order('created_at', { ascending: false })
			.limit(1);
		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}
		return data ?? [];
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
