<script setup lang="ts">
import QRCode from 'qrcode';
import type { TablesInsert } from '~/types/database.types';

const tabledata = ref<TablesInsert<'products'>[]>([]);
const expandedRows = ref<TablesInsert<'products'>[]>([]);
const selectedProducts = ref<TablesInsert<'products'>[]>([]);
const showQRModal = ref(false);
const selectedLocation = ref<{ name: string; id: string } | null>(null);
const locations = ref<{ name: string; id: string }[]>([]);

const { error } = await useFetch('/api/products', {
	onResponse({ response }) {
		if (response._data) {
			tabledata.value = response._data;
			locations.value = response._data.map((item: any) => ({
				name: item.locations.building_area,
				id: item.locations.location_id,
			}));
		}
		else {
			console.error('Error fetching data:', error);
		}
	},
});

const columns = [
	{
		accessorKey: 'locations.building_area',
		header: 'Bulunduğu bina / alan',
	},
	{
		accessorKey: 'locations.location',
		header: 'Bulunduğu yer/Lokasyon',
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
	// {
	//   accessorKey: "pressure_source",
	//   header: "pressure_source",

	// },
	// {
	//   accessorKey: "working_pressure_bar",
	//   header: "working_pressure_bar",

	// },
	// {
	//   accessorKey: "manometer_scale_bar",
	//   header: "manometer_scale_bar",

	// },
	// {
	//   accessorKey: "test_pressure_bar",
	//   header: "test_pressure_bar",
	// },
	// {
	//   accessorKey: "safety_valve_setting_pressure_bar",
	//   header: "safety_valve_setting_pressure_bar",
	// },
	// {
	//   accessorKey: "working_temperature_celsius",
	//   header: "working_temperature_celsius",
	// },
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

const generateQRCodes = () => {
	showQRModal.value = true;
	// const text = 'https://example.com';

	// QRCode.toCanvas(document.getElementById('qrCanvas'), text, function (error) {
	// 	if (error) console.error(error);
	// 	console.log('QR code generated!');
	// });
};
</script>

<template>
	<div>
		<div>
			<div class="flex items-center space-x-4 pb-6">
				<Select
					v-model="selectedLocation"
					:options="locations"
					option-label="name"
					placeholder="Bulundugu bina/alan sefc"
					class="w-full md:w-56"
				/>

				<h2 class="text-lg">
					{{ selectedLocation?.name }} e konumundaki tüpler listeleniyor
				</h2>
				<Button
					v-if="selectedProducts.length"
					class="ml-auto"
					@click="generateQRCodes"
				>
					QR olustur
				</Button>
			</div>
			<!-- <p>TEST</p>
			<canvas id="qrCanvas" />
			<button @click="generateQrCode">
				Generate QR Code
			</button> -->
		</div>

		<div class="overflow-x-auto">
			<DataTable
				v-model:expanded-rows="expandedRows"
				v-model:selection="selectedProducts"
				:value="tabledata"
				striped-rows
				size="large"
				class="text-sm"
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
		<Dialog
			v-model:visible="showQRModal"
			modal
		>
			<DisplayQrCodes
				:products="selectedProducts"
			/>
			<!-- <div>
				<p>QrCode</p>
				<canvas
					id="qrCanvas"
					width="300"
					height="300"
				/>
			</div> -->
		</Dialog>
	</div>
</template>
