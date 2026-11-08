export const ASSET_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const ASSET_CODE_PATTERN
	= /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]$/;

function calculateChecksum(data: string) {
	return [...data].reduce((checksum, character, index) => {
		const characterPosition = ASSET_CODE_ALPHABET.indexOf(character) + 1;
		return (checksum + ((index + 1) * characterPosition)) % ASSET_CODE_ALPHABET.length;
	}, 0);
}

export function normalizeAssetCode(value: unknown) {
	if (typeof value !== 'string') {
		return null;
	}

	const compact = value.trim().toUpperCase().replace(/[-\s]/g, '');
	if (compact.length !== 11) {
		return null;
	}

	const data = compact.slice(0, 10);
	const suppliedChecksum = compact.at(-1);
	if ([...compact].some(character => !ASSET_CODE_ALPHABET.includes(character))) {
		return null;
	}

	const expectedChecksum = ASSET_CODE_ALPHABET[calculateChecksum(data)];
	if (suppliedChecksum !== expectedChecksum) {
		return null;
	}

	const formatted = `${data.slice(0, 5)}-${data.slice(5)}-${suppliedChecksum}`;
	return ASSET_CODE_PATTERN.test(formatted) ? formatted : null;
}
