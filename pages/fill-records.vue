<script setup lang="ts">
import { headerLabels, fillLabels } from '~/constants';

const tabledata = ref([]);
const expandedRows = ref([]);
const isLoading = ref(false);
const showFilters = ref(false);
const filterOptions = ref({
	buildings: [] as string[],
	locations: [] as string[],
	yscNos: [] as string[],
	modelTypes: [] as string[],
});

const defaultDate = new Date();
const filters = reactive({
	dateMode: 'none',
	date: new Date(defaultDate),
	building: '',
	location: '',
	yscNo: '',
	modelType: '',
});

const dateModeOptions = [
	{ label: 'Kapalı', value: 'none' },
	{ label: 'Günlük', value: 'daily' },
	{ label: 'Aylık', value: 'monthly' },
];

const hasActiveFilters = computed(() => {
	return (
		Boolean(filters.building)
		|| Boolean(filters.location)
		|| Boolean(filters.yscNo)
		|| Boolean(filters.modelType)
		|| filters.dateMode !== 'none'
	);
});

const activeFilterCount = computed(() => {
	let count = 0;
	if (filters.building) count += 1;
	if (filters.location) count += 1;
	if (filters.yscNo) count += 1;
	if (filters.modelType) count += 1;
	if (filters.dateMode !== 'none') count += 1;
	return count;
});

const getDateRangeQuery = () => {
	if (filters.dateMode === 'none' || !filters.date) {
		return {};
	}
	const selectedDate = new Date(filters.date);
	if (filters.dateMode === 'daily') {
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
			date_from: start.toISOString(),
			date_to: end.toISOString(),
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
		date_from: start.toISOString(),
		date_to: end.toISOString(),
	};
};

const buildQuery = () => {
	if (!hasActiveFilters.value) {
		return {};
	}
	const query: Record<string, string> = {
		...getDateRangeQuery(),
	};

	if (filters.building) {
		query.building = filters.building.trim();
	}
	if (filters.location) {
		query.location = filters.location.trim();
	}
	if (filters.yscNo) {
		query.ysc_no = filters.yscNo.trim();
	}
	if (filters.modelType) {
		query.model_type = filters.modelType.trim();
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
	filters.dateMode = 'none';
	filters.date = new Date(defaultDate);
	filters.building = '';
	filters.location = '';
	filters.yscNo = '';
	filters.modelType = '';
	showFilters.value = false;
	await loadFillRecords();
};

const loadFilterOptions = async () => {
	try {
		const data = await $fetch('/api/fill/filters');
		filterOptions.value = {
			buildings: data?.buildings ?? [],
			locations: data?.locations ?? [],
			yscNos: data?.yscNos ?? [],
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

</script>

<template>
	<div>
		<PageHeader title="Dolum kayıtları listeleniyor">
			<template #right>
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
				<Button
					v-if="hasActiveFilters"
					label="Temizle"
					icon="pi pi-times"
					size="small"
					severity="secondary"
					outlined
					@click="clearFilters"
				/>
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
					<label class="text-sm font-medium text-gray-600">Tarih filtresi</label>
					<Select
						v-model="filters.dateMode"
						:options="dateModeOptions"
						optionLabel="label"
						optionValue="value"
					/>
				</div>
				<div
					v-if="filters.dateMode !== 'none'"
					class="flex flex-col gap-2"
				>
					<label class="text-sm font-medium text-gray-600">Tarih</label>
					<DatePicker
						v-model="filters.date"
						:view="filters.dateMode === 'monthly' ? 'month' : 'date'"
						:date-format="filters.dateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
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
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Bulduğu bina/alan</label>
					<Select
						v-model="filters.building"
						:options="filterOptions.buildings"
						placeholder="Bina/alan seç"
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Bulduğu yer</label>
					<Select
						v-model="filters.location"
						:options="filterOptions.locations"
						placeholder="Bulduğu yer seç"
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">YSC no</label>
					<Select
						v-model="filters.yscNo"
						:options="filterOptions.yscNos"
						placeholder="YSC no seç"
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
				Bakım Kayıdı bulunamadı
			</template>
			<template #subtitle>
				Seçilen tarihler için bakım kayıdı bulunamadı.
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
				striped-rows
				size="large"
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
						<DataTable
							:value="[slotProps.data]"
							size="small"
						>
							<Column
								v-for="item in expandColumns"
								:key="item.accessorKey"
								:field="item.accessorKey"
								:header="item.header"
							>
								<template
									v-if="isCellCustom(item.accessorKey)"
									#body="expandSlotProps"
								>
									<CustomCell
										:field="item.accessorKey"
										:value="expandSlotProps.data[item.accessorKey]"
										type="fill"
										
									/>
								</template>
							</Column>
						</DataTable>
					</div>
				</template>
			</DataTable>
		</div>
	</div>
</template>
