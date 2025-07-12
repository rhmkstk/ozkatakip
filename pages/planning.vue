<script setup lang="ts">
import type { Tables } from '~/types/database.types';

type DateRange = Date | null;

type ProductWithLocation = Tables<'products'> & {
	locations: Tables<'locations'> | null;
};
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
const columns = [
	{
		accessorKey: 'locations.building_id.name',
		header: 'Bulunduğu bina',
	},
	{
		accessorKey: 'locations.room',
		header: 'Bulunduğu oda',
	},
	{
		accessorKey: 'locations.location_id',
		header: 'YSC no',
	},
	{
		accessorKey: 'model_type',
		header: 'Modeli / tipi',
	},
	{
		accessorKey: 'serial_number',
		header: 'Seri no',
	},
	{
		accessorKey: 'brand',
		header: 'Marka',
	},
	{
		accessorKey: 'manufacture_year',
		header: 'Üretim tarihi',
	},
	{
		accessorKey: 'refill_period',
		header: 'Yeniden dolum periyodu',
	},
	{
		accessorKey: 'refill_date',
		header: 'Dolum tarihi',
	},
	{
		accessorKey: 'next_refill_date',
		header: 'Yeniden dolum tarihi',
	},
	{
		accessorKey: 'hydrostatic_test_date',
		header: 'Hidrostatik test tarihi',
	},
	{
		accessorKey: 'next_hydrostatic_test_date',
		header: 'Sonraki hidrostatik test tarihi',
	},
	{
		accessorKey: 'current_status',
		header: 'Durum',
	},
];

const expandColuns = [
	{
		field: 'pressure_source',
		header: 'Basinc kaynagi',
	},
	{
		field: 'working_pressure_bar',
		header: 'Calisma basinci(Bar)',
	},
	{
		field: 'manometer_scale_bar',
		header: 'Monometre skala buyuklugu(Bar)',
	},
	{
		field: 'test_pressure_bar',
		header: 'Test basıncı(Bar)',
	},
	{
		field: 'safety_valve_setting_pressure_bar',
		header: 'Emniyet valfi ayar basinci(Bar)',
	},
	{
		field: 'working_temperature_celsius',
		header: 'Calisma sicaklik araligi(°C)',
	},
];
</script>

<template>
	<div>
		<BaseLoader v-if="loading" />
		<!-- <PageHeader :title="pageTitle">
			<Calendar
				v-model="dateRange"
				:date-format="'dd/mm/yy'"
				placeholder="Select Date Range"
				show-icon
				class=" w-64"
				selection-mode="range"
				@update:model-value="onDateRangeChange"
			/>
    </PageHeader> -->

		<div class="flex items-center space-x-4 mb-6 p-6 -m-6 shadow-sm">
			<Calendar
				v-model="dateRange"
				:date-format="'dd/mm/yy'"
				placeholder="Select Date Range"
				show-icon
				class=" w-64"
				selection-mode="range"
				@update:model-value="onDateRangeChange"
			/>
			<h2 class="text-gray-500">
				Yeniden dolum tarihi
				{{
					startDate.toLocaleDateString("tr-TR", {
						day: "numeric",
						month: "long",
						year: "numeric",
					})
				}}
				ve
				{{
					endDate.toLocaleDateString("tr-TR", {
						day: "numeric",
						month: "long",
						year: "numeric",
					})
				}}
				arasinda olan urunler listeleniyor
			</h2>
		</div>

		<div class="overflow-x-auto">
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
