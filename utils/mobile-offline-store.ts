import type {
	CachedMobileTransactionContext,
	MobileOfflineMeta,
	OfflinePhotoRecord,
	OfflineQueuedAction,
} from '~/types/mobile-offline';

const DB_NAME = 'ozkatakip-mobile-offline';
const DB_VERSION = 1;
const CONTEXT_STORE = 'mobile-transaction-contexts';
const QUEUE_STORE = 'mobile-offline-queue';
const PHOTO_STORE = 'mobile-offline-photos';
const META_STORE = 'mobile-offline-meta';
const UPDATE_EVENT_NAME = 'mobile-offline-store-updated';

let dbPromise: Promise<IDBDatabase> | null = null;

function ensureIndexedDb() {
	if (typeof indexedDB === 'undefined') {
		throw new Error('IndexedDB is not available in this environment.');
	}
}

function dispatchOfflineStoreUpdate() {
	if (typeof window === 'undefined') {
		return;
	}

	window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME));
}

function promisifyRequest<T>(request: IDBRequest<T>) {
	return new Promise<T>((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
	});
}

function waitForTransaction(transaction: IDBTransaction) {
	return new Promise<void>((resolve, reject) => {
		transaction.oncomplete = () => resolve();
		transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
		transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
	});
}

async function getDb() {
	ensureIndexedDb();

	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onupgradeneeded = () => {
				const db = request.result;

				if (!db.objectStoreNames.contains(CONTEXT_STORE)) {
					const store = db.createObjectStore(CONTEXT_STORE, { keyPath: 'key' });
					store.createIndex('tenantSlug', 'tenantSlug', { unique: false });
				}

				if (!db.objectStoreNames.contains(QUEUE_STORE)) {
					const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
					store.createIndex('status', 'status', { unique: false });
					store.createIndex('createdAt', 'createdAt', { unique: false });
				}

				if (!db.objectStoreNames.contains(PHOTO_STORE)) {
					db.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
				}

				if (!db.objectStoreNames.contains(META_STORE)) {
					db.createObjectStore(META_STORE, { keyPath: 'key' });
				}
			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
		});
	}

	return dbPromise;
}

async function readRecord<T>(storeName: string, key: IDBValidKey) {
	const db = await getDb();
	const transaction = db.transaction(storeName, 'readonly');
	const store = transaction.objectStore(storeName);
	const record = await promisifyRequest(store.get(key) as IDBRequest<T | undefined>);
	await waitForTransaction(transaction);
	return record;
}

async function writeRecord<T>(storeName: string, value: T) {
	const db = await getDb();
	const transaction = db.transaction(storeName, 'readwrite');
	transaction.objectStore(storeName).put(value);
	await waitForTransaction(transaction);
	dispatchOfflineStoreUpdate();
}

async function deleteRecord(storeName: string, key: IDBValidKey) {
	const db = await getDb();
	const transaction = db.transaction(storeName, 'readwrite');
	transaction.objectStore(storeName).delete(key);
	await waitForTransaction(transaction);
	dispatchOfflineStoreUpdate();
}

async function readAllRecords<T>(storeName: string) {
	const db = await getDb();
	const transaction = db.transaction(storeName, 'readonly');
	const records = await promisifyRequest(
		transaction.objectStore(storeName).getAll() as IDBRequest<T[]>,
	);
	await waitForTransaction(transaction);
	return records;
}

export function buildOfflineContextKey(tenantSlug: string, locationId: string) {
	return `${tenantSlug}:${locationId}`;
}

export function subscribeToOfflineStoreUpdates(callback: () => void) {
	if (typeof window === 'undefined') {
		return () => {};
	}

	window.addEventListener(UPDATE_EVENT_NAME, callback);
	return () => window.removeEventListener(UPDATE_EVENT_NAME, callback);
}

export async function getCachedMobileTransactionContext(
	tenantSlug: string,
	locationId: string,
) {
	return await readRecord<CachedMobileTransactionContext>(
		CONTEXT_STORE,
		buildOfflineContextKey(tenantSlug, locationId),
	);
}

export async function putCachedMobileTransactionContext(
	entry: CachedMobileTransactionContext,
) {
	await writeRecord(CONTEXT_STORE, entry);
}

export async function putOfflineQueueAction(action: OfflineQueuedAction) {
	await writeRecord(QUEUE_STORE, action);
}

export async function getOfflineQueueAction(actionId: string) {
	return await readRecord<OfflineQueuedAction>(QUEUE_STORE, actionId);
}

export async function listOfflineQueueActions() {
	const actions = await readAllRecords<OfflineQueuedAction>(QUEUE_STORE);
	return actions.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function updateOfflineQueueAction(
	actionId: string,
	updater: (action: OfflineQueuedAction) => OfflineQueuedAction,
) {
	const current = await getOfflineQueueAction(actionId);
	if (!current) {
		return null;
	}

	const next = updater(current);
	await writeRecord(QUEUE_STORE, next);
	return next;
}

export async function deleteOfflineQueueAction(actionId: string) {
	await deleteRecord(QUEUE_STORE, actionId);
}

export async function countPendingOfflineActions() {
	const actions = await listOfflineQueueActions();
	return actions.filter(action => action.status !== 'failed').length;
}

export async function putOfflinePhotoRecord(record: OfflinePhotoRecord) {
	await writeRecord(PHOTO_STORE, record);
}

export async function getOfflinePhotoRecord(photoId: string) {
	return await readRecord<OfflinePhotoRecord>(PHOTO_STORE, photoId);
}

export async function deleteOfflinePhotoRecord(photoId: string) {
	await deleteRecord(PHOTO_STORE, photoId);
}

export async function setMobileOfflineMeta(key: string, value: MobileOfflineMeta['value']) {
	await writeRecord<MobileOfflineMeta>(META_STORE, { key, value });
}

export async function getMobileOfflineMeta(key: string) {
	const entry = await readRecord<MobileOfflineMeta>(META_STORE, key);
	return entry?.value ?? null;
}
