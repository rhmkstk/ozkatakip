<script setup lang="ts">
// import type { Tables, TablesInsert } from "~/types/database.types";

// Veri girisi
// Barkod olusuturma

const tabledata = ref([]);
const expandedRows = ref([]);
const { data, status, error } = await useFetch('/api/inspections', {
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
		accessorKey: 'products.locations.location',
		header: 'Bulduğu yer',
	},
	{
		accessorKey: 'products.locations.building_area',
		header: 'Bulduğu bina / alan',
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

const expandColuns = [
	{
		field: 'photo_url',
		header: 'Fotoğraf',
	},
	{
		field: 'note',
		header: 'Not',
	},
	{
		field: 'body',
		header: 'Gövde',
	},
	{
		field: 'control_card',
		header: 'Kontrol kartı',
	},
	{
		field: 'hose_and_nozzle',
		header: 'Hortum ve memesi',
	},
	{
		field: 'instruction_and_label',
		header: 'Talimat ve etiket',
	},
	{
		field: 'mass',
		header: 'Kütle',
	},
	{
		field: 'pin_and_seal',
		header: 'Pim ve conta',
	},
	{
		field: 'position',
		header: 'Pozisyon',
	},
	{
		field: 'pressure',
		header: 'Basınç',
	},
	{
		field: 'working_mechanism',
		header: 'Çalışma mekanizması',
	},
];

// const columns = [
//   {
//     accessorKey: "position",
//     header: "Position",
//   },
//   {
//     accessorKey: "body",
//     header: "Body",
//   },
//   {
//     accessorKey: "control_card",
//     header: "Control card",
//   },
//   {
//     accessorKey: "hose_and_nozzle",
//     header: "Hose and Nozzle",
//   },
//   {
//     accessorKey: "instruction_and_label",
//     header: "Instruction and label",
//   },
//   {
//     accessorKey: "mass",
//     header: "Mass",
//   },
//   {
//     accessorKey: "pin_and_seal",
//     header: "Pin and Seal",
//   },
//   {
//     accessorKey: "pressure",
//     header: "Pressure",
//   },
//   {
//     accessorKey: "working_mechanism",
//     header: "Working Mechanism",
//   },
//   {
//     accessorKey: "result",
//     header: "Result",
//   },
//   {
//     accessorKey: "date",
//     header: "Date",
//   },
// ];

// function getText(slotProps) {
//   console.log('slotProps:', slotProps);
//   const date = new Date(slotProps.data.products.refill_date);
//   return date.toLocaleDateString("tr-TR", {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   });
// }
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
					<!-- <template #body="slotProps">
            <CustomCell v-if="slotProps.field === 'products.refill_date'" :slot-props="slotProps" />
          </template> -->
					<!-- <template
            v-if="item.accessorKey === 'products.refill_date'"
            #body="slotProps"
          >
            {{
              new Date(slotProps.data.products.refill_date).toLocaleDateString(
                "tr-TR",
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }
              )
            }}
          </template>
          <template
            v-if="item.accessorKey === 'products.next_refill_date'"
            #body="slotProps"
          >
            {{
              new Date(slotProps.data.products.next_refill_date).toLocaleDateString(
                "tr-TR",
                {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }
              )
            }}
          </template> -->
				</Column>
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
								:header="item.header"
							/>
						</DataTable>
					</div>
				</template>
			</DataTable>
		</div>
	</div>
</template>
