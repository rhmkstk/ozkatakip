import type {
	CachedMobileTransactionContext,
	OfflineFillQueuePayload,
	OfflineInspectionQueuePayload,
	OfflinePhotoRecord,
	OfflineProductSwitchQueuePayload,
	OfflineProductUpdateQueuePayload,
	OfflineQueuedAction,
} from '~/types/mobile-offline';
import type {
	MobileFillPayload,
	MobileInspectionPayload,
	MobileProductPatchPayload,
	MobileTransactionContext,
	MobileTransactionPayload,
} from '~/types/mobile-transaction';
import {
	countPendingOfflineActions,
	deleteOfflinePhotoRecord,
	deleteOfflineQueueAction,
	getCachedMobileTransactionContext,
	getMobileOfflineMeta,
	getOfflinePhotoRecord,
	listOfflineQueueActions,
	putCachedMobileTransactionContext,
	putOfflinePhotoRecord,
	putOfflineQueueAction,
	setMobileOfflineMeta,
	updateOfflineQueueAction,
} from '~/utils/mobile-offline-store';

const LAST_SYNC_META_KEY = 'last-sync-at';
const DEFAULT_CACHE_SOURCE = 'network';

function getNowIso() {
	return new Date().toISOString();
}

function createOfflineActionId() {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}

	return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isOfflineNetworkError(error: unknown) {
	if (typeof navigator !== 'undefined' && !navigator.onLine) {
		return true;
	}

	if (!(error instanceof Error)) {
		return false;
	}

	return /fetch|network|offline|Failed to fetch|Load failed/i.test(error.message);
}

export function createEmptyMobileTransactionContext(locationId: string): MobileTransactionContext {
	return {
		product: {
			id: 0,
			model_type: null,
			unit: null,
			current_status: null,
			refill_date: null,
			next_refill_date: null,
			hydrostatic_test_date: null,
			serial_number: null,
			refill_period: null,
		},
		location: {
			id: 0,
			location_id: locationId,
			room: null,
			building_id: {
				name: null,
			},
		},
		latestInspection: {
			created_at: null,
			is_same_month: false,
		},
	};
}

function toCachedContext(
	tenantSlug: string,
	locationId: string,
	context: MobileTransactionContext,
	source: CachedMobileTransactionContext['source'] = DEFAULT_CACHE_SOURCE,
): CachedMobileTransactionContext {
	return {
		key: `${tenantSlug}:${locationId}`,
		tenantSlug,
		locationId,
		context,
		cachedAt: getNowIso(),
		source,
	};
}

async function requestJson<T>(
	input: string,
	init: RequestInit = {},
	tenantSlug?: string,
) {
	const response = await fetch(input, {
		credentials: 'include',
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
			...(init.headers ?? {}),
		},
	});

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}

	if (response.status === 204) {
		return null as T;
	}

	return await response.json() as T;
}

async function uploadInspectionPhoto(
	tenantSlug: string,
	photoRecord: OfflinePhotoRecord,
) {
	const formData = new FormData();
	const file = new File([photoRecord.file], photoRecord.fileName, {
		type: photoRecord.fileType || photoRecord.file.type || 'image/jpeg',
	});
	formData.append('file', file);

	const response = await fetch('/api/upload/inspection-photo', {
		method: 'POST',
		credentials: 'include',
		headers: {
			'x-tenant-slug': tenantSlug,
		},
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`${response.status} ${response.statusText}`);
	}

	const result = await response.json() as { filePath?: string };
	return result.filePath ?? '';
}

async function fetchTransactionContextFromApi(
	tenantSlug: string,
	locationId: string,
) {
	const params = new URLSearchParams({ location_id: locationId, tenant_slug: tenantSlug });
	return await requestJson<MobileTransactionContext>(
		`/api/mobile/transactions/getByLocationId?${params.toString()}`,
		{
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
		},
		tenantSlug,
	);
}

export async function fetchAndCacheMobileTransactionContext(
	tenantSlug: string,
	locationId: string,
) {
	const context = await fetchTransactionContextFromApi(tenantSlug, locationId);
	await putCachedMobileTransactionContext(toCachedContext(tenantSlug, locationId, context));
	return context;
}

export async function getOfflineAwareMobileTransactionContext(
	tenantSlug: string,
	locationId: string,
) {
	try {
		const context = await fetchAndCacheMobileTransactionContext(tenantSlug, locationId);
		return {
			context,
			source: 'network' as const,
			hasCachedFallback: true,
		};
	}
	catch (error) {
		const cached = await getCachedMobileTransactionContext(tenantSlug, locationId);
		if (cached?.context) {
			return {
				context: cached.context,
				source: 'cache' as const,
				hasCachedFallback: true,
			};
		}

		if (isOfflineNetworkError(error)) {
			return {
				context: createEmptyMobileTransactionContext(locationId),
				source: 'empty' as const,
				hasCachedFallback: false,
			};
		}

		throw error;
	}
}

export async function queueOfflinePhoto(
	tenantSlug: string,
	file: Blob,
	fileName: string,
	fileType: string,
) {
	const id = createOfflineActionId();
	await putOfflinePhotoRecord({
		id,
		tenantSlug,
		file,
		fileName,
		fileType,
		createdAt: getNowIso(),
	});
	return id;
}

export async function queueOfflineInspectionAction(
	tenantSlug: string,
	payload: OfflineInspectionQueuePayload,
) {
	const action: OfflineQueuedAction = {
		id: createOfflineActionId(),
		tenantSlug,
		kind: 'inspection-submit',
		status: 'pending',
		attemptCount: 0,
		createdAt: getNowIso(),
		lastError: null,
		payload,
	};

	await putOfflineQueueAction(action);
	return action;
}

export async function queueOfflineFillAction(
	tenantSlug: string,
	payload: OfflineFillQueuePayload,
) {
	const action: OfflineQueuedAction = {
		id: createOfflineActionId(),
		tenantSlug,
		kind: 'fill-submit',
		status: 'pending',
		attemptCount: 0,
		createdAt: getNowIso(),
		lastError: null,
		payload,
	};

	await putOfflineQueueAction(action);
	return action;
}

export async function queueOfflineProductSwitchAction(
	tenantSlug: string,
	payload: OfflineProductSwitchQueuePayload,
) {
	const action: OfflineQueuedAction = {
		id: createOfflineActionId(),
		tenantSlug,
		kind: 'product-switch',
		status: 'pending',
		attemptCount: 0,
		createdAt: getNowIso(),
		lastError: null,
		payload,
	};

	await putOfflineQueueAction(action);
	return action;
}

export async function queueOfflineProductUpdateAction(
	tenantSlug: string,
	payload: OfflineProductUpdateQueuePayload,
) {
	const action: OfflineQueuedAction = {
		id: createOfflineActionId(),
		tenantSlug,
		kind: 'product-update',
		status: 'pending',
		attemptCount: 0,
		createdAt: getNowIso(),
		lastError: null,
		payload,
	};

	await putOfflineQueueAction(action);
	return action;
}

function buildFillProductPatch(
	context: MobileTransactionContext,
	payload: OfflineFillQueuePayload,
): MobileProductPatchPayload {
	const refillPeriod = context.product.refill_period || 2;
	const now = new Date();
	const fillDate = now.toISOString().split('T')[0] ?? '';
	const refillDate = new Date(now);
	refillDate.setFullYear(refillDate.getFullYear() + Number(refillPeriod));
	const formattedRefillDate = refillDate.toISOString().split('T')[0] ?? '';
	const hydroDate = new Date(now);
	hydroDate.setFullYear(hydroDate.getFullYear() + 4);
	const formattedHydroDate = hydroDate.toISOString().split('T')[0] ?? '';

	return {
		id: context.product.id,
		current_status: 'active',
		...(payload.fill.filling
			? {
					refill_date: fillDate,
					next_refill_date: formattedRefillDate,
				}
			: {}),
		...(payload.fill.hydrostatic_pressure_test
			? {
					hydrostatic_test_date: fillDate,
					next_hydrostatic_test_date: formattedHydroDate,
				}
			: {}),
	};
}

async function executeInspectionAction(action: Extract<OfflineQueuedAction, { kind: 'inspection-submit' }>) {
	const context = await fetchAndCacheMobileTransactionContext(
		action.tenantSlug,
		action.payload.locationId,
	);
	const productId = context.product.id;

	if (!productId) {
		throw new Error('Missing product for inspection sync');
	}

	let photoPath: string | null = null;
	if (action.payload.photoId) {
		const photoRecord = await getOfflinePhotoRecord(action.payload.photoId);
		if (!photoRecord) {
			throw new Error('Offline photo record not found');
		}

		photoPath = await uploadInspectionPhoto(action.tenantSlug, photoRecord);
	}

	const inspectionPayload: MobileInspectionPayload = {
		...action.payload.inspection,
		fire_extinguisher_id: productId,
		user_id: action.payload.userId,
		photo_url: photoPath,
	};
	await requestJson('/api/inspections', {
		method: 'POST',
		body: JSON.stringify(inspectionPayload),
	}, action.tenantSlug);

	const transactionPayload: MobileTransactionPayload = {
		type: 'inspection',
		user: action.payload.userId,
		product_id: productId,
		details: `YSC no: ${action.payload.locationId}`,
	};
	await requestJson('/api/transactions', {
		method: 'POST',
		body: JSON.stringify(transactionPayload),
	}, action.tenantSlug);

	if (action.payload.photoId) {
		await deleteOfflinePhotoRecord(action.payload.photoId);
	}

	await putCachedMobileTransactionContext(
		toCachedContext(action.tenantSlug, action.payload.locationId, context, 'queue-sync'),
	);
}

async function executeFillAction(action: Extract<OfflineQueuedAction, { kind: 'fill-submit' }>) {
	const context = await fetchAndCacheMobileTransactionContext(
		action.tenantSlug,
		action.payload.locationId,
	);
	const productId = context.product.id;

	if (!productId) {
		throw new Error('Missing product for fill sync');
	}

	const fillPayload: MobileFillPayload = {
		...action.payload.fill,
		product_id: productId,
		user_id: action.payload.userId,
	};
	await requestJson('/api/fill', {
		method: 'POST',
		body: JSON.stringify(fillPayload),
	}, action.tenantSlug);

	const productPatchPayload = buildFillProductPatch(context, action.payload);
	await requestJson('/api/products', {
		method: 'PUT',
		body: JSON.stringify(productPatchPayload),
	}, action.tenantSlug);

	const transactionPayload: MobileTransactionPayload = {
		type: 'fill',
		user: action.payload.userId,
		product_id: productId,
		details: `YSC no: ${action.payload.locationId}`,
	};
	await requestJson('/api/transactions', {
		method: 'POST',
		body: JSON.stringify(transactionPayload),
	}, action.tenantSlug);

	await fetchAndCacheMobileTransactionContext(action.tenantSlug, action.payload.locationId);
}

async function executeProductSwitchAction(action: Extract<OfflineQueuedAction, { kind: 'product-switch' }>) {
	const currentContext = await fetchAndCacheMobileTransactionContext(
		action.tenantSlug,
		action.payload.currentLocationId,
	);
	const newContext = await fetchAndCacheMobileTransactionContext(
		action.tenantSlug,
		action.payload.newLocationId,
	);

	await requestJson('/api/products/switch', {
		method: 'POST',
		body: JSON.stringify({
			currentProduct: currentContext.product,
			newProduct: newContext.product,
			details: action.payload.details,
		}),
	}, action.tenantSlug);

	await Promise.all([
		fetchAndCacheMobileTransactionContext(action.tenantSlug, action.payload.currentLocationId),
		fetchAndCacheMobileTransactionContext(action.tenantSlug, action.payload.newLocationId),
	]);
}

async function executeProductUpdateAction(action: Extract<OfflineQueuedAction, { kind: 'product-update' }>) {
	let payload = action.payload.patch;

	if (!payload.id && action.payload.locationId) {
		const context = await fetchAndCacheMobileTransactionContext(
			action.tenantSlug,
			action.payload.locationId,
		);
		payload = {
			...payload,
			id: context.product.id,
		};
	}

	if (!payload.id) {
		throw new Error('Product update sync requires a product id');
	}

	await requestJson('/api/products', {
		method: 'PUT',
		body: JSON.stringify(payload),
	}, action.tenantSlug);

	if (action.payload.locationId) {
		await fetchAndCacheMobileTransactionContext(action.tenantSlug, action.payload.locationId);
	}
}

async function executeOfflineAction(action: OfflineQueuedAction) {
	if (action.kind === 'inspection-submit') {
		return await executeInspectionAction(action);
	}

	if (action.kind === 'fill-submit') {
		return await executeFillAction(action);
	}

	if (action.kind === 'product-switch') {
		return await executeProductSwitchAction(action);
	}

	return await executeProductUpdateAction(action);
}

function isPermanentQueueError(error: unknown) {
	if (!(error instanceof Error)) {
		return false;
	}

	return /400|401|403|404/i.test(error.message);
}

let syncInFlight: Promise<void> | null = null;

export async function replayOfflineQueue() {
	if (syncInFlight) {
		return syncInFlight;
	}

	syncInFlight = (async () => {
		const actions = await listOfflineQueueActions();

		for (const action of actions) {
			if (action.status === 'failed') {
				continue;
			}

			await updateOfflineQueueAction(action.id, current => ({
				...current,
				status: 'processing',
				attemptCount: current.attemptCount + 1,
				lastError: null,
			}));

			try {
				await executeOfflineAction(action);
				await deleteOfflineQueueAction(action.id);
				await setMobileOfflineMeta(LAST_SYNC_META_KEY, getNowIso());
			}
			catch (error) {
				const nextStatus = isPermanentQueueError(error) ? 'failed' : 'pending';
				await updateOfflineQueueAction(action.id, current => ({
					...current,
					status: nextStatus,
					lastError: error instanceof Error ? error.message : 'Unknown sync error',
				}));

				if (!isPermanentQueueError(error)) {
					break;
				}
			}
		}
	})().finally(() => {
		syncInFlight = null;
	});

	return syncInFlight;
}

export async function getMobileOfflineSnapshot() {
	const [pendingCount, lastSyncAt] = await Promise.all([
		countPendingOfflineActions(),
		getMobileOfflineMeta(LAST_SYNC_META_KEY),
	]);

	return {
		pendingCount,
		lastSyncAt: typeof lastSyncAt === 'string' ? lastSyncAt : null,
	};
}
