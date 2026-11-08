import { requireTenantContext } from '~/server/utils/tenant';
import { normalizeAssetCode } from '~/utils/assetCode';
import { normalizeAssetUid } from '~/utils/assetUid';

export default defineEventHandler(async (event) => {
	const identifier = getFirstQueryValue(getQuery(event).identifier);
	const assetUid = normalizeAssetUid(identifier);
	const assetCode = normalizeAssetCode(identifier);
	const tenant = await requireTenantContext(event);

	if (!identifier) {
		throw createError({
			statusCode: 400,
			message: 'Tüp kodu, QR kimliği veya YSC No gereklidir.',
		});
	}

	let request = event.context.supabase
		.from('products')
		.select('*, locations!inner(*, building_id(*))')
		.eq('tenant_id', tenant.id);

	if (assetUid) {
		request = request.eq('asset_uid', assetUid);
	}
	else if (assetCode) {
		request = request.eq('asset_code', assetCode);
	}
	else {
		request = request.eq('locations.location_id', identifier);
	}

	const { data, error } = await request.maybeSingle();

	if (error) {
		throw createError({ statusCode: 500, message: error.message });
	}

	if (!data) {
		throw createError({
			statusCode: 404,
			message: 'Bu tüp kodu, QR kimliği veya YSC No ile eşleşen kayıt bulunamadı.',
		});
	}

	if (!data.locations) {
		throw createError({
			statusCode: 409,
			message: 'YSC bulundu ancak konum bilgisi eksik.',
		});
	}

	return {
		product: data,
		location: data.locations,
	};
});

function getFirstQueryValue(value: unknown) {
	if (Array.isArray(value)) {
		return typeof value[0] === 'string' ? value[0].trim() : null;
	}

	return typeof value === 'string' ? value.trim() : null;
}
