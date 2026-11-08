<script setup lang="ts">
definePageMeta({ layout: 'mobile' });

type InspectionOverviewItem = {
	id: number;
	assetCode: string;
	assetUid: string;
	modelType: string | null;
	unit: string | null;
	currentStatus: string | null;
	location: {
		locationId: string;
		room: string;
		buildingId: number;
		buildingName: string;
	};
	inspection: null | {
		id: number;
		result: boolean | null;
		createdAt: string;
	};
};

type InspectionFilter = 'all' | 'pending' | 'completed';

const identifier = ref('');
const showScanner = ref(false);
const selectedBuildingId = ref<number | null>(null);
const inspectionFilter = ref<InspectionFilter>('all');
const refreshLocked = ref(false);
const { toTenantPath } = useTenant();
const today = formatDateOnlyForApi(new Date());
const currentMonth = today?.slice(0, 7);
let refreshLockTimer: ReturnType<typeof setTimeout> | null = null;

const { data: overviewData, status, error: overviewError, refresh } = await useAsyncData(
	'mobile-inspection-overview',
	() => $fetch<InspectionOverviewItem[]>('/api/mobile/inspection-overview', {
		query: { month: currentMonth },
	}),
	{ default: () => [] },
);

const buildingOptions = computed(() => {
	const buildings = new Map<number, string>();
	for (const item of overviewData.value) {
		buildings.set(item.location.buildingId, item.location.buildingName);
	}
	return [...buildings.entries()]
		.map(([value, label]) => ({ value, label }))
		.sort((left, right) => left.label.localeCompare(right.label, 'tr'));
});

const scopedItems = computed(() => overviewData.value.filter((item) => {
	return !selectedBuildingId.value
		|| item.location.buildingId === selectedBuildingId.value;
}));

const completedCount = computed(() => scopedItems.value.filter(item => item.inspection).length);
const pendingCount = computed(() => scopedItems.value.length - completedCount.value);

const filteredItems = computed(() => {
	if (inspectionFilter.value === 'completed') {
		return scopedItems.value.filter(item => item.inspection);
	}
	if (inspectionFilter.value === 'pending') {
		return scopedItems.value.filter(item => !item.inspection);
	}
	return scopedItems.value;
});

const groupedItems = computed(() => {
	const groups = new Map<string, InspectionOverviewItem[]>();
	for (const item of filteredItems.value) {
		const items = groups.get(item.location.buildingName) ?? [];
		items.push(item);
		groups.set(item.location.buildingName, items);
	}
	return [...groups.entries()].map(([buildingName, items]) => ({ buildingName, items }));
});

const filterOptions: Array<{ value: InspectionFilter; label: string }> = [
	{ value: 'all', label: 'Tümü' },
	{ value: 'pending', label: 'Bekleyen' },
	{ value: 'completed', label: 'Tamamlanan' },
];

const filterCount = (filter: InspectionFilter) => {
	if (filter === 'pending') return pendingCount.value;
	if (filter === 'completed') return completedCount.value;
	return scopedItems.value.length;
};

const formatInspectionTime = (date: string) => new Intl.DateTimeFormat('tr-TR', {
	hour: '2-digit',
	minute: '2-digit',
}).format(new Date(date));

const openProduct = async (value: string) => {
	const normalized = value.trim();
	if (!normalized) return;
	await navigateTo(toTenantPath(`/mobile/transactions/${encodeURIComponent(normalized)}`));
};

const manualRefresh = async () => {
	if (refreshLocked.value || status.value === 'pending') return;
	refreshLocked.value = true;
	await refresh();
	refreshLockTimer = setTimeout(() => {
		refreshLocked.value = false;
	}, 10_000);
};

onUnmounted(() => {
	if (refreshLockTimer) clearTimeout(refreshLockTimer);
});
</script>

<template>
	<main class="pb-4">
		<section class="mb-6">
			<p class="app-kicker">
				Saha işlemleri
			</p>
			<h1 class="mt-1 text-2xl font-bold tracking-[-0.025em] text-slate-950">
				YSC bul ve kontrol et
			</h1>
			<p class="mt-2 text-sm leading-6 text-slate-500">
				QR kodu tarayın; tüp kodu veya YSC No ile arayın.
			</p>
		</section>

		<section class="mb-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
			<button
				type="button"
				class="flex min-h-14 w-full items-center gap-3 rounded-lg bg-blue-600 px-4 text-left text-white transition active:scale-[0.99]"
				@click="showScanner = true"
			>
				<span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-2xl"><i class="ri-qr-scan-2-line" /></span>
				<span class="min-w-0 flex-1">
					<span class="block text-sm font-bold">QR kodu tara</span>
					<span class="block text-xs text-blue-100">Kamerayla hızlıca YSC'yi açın</span>
				</span>
				<i class="ri-arrow-right-s-line text-xl" />
			</button>

			<div class="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
				<span class="h-px flex-1 bg-slate-200" /><span>veya arayın</span><span class="h-px flex-1 bg-slate-200" />
			</div>

			<form
				class="relative"
				@submit.prevent="openProduct(identifier)"
			>
				<i class="ri-search-line pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" />
				<InputText
					v-model="identifier"
					placeholder="Tüp kodu veya YSC No"
					class="w-full !pl-9 !pr-16"
					autocomplete="off"
				/>
				<button
					type="submit"
					class="absolute right-1.5 top-1/2 z-10 flex h-8 -translate-y-1/2 items-center justify-center rounded-md bg-slate-800 px-3 text-xs font-bold text-white transition active:bg-slate-950 disabled:opacity-40"
					:disabled="!identifier.trim()"
				>
					Bul
				</button>
			</form>
		</section>

		<section>
			<div class="mb-4 flex items-end justify-between gap-3">
				<div>
					<p class="text-[11px] font-bold uppercase tracking-[0.1em] text-blue-600">
						Bu ay
					</p>
					<h2 class="mt-0.5 text-lg font-bold text-slate-950">
						Bakım kontrol listesi
					</h2>
				</div>
				<button
					type="button"
					class="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg text-slate-500 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
					aria-label="Listeyi yenile"
					title="Liste 10 saniyede bir yenilenebilir"
					:disabled="refreshLocked || status === 'pending'"
					@click="manualRefresh"
				>
					<i
						class="ri-refresh-line"
						:class="status === 'pending' ? 'animate-spin' : ''"
					/>
				</button>
			</div>

			<div class="mb-3 rounded-xl border border-slate-200 bg-white p-3">
				<Select
					v-model="selectedBuildingId"
					:options="buildingOptions"
					option-label="label"
					option-value="value"
					placeholder="Tüm binalar"
					show-clear
					class="w-full"
				/>
				<div class="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
					<button
						v-for="option in filterOptions"
						:key="option.value"
						type="button"
						class="rounded-md px-1 py-2 text-[11px] font-semibold transition"
						:class="inspectionFilter === option.value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'"
						@click="inspectionFilter = option.value"
					>
						<span class="block">{{ option.label }}</span>
						<span class="mt-0.5 block text-[10px] tabular-nums opacity-70">{{ filterCount(option.value) }}</span>
					</button>
				</div>
			</div>

			<div
				v-if="overviewError"
				class="rounded-xl border border-red-200 bg-white px-5 py-8 text-center"
			>
				<span class="mx-auto flex size-11 items-center justify-center rounded-full bg-red-50 text-xl text-red-600"><i class="ri-error-warning-line" /></span>
				<p class="mt-3 text-sm font-semibold text-slate-800">
					Kontrol listesi yüklenemedi
				</p>
				<Button
					label="Tekrar dene"
					severity="secondary"
					outlined
					size="small"
					class="mt-4"
					@click="refresh()"
				/>
			</div>
			<p
				v-else-if="status === 'pending' && overviewData.length"
				class="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500"
			>
				<i class="ri-loader-4-line animate-spin text-blue-600" /> Liste güncelleniyor
			</p>
			<div
				v-if="!overviewError && status !== 'pending' && !groupedItems.length"
				class="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center"
			>
				<span class="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500"><i class="ri-checkbox-circle-line" /></span>
				<p class="mt-3 text-sm font-semibold text-slate-700">
					Bu filtrede YSC bulunamadı
				</p>
				<p class="mt-1 text-xs leading-5 text-slate-500">
					Bina veya bakım durumu filtresini değiştirebilirsiniz.
				</p>
			</div>
			<div
				v-else-if="!overviewError"
				class="space-y-5"
			>
				<section
					v-for="group in groupedItems"
					:key="group.buildingName"
				>
					<div class="mb-2 flex items-center justify-between px-1">
						<h3 class="text-sm font-bold text-slate-800">
							{{ group.buildingName }}
						</h3>
						<span class="text-[11px] text-slate-400">{{ group.items.length }} YSC</span>
					</div>
					<div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
						<button
							v-for="item in group.items"
							:key="item.id"
							type="button"
							class="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left last:border-b-0 active:bg-slate-50"
							@click="openProduct(item.assetUid || item.assetCode)"
						>
							<span
								class="flex size-9 shrink-0 items-center justify-center rounded-full text-lg"
								:class="item.inspection ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'"
							>
								<i :class="item.inspection ? 'ri-check-line' : 'ri-time-line'" />
							</span>
							<span class="min-w-0 flex-1">
								<span class="flex items-center gap-2">
									<strong class="truncate text-sm text-slate-900">YSC {{ item.location.locationId }}</strong>
									<span
										v-if="item.inspection && item.inspection.result === false"
										class="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase text-red-600"
									>Değişim gerekli</span>
								</span>
								<span class="mt-0.5 block truncate text-xs text-slate-500">{{ item.location.room }} · {{ item.modelType || 'Model belirtilmemiş' }}</span>
							</span>
							<span class="shrink-0 text-right">
								<span
									class="block text-[10px] font-semibold"
									:class="item.inspection ? 'text-emerald-600' : 'text-amber-600'"
								>{{ item.inspection ? `Tamamlandı · ${formatInspectionTime(item.inspection.createdAt)}` : 'Bekliyor' }}</span>
								<i class="ri-arrow-right-s-line text-lg text-slate-300" />
							</span>
						</button>
					</div>
				</section>
			</div>
		</section>

		<QRScanner
			v-if="showScanner"
			@close="showScanner = false"
			@scan-complete="(scannedIdentifier: string) => openProduct(scannedIdentifier)"
		/>
		<MobileLoading
			v-if="status === 'pending' && !overviewData.length"
			label="Aylık kontrol listesi hazırlanıyor"
		/>
	</main>
</template>
