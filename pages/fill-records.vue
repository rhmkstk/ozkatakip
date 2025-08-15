<script setup lang="ts">
import { headerLabels, fillLabels } from '~/constants';

const tabledata = ref([]);
const expandedRows = ref([]);
const { error } = await useFetch('/api/fill', {
	method: 'GET',
	onResponse({ response }) {
		if (response._data) {
			tabledata.value = response._data;
		}
		else {
			console.error('Error fetching data:', error);
		}
	},
});

const date = ref(new Date());

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
		<PageHeader title="2024 Nisan ayina ait kayitlar listeleniyor">
			<DatePicker
				v-model="date"
				view="month"
				date-format="mm/yy"
			/>
		</PageHeader>
		<!-- <div class="pb-6">
			<div class="flex items-center space-x-4">
				<DatePicker
					v-model="date"
					view="month"
					date-format="mm/yy"
				/>
				<h2 class="text-lg">
					2024 Nisan ayina ait kayitlar listeleniyor
				</h2>
			</div>
		</div> -->
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
