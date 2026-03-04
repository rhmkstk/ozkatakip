<script setup lang="ts">
import { headerLabels } from '~/constants';
import type { Tables } from '~/types/database.types';

type ProductWithLocation = Tables<'products'> & {
	locations: Tables<'locations'> | null;
};
// basliklari constantstan cek
const columns = [
	{
		accessorKey: 'locations.building_id.name',
		header: headerLabels.building_area,
	},
	{
		accessorKey: 'locations.room',
		header: headerLabels.location,
	},
	{
		accessorKey: 'locations.location_id',
		header: headerLabels.location_id,
	},
	{
		accessorKey: 'model_type',
		header: headerLabels.model_type,
	},
	{
		accessorKey: 'serial_number',
		header: headerLabels.serial_number,
	},
	{
		accessorKey: 'brand',
		header: headerLabels.brand,
	},
	{
		accessorKey: 'manufacture_year',
		header: headerLabels.manufacture_year,
	},
	{
		accessorKey: 'refill_period',
		header: headerLabels.refill_period,
	},
	{
		accessorKey: 'refill_date',
		header: headerLabels.refill_date,
	},
	{
		accessorKey: 'next_refill_date',
		header: headerLabels.next_refill_date,
	},
	{
		accessorKey: 'hydrostatic_test_date',
		header: headerLabels.hydrostatic_test_date,
	},
	{
		accessorKey: 'next_hydrostatic_test_date',
		header: headerLabels.next_hydrostatic_test_date,
	},
	{
		accessorKey: 'current_status',
		header: headerLabels.current_status,
	},
];

const expandColuns = [
	{
		field: 'pressure_source',
		header: headerLabels.pressure_source,
	},
	{
		field: 'working_pressure_bar',
		header: headerLabels.working_pressure_bar,
	},
	{
		field: 'manometer_scale_bar',
		header: headerLabels.manometer_scale_bar,
	},
	{
		field: 'test_pressure_bar',
		header: headerLabels.test_pressure_bar,
	},
	{
		field: 'safety_valve_setting_pressure_bar',
		header: headerLabels.safety_valve_setting_pressure_bar,
	},
	{
		field: 'working_temperature_celsius',
		header: headerLabels.working_temperature_celsius,
	},
];
const now = new Date();
const startDate = ref(new Date(now.getFullYear(), now.getMonth(), 1));
const endDate = ref(new Date(now.getFullYear(), now.getMonth() + 1, 1));
const tabledata = ref<ProductWithLocation[]>([]);
const isLoading = ref(false);
const showFilters = ref(false);
const filterOptions = ref({
	locations: [] as string[],
	modelTypes: [] as string[],
});
const filters = reactive({
	date: new Date(now),
	location: '',
	modelType: '',
	yscNo: '',
});
const expandedRows = ref([]);
const yscNoSearch = ref('');
let yscSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const hasActiveFilters = computed(() => {
	return Boolean(filters.location) || Boolean(filters.modelType) || Boolean(filters.yscNo);
});

const activeFilterCount = computed(() => {
	let count = 0;
	if (filters.location) count += 1;
	if (filters.modelType) count += 1;
	if (filters.yscNo) count += 1;
	return count;
});

const getDateRangeQuery = () => {
	const selectedDate = new Date(filters.date);
	const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
	const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
	startDate.value = start;
	endDate.value = end;
	return {
		start_date: start.toISOString(),
		end_date: end.toISOString(),
	};
};

const buildQuery = () => {
	const query: Record<string, string> = {
		...getDateRangeQuery(),
	};

	if (filters.location) {
		query.location = filters.location.trim();
	}
	if (filters.modelType) {
		query.model_type = filters.modelType.trim();
	}
	if (filters.yscNo) {
		query.ysc_no = filters.yscNo.trim();
	}
	return query;
};

const loadPlanningRecords = async () => {
	isLoading.value = true;
	try {
		const data = await $fetch('/api/products/getByNextRefillDate', {
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
	await loadPlanningRecords();
};

const clearFilters = async () => {
	if (yscSearchDebounceTimer) {
		clearTimeout(yscSearchDebounceTimer);
		yscSearchDebounceTimer = null;
	}
	filters.date = new Date(now);
	filters.location = '';
	filters.modelType = '';
	filters.yscNo = '';
	yscNoSearch.value = '';
	showFilters.value = false;
	await loadPlanningRecords();
};

const applyYscSearch = async (value: string) => {
	const normalized = value.trim();
	if (filters.yscNo === normalized) {
		return;
	}
	filters.yscNo = normalized;
	await loadPlanningRecords();
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
		const data = await $fetch('/api/products/filters');
		filterOptions.value = {
			locations: data?.locations ?? [],
			modelTypes: data?.modelTypes ?? [],
		};
	}
	catch (error) {
		console.error('Error fetching filter options:', error);
	}
};

onMounted(async () => {
	await loadPlanningRecords();
	await loadFilterOptions();
});

const getFilteredDates = computed(() => {
	const start = startDate.value;
	const end = endDate.value;

	if (!start || !end) return 'Tarih aralığı seçilmedi';

	const formattedStart = start.toLocaleDateString('tr-TR', {
		month: 'long',
		year: 'numeric',
	});

	return `Yeniden dolum tarihi ${formattedStart} ayı içinde olan ürünler listeleniyor`;
});
</script>

<template>
	<div class="">
		<BaseLoader v-if="isLoading" />
		<PageHeader :title="getFilteredDates">
			<template #right>
				<Button
					v-if="hasActiveFilters"
					label="Temizle"
					icon="ri-close-line"
					size="small"
					severity="secondary"
					outlined
					@click="clearFilters"
				/>
				<Button
					:outlined="!hasActiveFilters"
					size="small"
					@click="showFilters = true"
				>
					<i class="ri-filter-3-line text-base" />
					<span>Filtreler</span>
					<span
						v-if="activeFilterCount"
						class="ml-2 min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full text-xs font-medium bg-white/70 text-gray-900"
					>
						{{ activeFilterCount }}
					</span>
				</Button>
				<div class="relative">
					<InputText
						v-model="yscNoSearch"
						size="small"
						placeholder="YSC no ara"
						class="w-52 pr-10"
					/>
					<button
						v-if="yscNoSearch"
						type="button"
						aria-label="YSC aramasını temizle"
						class="absolute inset-y-0 right-2 z-10 my-auto inline-flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700"
						@click="clearYscSearch"
					>
						<i class="ri-close-line text-sm leading-none" />
					</button>
				</div>
			</template>
		</PageHeader>

		<Drawer
			v-model:visible="showFilters"
			header="Filtreler"
			position="left"
			:style="{ width: '22rem' }"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Ay</label>
					<DatePicker
						v-model="filters.date"
						view="month"
						date-format="mm/yy"
						size="small"
						show-button-bar
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Model tipi</label>
					<Select
						v-model="filters.modelType"
						:options="filterOptions.modelTypes"
						placeholder="Model tipi seç"
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Lokasyon</label>
					<Select
						v-model="filters.location"
						:options="filterOptions.locations"
						placeholder="Lokasyon seç"
						filter
						show-clear
					/>
				</div>
			</div>
			<div class="mt-6 flex items-center gap-2">
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
				Ürün bulunamadı
			</template>
			<template #subtitle>
				Seçilen tarihler arasında yeniden dolum tarihi olan ürün bulunamadı.
			</template>
		</EmptyState>
		<div
			v-else
			class="overflow-x-auto"
		>
			<DataTable
				v-model:expanded-rows="expandedRows"
				:value="tabledata"
				striped-rows
				size="large"
				class="text-sm"
				removable-sort
			>
				<Column
					selection-mode="multiple"
					header-style="width: 4rem"
				/>
				<Column
					expander
					style="width: 3rem"
				/>
					<Column
						v-for="item in columns"
						:key="item.accessorKey"
						:field="item.accessorKey"
						:header="item.header.toUpperCase()"
						sortable
					/>
				<template #expansion="slotProps">
					<div class="p-4">
						<DataTable
							:value="[slotProps.data]"
							size="small"
						>
							<Column
								v-for="item in expandColuns"
								:key="item.field"
								:field="item.field"
								:header="item.header.toUpperCase()"
							/>
						</DataTable>
					</div>
				</template>
			</DataTable>
		</div>
	</div>
</template>
