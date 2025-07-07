<script setup lang="ts">
const tabledata = ref([]);
const expandedRows = ref([]);
const { error } = await useFetch('/api/inspections', {
	method: 'GET',
	onResponse({ response }) {
		if (response._data) {
			console.log('response._data;', response._data);
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
		header: 'Bulduğu oda',
	},
	{
		accessorKey: 'products.locations.building_id.name',
		header: 'Bulduğu bina',
	},
	{
		accessorKey: 'products.locations.location_id',
		header: 'YSC no',
	},
	{
		accessorKey: 'products.model_type',
		header: 'Modeli / tipi',
	},
	{
		accessorKey: 'products.refill_date',
		header: 'Dolum tarihi',
	},
	{
		accessorKey: 'products.next_refill_date',
		header: 'Yeniden dolum tarihi',
	},
	{
		accessorKey: 'result',
		header: 'Sonuc',
	},
];

const expandColumns = [
	{
		accessorKey: 'photo_url',
		header: 'Fotoğraf',
	},
	{
		accessorKey: 'note',
		header: 'Not',
	},
	{
		accessorKey: 'body',
		header: 'Gövde',
	},
	{
		accessorKey: 'control_card',
		header: 'Kontrol kartı',
	},
	{
		accessorKey: 'hose_and_nozzle',
		header: 'Hortum ve memesi',
	},
	{
		accessorKey: 'instruction_and_label',
		header: 'Talimat ve etiket',
	},
	{
		accessorKey: 'mass',
		header: 'Kütle',
	},
	{
		accessorKey: 'pin_and_seal',
		header: 'Pim ve conta',
	},
	{
		accessorKey: 'position',
		header: 'Pozisyon',
	},
	{
		accessorKey: 'pressure',
		header: 'Basınç',
	},
	{
		accessorKey: 'working_mechanism',
		header: 'Çalışma mekanizması',
	},
];

function getValueByPath(obj, path) {
	return path.split('.').reduce((acc, part) => acc?.[part], obj);
}
</script>

<template>
	<div>
		<div class="pb-6">
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
		</div>

		<div class="overflow-x-auto">
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
