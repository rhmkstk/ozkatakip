<script setup lang="ts">
// import QRCode from 'qrcode';
import { header } from '@primeuix/themes/aura/accordion';
import { FilterMatchMode } from '@primevue/core/api';
import { enumsAndLabels, headerLabels } from '~/constants';
import type { Tables } from '~/types/database.types';

type ProductWithLocation = Tables<'products'> & {
	locations: Tables<'locations'> | null;
};

const loading = ref(false);
const toast = useToast();
const tabledata = ref<ProductWithLocation[]>([]);
const expandedRows = ref<ProductWithLocation[]>([]);
const selectedProducts = ref<ProductWithLocation[]>([]);
const showQRModal = ref(false);
const deleteProductConfirmModal = ref(false);
const selectedLocation = ref<string | null>(null);
const locations = ref<string[]>([]);
const filters = ref({
	'locations.building_id.name': {
		value: null,
		matchMode: FilterMatchMode.STARTS_WITH,
	},
});

const { error, refresh } = await useFetch('/api/products', {
	onResponse({ response }) {
		if (response._data) {
			tabledata.value = response._data.map((item: ProductWithLocation) => ({
				...item,
				current_status: enumsAndLabels[item.current_status as keyof typeof enumsAndLabels] || item.current_status,
			}));
			const uniqueLocations = new Set(
				response._data.map(
					(item: ProductWithLocation) => item?.locations?.building_id?.name,
				),
			);
			locations.value = Array.from(uniqueLocations as Set<string>).sort();
		}
		else {
			console.error('Error fetching data:', error);
		}
	},
});

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
		accessorKey: 'unit',
		header: headerLabels.unit,
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
};

const handleDeleteProducts = async () => {
	if (selectedProducts.value.length === 0) return;

	const productIds = (selectedProducts.value as Array<{ id: number }>).map(
		product => product.id.toString(),
	);
	loading.value = true;
	try {
		await $fetch('/api/products', {
			method: 'DELETE',
			body: { ids: productIds },
		});
		selectedProducts.value = [];
		deleteProductConfirmModal.value = false;
		toast.add({
			severity: 'success',
			summary: 'Başarılı',
			detail: 'Ürünler başarıyla silindi.',
		});
		refresh();
	}
	catch (err) {
		console.error('Error deleting products:', err);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Ürünler silinirken bir hata oluştu.',
		});
	}
	finally {
		loading.value = false;
	}
};
</script>

<template>
	<div>
		<BaseLoader v-if="loading" />
		<div>
			<PageHeader
				:title="`${selectedLocation} konumundaki tüpler listeleniyor`"
			>
				<Select
					v-model="filters['locations.building_id.name'].value"
					:options="locations"
					placeholder="Bulundugu bina/alan sefc"
					class="w-full md:w-56"
				/>
				<template #right>
					<Button
						v-if="selectedProducts.length"
						outlined
						label="QR Kod Oluştur"
						icon="ri-qr-code-line"
						@click="generateQRCodes"
					/>

					<Button
						v-if="selectedProducts.length"
						severity="danger"
						outlined
						label="Ürünleri Sil"
						icon="ri-delete-bin-5-line"
						@click="deleteProductConfirmModal = true"
					/>
				</template>
			</PageHeader>
		</div>
		<EmptyState v-if="!tabledata.length">
			<template #title>
				YSC bulunamadı
			</template>
			<template #subtitle>
				YSC'leri listelemek için önce eklemelisiniz.
			</template>
			<template #footer>
				<Button
					variant="text"
					class="w-full mt-2"
					label="YSC Ekle"
					@click="$router.push('/insert-data')"
				/>
			</template>
		</EmptyState>
		<div
			v-else
			class="overflow-x-auto"
		>
			<DataTable
				v-model:expanded-rows="expandedRows"
				v-model:selection="selectedProducts"
				v-model:filters="filters"
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
		<Dialog
			v-model:visible="showQRModal"
			modal
			header="QR Kod Listesi"
		>
			<DisplayQrCodes :products="selectedProducts" />
		</Dialog>
		<Dialog
			v-model:visible="deleteProductConfirmModal"
			modal
			header="Ürünleri Sil"
			:style="{ width: '30rem' }"
		>
			<p class="text-lg mb-2">
				{{
					selectedProducts
						.map((product) => product.locations?.location_id)
						.toString()
				}}
				YSC nolu ürünleri silmek istediğinizden emin misiniz ? Bu işlem geri
				alınamaz
			</p>
			<template #footer>
				<Button
					label="Sil"
					severity="danger"
					@click="handleDeleteProducts"
				/>
				<Button
					label="Vazgeç"
					severity="secondary"
					outlined
					@click="deleteProductConfirmModal = false"
				/>
			</template>
		</Dialog>
	</div>
</template>
