import { getAdminClient } from '~/server/utils/user-management';
import { requireTenantContext } from '~/server/utils/tenant';
import { normalizeAssetUid } from '~/utils/assetUid';

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const assetUid = normalizeAssetUid(getFirstQueryValue(query.asset_uid));
		const tenantSlug = getFirstQueryValue(query.tenant_slug);
		const month = getFirstQueryValue(query.month);
		const supabase = await getAdminClient(event);

		if (!assetUid) {
			throw createError({
				statusCode: 400,
				message: 'Geçerli bir tüp QR kimliği gereklidir.',
			});
		}

		const tenant = tenantSlug
			? await resolveTenantBySlug(supabase, tenantSlug)
			: await requireTenantContext(event);

		let request = supabase
			.from('inspections')
			.select(`
        *,
        products!inner(
          id,
          asset_code,
          asset_uid,
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
			.eq('products.asset_uid', assetUid)
			.not('created_at', 'is', null);

		if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
			const [year, monthNumber] = month.split('-').map(Number);
			const dateFrom = `${month}-01`;
			const dateTo = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
			request = request.gte('date', dateFrom).lt('date', dateTo);
		}

		const { data, error } = await request
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
