import type {
	MobileFillPayload,
	MobileInspectionPayload,
	MobileProductPatchPayload,
	MobileTransactionContext,
} from '~/types/mobile-transaction';

export type CachedMobileTransactionContext = {
	key: string;
	tenantSlug: string;
	locationId: string;
	context: MobileTransactionContext;
	cachedAt: string;
	source: 'network' | 'queue-sync';
};

export type OfflineActionStatus = 'pending' | 'processing' | 'failed';

export type OfflineInspectionQueuePayload = {
	locationId: string;
	userId: string;
	inspection: Omit<MobileInspectionPayload, 'fire_extinguisher_id' | 'photo_url' | 'user_id'>;
	photoId: string | null;
};

export type OfflineFillQueuePayload = {
	locationId: string;
	userId: string;
	fill: Omit<MobileFillPayload, 'product_id' | 'user_id'>;
};

export type OfflineProductSwitchQueuePayload = {
	currentLocationId: string;
	newLocationId: string;
	details: string;
};

export type OfflineProductUpdateQueuePayload = {
	locationId?: string;
	productId?: number;
	patch: MobileProductPatchPayload;
};

export type OfflineQueuedAction =
	| {
			id: string;
			tenantSlug: string;
			kind: 'inspection-submit';
			status: OfflineActionStatus;
			attemptCount: number;
			createdAt: string;
			lastError: string | null;
			payload: OfflineInspectionQueuePayload;
	  }
	| {
			id: string;
			tenantSlug: string;
			kind: 'fill-submit';
			status: OfflineActionStatus;
			attemptCount: number;
			createdAt: string;
			lastError: string | null;
			payload: OfflineFillQueuePayload;
	  }
	| {
			id: string;
			tenantSlug: string;
			kind: 'product-switch';
			status: OfflineActionStatus;
			attemptCount: number;
			createdAt: string;
			lastError: string | null;
			payload: OfflineProductSwitchQueuePayload;
	  }
	| {
			id: string;
			tenantSlug: string;
			kind: 'product-update';
			status: OfflineActionStatus;
			attemptCount: number;
			createdAt: string;
			lastError: string | null;
			payload: OfflineProductUpdateQueuePayload;
	  };

export type OfflinePhotoRecord = {
	id: string;
	tenantSlug: string;
	file: Blob;
	fileName: string;
	fileType: string;
	createdAt: string;
};

export type MobileOfflineMeta = {
	key: string;
	value: string | number | null;
};

