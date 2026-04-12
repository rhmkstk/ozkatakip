/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

const DB_NAME = 'ozkatakip-mobile-offline';
const DB_VERSION = 1;
const CONTEXT_STORE = 'mobile-transaction-contexts';
const QUEUE_STORE = 'mobile-offline-queue';
const PHOTO_STORE = 'mobile-offline-photos';
const META_STORE = 'mobile-offline-meta';
const LAST_SYNC_META_KEY = 'last-sync-at';
const SYNC_TAG = 'mobile-offline-sync';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const navigationHandler = createHandlerBoundToURL('/index.html');
registerRoute(new NavigationRoute(navigationHandler, {
	denylist: [/^\/api\//],
}));

registerRoute(
	({ request, url }) => request.mode === 'navigate' || url.pathname.startsWith('/_nuxt/'),
	new NetworkFirst({
		cacheName: 'app-shell',
	}),
);

registerRoute(
	({ url }) => url.pathname.startsWith('/api/mobile/transactions/getByLocationId'),
	new NetworkFirst({
		cacheName: 'mobile-transaction-context',
	}),
);

registerRoute(
	({ url }) => ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'].includes(url.hostname),
	new StaleWhileRevalidate({
		cacheName: 'mobile-external-assets',
	}),
);

registerRoute(
	({ request }) => request.destination === 'image',
	new CacheFirst({
		cacheName: 'mobile-images',
	}),
);

function openDb() {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains(CONTEXT_STORE)) {
				db.createObjectStore(CONTEXT_STORE, { keyPath: 'key' });
			}

			if (!db.objectStoreNames.contains(QUEUE_STORE)) {
				db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
			}

			if (!db.objectStoreNames.contains(PHOTO_STORE)) {
				db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
			}

			if (!db.objectStoreNames.contains(META_STORE)) {
				db.createObjectStore(META_STORE, { keyPath: 'key' });
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
	});
}

function waitForTransaction(transaction: IDBTransaction) {
	return new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
		transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'));
	});
}

async function getRecord<T>(storeName: string, key: IDBValidKey) {
	const db = await openDb();
	const transaction = db.transaction(storeName, 'readonly');
	const store = transaction.objectStore(storeName);
	const value = await new Promise<T | undefined>((resolve, reject) => {
		const request = store.get(key);
		request.onsuccess = () => resolve(request.result as T | undefined);
		request.onerror = () => reject(request.error || new Error('IndexedDB get failed'));
	});
	await waitForTransaction(transaction);
	return value;
}

async function putRecord(storeName: string, value: unknown) {
	const db = await openDb();
	const transaction = db.transaction(storeName, 'readwrite');
	transaction.objectStore(storeName).put(value);
	await waitForTransaction(transaction);
}

async function deleteRecord(storeName: string, key: IDBValidKey) {
	const db = await openDb();
	const transaction = db.transaction(storeName, 'readwrite');
	transaction.objectStore(storeName).delete(key);
	await waitForTransaction(transaction);
}

async function getAllRecords<T>(storeName: string) {
	const db = await openDb();
	const transaction = db.transaction(storeName, 'readonly');
	const store = transaction.objectStore(storeName);
	const values = await new Promise<T[]>((resolve, reject) => {
		const request = store.getAll();
		request.onsuccess = () => resolve((request.result || []) as T[]);
		request.onerror = () => reject(request.error || new Error('IndexedDB getAll failed'));
	});
	await waitForTransaction(transaction);
	return values;
}

async function setMetaValue(key: string, value: string) {
	await putRecord(META_STORE, { key, value });
}

async function requestJson<T>(url: string, init: RequestInit = {}, tenantSlug?: string) {
	const response = await fetch(url, {
		credentials: 'include',
		...init,
		headers: {
			'Content-Type': 'application/json',
			...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
			...(init.headers || {}),
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

async function fetchContext(tenantSlug: string, locationId: string) {
	const params = new URLSearchParams({
		location_id: locationId,
		tenant_slug: tenantSlug,
	});
	const context = await requestJson(
		`/api/mobile/transactions/getByLocationId?${params.toString()}`,
		{ method: 'GET', headers: { Accept: 'application/json' } },
		tenantSlug,
	);
	await putRecord(CONTEXT_STORE, {
		key: `${tenantSlug}:${locationId}`,
		tenantSlug,
		locationId,
		context,
		cachedAt: new Date().toISOString(),
		source: 'queue-sync',
	});
	return context as {
		product: { id: number; refill_period: number | null };
	};
}

function buildFillPatch(context: { product: { id: number; refill_period: number | null } }, action: any) {
	const refillPeriod = context.product.refill_period || 2;
	const now = new Date();
	const fillDate = now.toISOString().split('T')[0] || '';
	const nextRefillDate = new Date(now);
	nextRefillDate.setFullYear(nextRefillDate.getFullYear() + Number(refillPeriod));
	const nextHydroDate = new Date(now);
	nextHydroDate.setFullYear(nextHydroDate.getFullYear() + 4);

	return {
		id: context.product.id,
		current_status: 'active',
		...(action.payload.fill.filling
			? {
					refill_date: fillDate,
					next_refill_date: nextRefillDate.toISOString().split('T')[0] || '',
				}
			: {}),
		...(action.payload.fill.hydrostatic_pressure_test
			? {
					hydrostatic_test_date: fillDate,
					next_hydrostatic_test_date: nextHydroDate.toISOString().split('T')[0] || '',
				}
			: {}),
	};
}

async function uploadPhoto(tenantSlug: string, photoId?: string | null) {
	if (!photoId) {
		return null;
	}

	const photo = await getRecord<{
		file: Blob;
		fileName: string;
	}>(PHOTO_STORE, photoId);
	if (!photo) {
		throw new Error('Offline photo record missing');
	}

	const formData = new FormData();
	formData.append('file', photo.file, photo.fileName || 'inspection-photo.jpg');
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
	await deleteRecord(PHOTO_STORE, photoId);
	return result.filePath || null;
}

function isPermanentError(error: unknown) {
	return error instanceof Error && /400|401|403|404/i.test(error.message);
}

async function executeAction(action: any) {
	if (action.kind === 'inspection-submit') {
		const context = await fetchContext(action.tenantSlug, action.payload.locationId);
		const photoPath = await uploadPhoto(action.tenantSlug, action.payload.photoId);
		await requestJson('/api/inspections', {
			method: 'POST',
			body: JSON.stringify({
				...action.payload.inspection,
				fire_extinguisher_id: context.product.id,
				user_id: action.payload.userId,
				photo_url: photoPath,
			}),
		}, action.tenantSlug);
		await requestJson('/api/transactions', {
			method: 'POST',
			body: JSON.stringify({
				type: 'inspection',
				user: action.payload.userId,
				product_id: context.product.id,
				details: `YSC no: ${action.payload.locationId}`,
			}),
		}, action.tenantSlug);
		return;
	}

	if (action.kind === 'fill-submit') {
		const context = await fetchContext(action.tenantSlug, action.payload.locationId);
		await requestJson('/api/fill', {
			method: 'POST',
			body: JSON.stringify({
				...action.payload.fill,
				product_id: context.product.id,
				user_id: action.payload.userId,
			}),
		}, action.tenantSlug);
		await requestJson('/api/products', {
			method: 'PUT',
			body: JSON.stringify(buildFillPatch(context, action)),
		}, action.tenantSlug);
		await requestJson('/api/transactions', {
			method: 'POST',
			body: JSON.stringify({
				type: 'fill',
				user: action.payload.userId,
				product_id: context.product.id,
				details: `YSC no: ${action.payload.locationId}`,
			}),
		}, action.tenantSlug);
		await fetchContext(action.tenantSlug, action.payload.locationId);
		return;
	}

	if (action.kind === 'product-switch') {
		const [currentContext, newContext] = await Promise.all([
			fetchContext(action.tenantSlug, action.payload.currentLocationId),
			fetchContext(action.tenantSlug, action.payload.newLocationId),
		]);
		await requestJson('/api/products/switch', {
			method: 'POST',
			body: JSON.stringify({
				currentProduct: currentContext.product,
				newProduct: newContext.product,
				details: action.payload.details,
			}),
		}, action.tenantSlug);
		await Promise.all([
			fetchContext(action.tenantSlug, action.payload.currentLocationId),
			fetchContext(action.tenantSlug, action.payload.newLocationId),
		]);
		return;
	}

	let patch = action.payload.patch;
	if (!patch.id && action.payload.locationId) {
		const context = await fetchContext(action.tenantSlug, action.payload.locationId);
		patch = {
			...patch,
			id: context.product.id,
		};
	}

	if (!patch.id) {
		throw new Error('Product update requires product id');
	}

	await requestJson('/api/products', {
		method: 'PUT',
		body: JSON.stringify(patch),
	}, action.tenantSlug);

	if (action.payload.locationId) {
		await fetchContext(action.tenantSlug, action.payload.locationId);
	}
}

let syncPromise: Promise<void> | null = null;

async function flushQueue() {
	if (syncPromise) {
		return syncPromise;
	}

	syncPromise = (async () => {
		const actions = await getAllRecords<any>(QUEUE_STORE);
		actions.sort((left, right) => left.createdAt.localeCompare(right.createdAt));

		for (const action of actions) {
			if (action.status === 'failed') {
				continue;
			}

			await putRecord(QUEUE_STORE, {
				...action,
				status: 'processing',
				attemptCount: (action.attemptCount || 0) + 1,
				lastError: null,
			});

			try {
				await executeAction(action);
				await deleteRecord(QUEUE_STORE, action.id);
				await setMetaValue(LAST_SYNC_META_KEY, new Date().toISOString());
			}
			catch (error) {
				await putRecord(QUEUE_STORE, {
					...action,
					status: isPermanentError(error) ? 'failed' : 'pending',
					attemptCount: (action.attemptCount || 0) + 1,
					lastError: error instanceof Error ? error.message : 'Unknown sync error',
				});
				if (!isPermanentError(error)) {
					break;
				}
			}
		}

		const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
		for (const client of allClients) {
			client.postMessage({ type: 'mobile-offline-sync-complete' });
		}
	})().finally(() => {
		syncPromise = null;
	});

	return syncPromise;
}

self.addEventListener('message', (event) => {
	if (event.data?.type === SYNC_TAG) {
		event.waitUntil(flushQueue());
	}
});

self.addEventListener('sync', (event) => {
	if (event.tag === SYNC_TAG) {
		event.waitUntil(flushQueue());
	}
});
