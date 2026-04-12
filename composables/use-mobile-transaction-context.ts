import type { MobileTransactionContext } from '~/types/mobile-transaction';
import { getOfflineAwareMobileTransactionContext } from '~/utils/mobile-offline-sync';

export async function fetchMobileTransactionContext(locationId: string) {
	return await $fetch<MobileTransactionContext>(
		'/api/mobile/transactions/getByLocationId',
		{
			params: { location_id: locationId },
		},
	);
}

export async function useMobileTransactionContext(locationId: string) {
	const { activeTenantSlug } = useTenant();
	const contextSource = useState<'network' | 'cache' | 'empty'>(
		`mobile-transaction-source-${locationId}`,
		() => 'network',
	);
	const hasCachedFallback = useState(
		`mobile-transaction-has-cache-${locationId}`,
		() => false,
	);
	const { data, status } = await useAsyncData<MobileTransactionContext>(
		`mobile-transaction-${locationId}`,
		async () => {
			if (!activeTenantSlug.value) {
				return await fetchMobileTransactionContext(locationId);
			}

			const result = await getOfflineAwareMobileTransactionContext(
				activeTenantSlug.value,
				locationId,
			);
			contextSource.value = result.source;
			hasCachedFallback.value = result.hasCachedFallback;
			return result.context;
		},
	);

	const lastInspectionDate = computed(() => {
		const createdAt = data.value?.latestInspection.created_at;

		return createdAt ? new Date(createdAt) : null;
	});

	const showInspectionAlert = computed(() => {
		return Boolean(
			data.value?.latestInspection.created_at
			&& data.value.latestInspection.is_same_month,
		);
	});

	const inspectionAlert = computed(() => {
		const formattedDate = lastInspectionDate.value
			? new Date(lastInspectionDate.value).toLocaleDateString('tr-TR', {
					day: 'numeric',
					month: 'long',
					year: 'numeric',
				})
			: '';

		return `  Bu YSC numarasina ${formattedDate} tarihinde bir bakım kaydı girilmiş. Yine de bakım kaydı oluşturmak istiyor musunuz?`;
	});

	const isRefillDateExpired = computed(() => {
		const nextRefillDate = data.value?.product.next_refill_date;

		if (!nextRefillDate) {
			return false;
		}

		const refillDate = new Date(nextRefillDate);
		const today = new Date();

		refillDate.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);

		return refillDate < today;
	});

	const refillDateAlert = computed(() => {
		const nextRefillDate = data.value?.product.next_refill_date;

		if (!nextRefillDate) {
			return '';
		}

		return `Bu ürünün dolum süresi ${formatTurkishDate(nextRefillDate)} tarihinde dolmuş. Lütfen dolum işlemini planlayın.`;
	});

	return {
		data,
		status,
		lastInspectionDate,
		showInspectionAlert,
		inspectionAlert,
		isRefillDateExpired,
		refillDateAlert,
		contextSource,
		hasCachedFallback,
	};
}
