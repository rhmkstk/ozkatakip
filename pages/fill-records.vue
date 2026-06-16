<script setup lang="ts">
import { headerLabels, fillLabels } from '~/constants';

const tabledata = ref([]);
const expandedRows = ref([]);
const isLoading = ref(false);
const showFilters = ref(false);
const filterOptions = ref({
	buildings: [] as string[],
	units: [] as string[],
	modelTypes: [] as string[],
});

const defaultDate = new Date();
const filters = reactive({
	building: '',
	weight: '',
	modelType: '',
	yscNo: '',
	fillDateMode: 'none',
	fillDate: new Date(defaultDate),
	hydroDateMode: 'none',
	hydroDate: new Date(defaultDate),
});
const yscNoSearch = ref('');
let yscSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const dateModeOptions = [
	{ label: 'Kapalı', value: 'none' },
	{ label: 'Günlük', value: 'daily' },
	{ label: 'Aylık', value: 'monthly' },
];

const hasActiveFilters = computed(() => {
	return (
		Boolean(filters.building)
		|| Boolean(filters.weight)
		|| Boolean(filters.modelType)
		|| Boolean(filters.yscNo)
		|| filters.fillDateMode !== 'none'
		|| filters.hydroDateMode !== 'none'
	);
});

const activeFilterCount = computed(() => {
	let count = 0;
	if (filters.building) count += 1;
	if (filters.weight) count += 1;
	if (filters.modelType) count += 1;
	if (filters.yscNo) count += 1;
	if (filters.fillDateMode !== 'none') count += 1;
	if (filters.hydroDateMode !== 'none') count += 1;
	return count;
});

const getDateRangeQuery = (mode: string, dateValue: Date | null, fromKey: string, toKey: string) => {
	if (mode === 'none' || !dateValue) {
		return {};
	}
	const toDateString = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};
	const selectedDate = new Date(dateValue);
	if (mode === 'daily') {
		const start = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth(),
			selectedDate.getDate(),
		);
		const end = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth(),
			selectedDate.getDate() + 1,
		);
		return {
			[fromKey]: toDateString(start),
			[toKey]: toDateString(end),
		};
	}

	const start = new Date(
		selectedDate.getFullYear(),
		selectedDate.getMonth(),
		1,
	);
	const end = new Date(
		selectedDate.getFullYear(),
		selectedDate.getMonth() + 1,
		1,
	);
	return {
		[fromKey]: toDateString(start),
		[toKey]: toDateString(end),
	};
};

const buildQuery = () => {
	if (!hasActiveFilters.value) {
		return {};
	}
	const query: Record<string, string> = {
		...getDateRangeQuery(filters.fillDateMode, filters.fillDate, 'fill_date_from', 'fill_date_to'),
		...getDateRangeQuery(filters.hydroDateMode, filters.hydroDate, 'hydro_date_from', 'hydro_date_to'),
	};

	if (filters.building) {
		query.building = filters.building.trim();
	}
	if (filters.weight) {
		query.unit = filters.weight.trim();
	}
	if (filters.modelType) {
		query.model_type = filters.modelType.trim();
	}
	if (filters.yscNo) {
		query.ysc_no = filters.yscNo.trim();
	}
	return query;
};

const loadFillRecords = async () => {
	isLoading.value = true;
	try {
		const data = await $fetch('/api/fill', {
			query: buildQuery(),
		});
		tabledata.value = Array.isArray(data) ? data : [];
	}
	catch (error) {
		console.error('Error fetching data:', error);
		tabledata.value = [];
	}
	finally {
		isLoading.value = false;
	}
};

const applyFilters = async () => {
	showFilters.value = false;
	await loadFillRecords();
};

const clearFilters = async () => {
	if (yscSearchDebounceTimer) {
		clearTimeout(yscSearchDebounceTimer);
		yscSearchDebounceTimer = null;
	}
	filters.building = '';
	filters.weight = '';
	filters.modelType = '';
	filters.yscNo = '';
	yscNoSearch.value = '';
	filters.fillDateMode = 'none';
	filters.fillDate = new Date(defaultDate);
	filters.hydroDateMode = 'none';
	filters.hydroDate = new Date(defaultDate);
	showFilters.value = false;
	await loadFillRecords();
};

const applyYscSearch = async (value: string) => {
	const normalized = value.trim();
	if (filters.yscNo === normalized) {
		return;
	}
	filters.yscNo = normalized;
	await loadFillRecords();
};

const clearYscSearch = async () => {
	if (yscSearchDebounceTimer) {
		clearTimeout(yscSearchDebounceTimer);
		yscSearchDebounceTimer = null;
	}
	yscNoSearch.value = '';
	await applyYscSearch('');
};

watch(yscNoSearch, (value) => {
	if (yscSearchDebounceTimer) {
		clearTimeout(yscSearchDebounceTimer);
	}
	yscSearchDebounceTimer = setTimeout(() => {
		void applyYscSearch(value);
	}, 400);
});

onBeforeUnmount(() => {
	if (yscSearchDebounceTimer) {
		clearTimeout(yscSearchDebounceTimer);
	}
});

const loadFilterOptions = async () => {
	try {
		const data = await $fetch('/api/fill/filters');
		filterOptions.value = {
			buildings: data?.buildings ?? [],
			units: data?.units ?? [],
			modelTypes: data?.modelTypes ?? [],
		};
	}
	catch (error) {
		console.error('Error fetching filter options:', error);
	}
};

await loadFillRecords();
await loadFilterOptions();

const columns = [
	{
		accessorKey: 'products.locations.room',
		header: headerLabels.location,
	},
	{
		accessorKey: 'products.locations.building_id.name',
		header: headerLabels.building_area,
	},
	{
		accessorKey: 'products.locations.location_id',
		header: headerLabels.location_id,
	},
	{
		accessorKey: 'products.unit',
		header: headerLabels.unit,
	},
	{
		accessorKey: 'products.model_type',
		header: headerLabels.model_type,
	},
	{
		accessorKey: 'products.refill_date',
		header: headerLabels.refill_date,
	},
	{
		accessorKey: 'products.hydrostatic_test_date',
		header: headerLabels.hydrostatic_test_date,
	},
	{
		accessorKey: 'products.next_refill_date',
		header: headerLabels.next_refill_date,
	},
];

const expandColumns = [
	{
		accessorKey: 'filling',
		header: fillLabels.filling,
	},
	{
		accessorKey: 'trigger_valve',
		header: fillLabels.trigger_valve,
	},
	{
		accessorKey: 'manometer',
		header: fillLabels.manometer,
	},
	{
		accessorKey: 'hose_and_nozzle',
		header: fillLabels.hose_and_nozzle,
	},
	{
		accessorKey: 'wheel',
		header: fillLabels.wheel,
	},
	{
		accessorKey: 'paint',
		header: fillLabels.paint,
	},
	{
		accessorKey: 'hydrostatic_pressure_test',
		header: fillLabels.hydrostatic_pressure_test,
	},
];

const getExpandedInfoGroups = () => {
	return [expandColumns.slice(0, 4), expandColumns.slice(4)];
};
</script>

<template>
	<div>
		<PageHeader title="Dolum kayıtları">
			<IconField>
				<InputIcon class="ri-search-line" />
				<InputText
					v-model="yscNoSearch"
					placeholder="Search"
					size="small"
				/>
				<InputIcon
					v-if="yscNoSearch"
					class="ri-close-line cursor-pointer"
					@click="clearYscSearch"
				/>
			</IconField>
			<Button
				:outlined="!hasActiveFilters"
				size="small"
				class="ml-auto"
				@click="showFilters = true"
			>
				<i class="ri-filter-3-line text-base" />
				<span>Filtreler</span>
				<span
					v-if="activeFilterCount"
					class="ml-2 min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full text-xs font-medium app-badge-muted"
				>
					{{ activeFilterCount }}
				</span>
			</Button>
			<Button
				v-if="hasActiveFilters"
				label="Temizle"
				icon="ri-close-line"
				size="small"
				severity="secondary"
				outlined
				@click="clearFilters"
			/>
		</PageHeader>

		<Drawer
			v-model:visible="showFilters"
			header="Filtreler"
			position="right"
			:style="{ width: '22rem' }"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<label class="app-label">Dolum tarihi</label>
					<Select
						v-model="filters.fillDateMode"
						:options="dateModeOptions"
						option-label="label"
						option-value="value"
					/>
				</div>
				<div
					v-if="filters.fillDateMode !== 'none'"
					class="flex flex-col gap-2"
				>
					<label class="app-label">Tarih</label>
					<DatePicker
						v-model="filters.fillDate"
						:view="filters.fillDateMode === 'monthly' ? 'month' : 'date'"
						:date-format="filters.fillDateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
						size="small"
						show-button-bar
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="app-label">Hidrostatik test tarihi</label>
					<Select
						v-model="filters.hydroDateMode"
						:options="dateModeOptions"
						option-label="label"
						option-value="value"
					/>
				</div>
				<div
					v-if="filters.hydroDateMode !== 'none'"
					class="flex flex-col gap-2"
				>
					<label class="app-label">Tarih</label>
					<DatePicker
						v-model="filters.hydroDate"
						:view="filters.hydroDateMode === 'monthly' ? 'month' : 'date'"
						:date-format="filters.hydroDateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
						size="small"
						show-button-bar
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="app-label">Bulduğu bina/alan</label>
					<Select
						v-model="filters.building"
						:options="filterOptions.buildings"
						placeholder="Bina/alan seç"
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="app-label">Ağırlık</label>
					<Select
						v-model="filters.weight"
						:options="filterOptions.units"
						placeholder="Ağırlık seç"
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="app-label">Modeli / tipi</label>
					<Select
						v-model="filters.modelType"
						:options="filterOptions.modelTypes"
						placeholder="Modeli / tipi seç"
						filter
						show-clear
					/>
				</div>
			</div>
			<div class="mt-6 flex items-center justify-end gap-2">
				<Button
					label="Temizle"
					severity="secondary"
					outlined
					@click="clearFilters"
				/>
				<Button
					label="Uygula"
					:loading="isLoading"
					@click="applyFilters"
				/>
			</div>
		</Drawer>
		<EmptyState v-if="!tabledata.length">
			<template #title>
				Dolum kaydı bulunamadı
			</template>
			<template #subtitle>
				Seçilen filtreler için dolum kaydı bulunamadı.
			</template>
		</EmptyState>
		<div
			v-else
			class="overflow-x-auto"
		>
			<DataTable
				v-model:expanded-rows="expandedRows"
				:value="tabledata"
				:loading="isLoading"
				class="text-sm"
			>
				<Column
					expander
					style="width: 3rem"
				/>
				<Column
					v-for="item in columns"
					:key="item.accessorKey"
					:field="item.accessorKey"
					:header="item.header"
				>
					<template
						v-if="isCellCustom(item.accessorKey)"
						#body="slotProps"
					>
						<CustomCell
							:field="item.accessorKey"
							:value="getValueByPath(slotProps.data, item.accessorKey)"
						/>
					</template>
				</Column>
				<template #expansion="slotProps">
					<div class="p-4">
						<div
							class="grid gap-3 rounded-md border app-border-subtle bg-surface-0 p-3 md:grid-cols-2 dark:bg-surface-900"
						>
							<div
								v-for="(group, groupIndex) in getExpandedInfoGroups()"
								:key="groupIndex"
								class="flex min-w-0 flex-col gap-2 px-4"
							>
								<div
									v-for="item in group"
									:key="item.accessorKey"
									class="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2"
								>
									<span class="min-w-0 text-sm font-medium app-text-muted">
										{{ item.header }}
									</span>
									<span class="app-text">
										<CustomCell
											v-if="isCellCustom(item.accessorKey)"
											:field="item.accessorKey"
											:value="slotProps.data[item.accessorKey]"
											type="fill"
										/>
										<span v-else>
											{{ slotProps.data[item.accessorKey] ?? '-' }}
										</span>
									</span>
								</div>
							</div>
						</div>
					</div>
				</template>
			</DataTable>
		</div>
	</div>
</template>
