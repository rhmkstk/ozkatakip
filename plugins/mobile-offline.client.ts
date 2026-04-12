import { useMobileOfflineState } from '~/composables/use-mobile-offline-state';

const SYNC_TAG = 'mobile-offline-sync';

async function requestBackgroundSync() {
	if (!('serviceWorker' in navigator)) {
		return;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		if ('sync' in registration) {
			await registration.sync.register(SYNC_TAG);
		}

		registration.active?.postMessage({ type: SYNC_TAG });
	}
	catch (error) {
		console.warn('Background sync registration failed:', error);
	}
}

export default defineNuxtPlugin(() => {
	const offlineState = useMobileOfflineState();

	if (import.meta.server) {
		return;
	}

	const stop = offlineState.registerListeners();

	void offlineState.refreshSnapshot().then(async () => {
		if (navigator.onLine) {
			await offlineState.syncNow();
			await requestBackgroundSync();
		}
	});

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.addEventListener('message', event => {
			if (event.data?.type === 'mobile-offline-sync-complete') {
				void offlineState.refreshSnapshot();
			}
		});
	}

	window.addEventListener('beforeunload', stop);
});
