import { requireTenantContext } from '~/server/utils/tenant';
import { normalizeAssetCode } from '~/utils/assetCode';
import { normalizeAssetUid } from '~/utils/assetUid';

export default defineEventHandler(async (event) => {
	const identifier = getFirstQueryValue(getQuery(event).identifier);
	const assetUid = normalizeAssetUid(identifier);
	const assetCode = normalizeAssetCode(identifier);
	const tenant = await requireTenantContext(event);

	if (!assetUid && !assetCode) {
		throw createError({
			statusCode: 400,
			message: 'Geçerli bir tüp kodu veya QR kimliği gereklidir.',
		});
	}

	let request = event.context.supabase
		.from('products')
		.select('*, locations(*, building_id(*))')
		.eq('tenant_id', tenant.id);

	request = assetUid
		? request.eq('asset_uid', assetUid)
		: request.eq('asset_code', assetCode as string);

	const { data, error } = await request.maybeSingle();

	if (error) {
		throw createError({ statusCode: 500, message: error.message });
	}

	if (!data) {
		throw createError({
			statusCode: 404,
			message: 'Bu tüp kodu veya QR kimliğiyle eşleşen bir YSC bulunamadı.',
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
