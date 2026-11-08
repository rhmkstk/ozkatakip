export const ASSET_UID_PATTERN
	= /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeAssetUid(value: unknown) {
	if (typeof value !== 'string') {
		return null;
	}

	const normalized = value.trim().toLowerCase();
	return ASSET_UID_PATTERN.test(normalized) ? normalized : null;
}
