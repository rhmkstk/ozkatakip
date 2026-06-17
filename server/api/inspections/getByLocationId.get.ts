import { getAdminClient } from '~/server/utils/user-management';
import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const locationID = getFirstQueryValue(query.location_id);
		const tenantSlug = getFirstQueryValue(query.tenant_slug);
		const supabase = await getAdminClient(event);

		if (!locationID) {
			throw createError({
				statusCode: 400,
				message: 'Missing location_id parameter',
			});
		}

		const tenant = tenantSlug
			? await resolveTenantBySlug(supabase, tenantSlug)
			: await requireTenantContext(event);

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
			.eq('products.locations.location_id', locationID)
			.not('created_at', 'is', null)
			.order('created_at', { ascending: false })
			.limit(1);
		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}
		const [latestInspection] = data ?? [];
		if (!latestInspection?.user_id) {
			return data ?? [];
		}

		const { data: inspector, error: inspectorError } = await supabase
			.from('app_users')
			.select('first_name, last_name')
			.eq('id', latestInspection.user_id)
			.maybeSingle();

		if (inspectorError) {
			throw createError({
				statusCode: 500,
				message: inspectorError.message,
			});
		}

		return [
			{
				...latestInspection,
				inspector,
			},
		];
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
		if (isHttpError(error)) {
			throw error;
		}
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

function getFirstQueryValue(value: unknown) {
	if (Array.isArray(value)) {
		return typeof value[0] === 'string' ? value[0].trim() : null;
	}

	return typeof value === 'string' ? value.trim() : null;
}

function isHttpError(error: unknown): error is { statusCode: number } {
	return typeof error === 'object'
		&& error !== null
		&& 'statusCode' in error
		&& typeof error.statusCode === 'number';
}

async function resolveTenantBySlug(
	supabase: Awaited<ReturnType<typeof getAdminClient>>,
	tenantSlug: string,
) {
	const { data, error } = await supabase
		.from('tenants')
		.select('id, slug, name, status')
		.eq('slug', tenantSlug.trim())
		.maybeSingle();

	if (error) {
		throw createError({
			statusCode: 500,
			message: `Tenant bilgisi alinamadi: ${error.message}`,
		});
	}

	if (!data) {
		throw createError({
			statusCode: 404,
			message: 'Tenant bulunamadi',
		});
	}

	return data;
}
