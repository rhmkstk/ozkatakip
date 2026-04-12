import {
	getMobileOfflineSnapshot,
	replayOfflineQueue,
} from '~/utils/mobile-offline-sync';
import { subscribeToOfflineStoreUpdates } from '~/utils/mobile-offline-store';

export function useMobileOfflineState() {
	const isOnline = useState('mobile-offline-is-online', () => true);
	const pendingCount = useState('mobile-offline-pending-count', () => 0);
	const lastSyncAt = useState<string | null>('mobile-offline-last-sync-at', () => null);
	const syncInProgress = useState('mobile-offline-sync-in-progress', () => false);

	const refreshSnapshot = async () => {
		if (typeof window !== 'undefined') {
			isOnline.value = window.navigator.onLine;
		}

		const snapshot = await getMobileOfflineSnapshot();
		pendingCount.value = snapshot.pendingCount;
		lastSyncAt.value = snapshot.lastSyncAt;
	};

	const syncNow = async () => {
		if (syncInProgress.value) {
			return;
		}

		syncInProgress.value = true;
		try {
			await replayOfflineQueue();
		}
		finally {
			await refreshSnapshot();
			syncInProgress.value = false;
		}
	};

	const registerListeners = () => {
		if (typeof window === 'undefined') {
			return () => {};
		}

		const onOnline = async () => {
			isOnline.value = true;
			await syncNow();
		};
		const onOffline = () => {
			isOnline.value = false;
		};

		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		const unsubscribeStore = subscribeToOfflineStoreUpdates(() => {
			void refreshSnapshot();
		});

		return () => {
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
			unsubscribeStore();
		};
	};

	return {
		isOnline,
		pendingCount,
		lastSyncAt,
		syncInProgress,
		refreshSnapshot,
		syncNow,
		registerListeners,
	};
}
