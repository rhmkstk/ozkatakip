import { getQuery } from 'h3';
import { requireTenantContext } from '~/server/utils/tenant';
import { normalizeAssetCode } from '~/utils/assetCode';

const getFirstQueryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default defineEventHandler(async (event) => {
	try {
		const tenant = await requireTenantContext(event);
		const query = getQuery(event);
		const rangeStartDate = getFirstQueryValue(query.start_date as string | string[] | undefined);
		const rangeEndDate = getFirstQueryValue(query.end_date as string | string[] | undefined);
		const location = getFirstQueryValue(query.location as string | string[] | undefined);
		const modelType = getFirstQueryValue(query.model_type as string | string[] | undefined);
		const assetCode = getFirstQueryValue(query.asset_code as string | string[] | undefined);
		const normalizedAssetCode = assetCode ? normalizeAssetCode(assetCode) : null;
		if (assetCode && !normalizedAssetCode) return [];

		if (!rangeStartDate || !rangeEndDate) {
			throw createError({
				statusCode: 400,
				message: 'Missing start_date or end_date parameter',
			});
		}

		let request = event.context.supabase
			.from('products')
			.select('*, locations!inner(*, building_id(*))')
			.eq('tenant_id', tenant.id)
			.gte('next_refill_date', rangeStartDate)
			.lte('next_refill_date', rangeEndDate)
			.order('next_refill_date', { ascending: true });

		if (location) {
			request = request.ilike('locations.room', `%${location}%`);
		}
		if (modelType) {
			request = request.ilike('model_type', `%${modelType}%`);
		}
		if (normalizedAssetCode) {
			request = request.eq('asset_code', normalizedAssetCode);
		}

		const { data, error } = await request;
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
			const errorWithStatus = error as Error & { statusCode?: number };
			throw createError({
				statusCode: errorWithStatus.statusCode || 500,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
