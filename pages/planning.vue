<script setup lang="ts">
import { header } from '@primeuix/themes/aura/accordion';
import { headerLabels } from '~/constants';
import type { Tables } from '~/types/database.types';

type DateRange = Date | null;

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
const startDate = ref(new Date(now.getFullYear(), now.getMonth(), 1)); // 1st of next month
const endDate = ref(new Date(now.getFullYear(), now.getMonth() + 1, 1)); // 1st of the following month
const tabledata = ref<ProductWithLocation[]>([]);
const locations = ref<string[]>([]);
const expandedRows = ref([]);
const loading = ref(false);
const dateRange = ref<DateRange[]>([
	startDate.value,
	endDate.value,
]);

const onDateRangeChange = (newRange: [Date | null, Date | null]) => {
	if (newRange[0] !== null && newRange[1] !== null) {
		loading.value = true;
		startDate.value = newRange[0];
		endDate.value = newRange[1];
		tabledata.value = [];
		useFetch('/api/products/getByNextRefillDate', {
			method: 'GET',
			params: {
				start_date: startDate.value.toISOString(),
				end_date: endDate.value.toISOString(),
			},
			onResponse({ response }) {
				if (response._data) {
					tabledata.value = response._data;
					const uniqueLocations = new Set(
						response._data.map(
							(item: ProductWithLocation) => item?.locations?.building_id?.name,
						),
					);
					locations.value = Array.from(uniqueLocations) as string[];
					locations.value.sort();
				}
				loading.value = false;
			},
			onResponseError({ response }) {
				console.error('Fetch failed:', response);
				loading.value = false;
			},
		});
	}
};

onMounted(() => {
	// Initialize with the current month
	onDateRangeChange([startDate.value, endDate.value]);
});
const getFilteredDates = computed(() => {
	const start = startDate.value;
	const end = endDate.value;

	if (!start || !end) return 'Tarih aralığı seçilmedi';

	const formattedStart = start.toLocaleDateString('tr-TR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	const formattedEnd = end.toLocaleDateString('tr-TR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	return `Yeniden dolum tarihi ${formattedStart} ve ${formattedEnd} arasında olan ürünler listeleniyor`;
});
</script>

<template>
	<div class="">
		<BaseLoader v-if="loading" />
		<PageHeader :title="getFilteredDates">
			<Calendar
				v-model="dateRange"
				:date-format="'dd/mm/yy'"
				placeholder="Select Date Range"
				show-icon
				class=" w-64"
				selection-mode="range"
				@update:model-value="onDateRangeChange"
			/>
		</PageHeader>

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
