<script setup lang="ts">
// import QRCode from 'qrcode';
import { headerLabels, productStatusTypeLabels } from '~/constants';
import type { Tables } from '~/types/database.types';

type ProductWithLocation = Tables<'products'> & {
	locations:
		| (Omit<Tables<'locations'>, 'building_id'> & {
			building_id: Tables<'location_buildings'> | null;
		})
		| null;
};

const loading = ref(false);
const toast = useToast();
const tabledata = ref<ProductWithLocation[]>([]);
const expandedRows = ref<ProductWithLocation[]>([]);
const selectedProducts = ref<ProductWithLocation[]>([]);
const showQRModal = ref(false);
const deleteProductConfirmModal = ref(false);
const showFilters = ref(false);
const filterOptions = ref({
	buildings: [] as string[],
	units: [] as string[],
	modelTypes: [] as string[],
	brands: [] as string[],
	manufactureYears: [] as string[],
	refillPeriods: [] as string[],
	statuses: [] as string[],
});
const filterForm = reactive({
	building: '',
	weight: '',
	modelType: '',
	brand: '',
	manufactureYear: '',
	refillPeriod: '',
	refillDateMode: 'none',
	refillDate: new Date(),
	nextRefillDateMode: 'none',
	nextRefillDate: new Date(),
	hydroDateMode: 'none',
	hydroDate: new Date(),
	status: '',
});
const appliedFilters = reactive({
	building: '',
	weight: '',
	modelType: '',
	brand: '',
	manufactureYear: '',
	refillPeriod: '',
	refillDateMode: 'none',
	refillDate: new Date(),
	nextRefillDateMode: 'none',
	nextRefillDate: new Date(),
	hydroDateMode: 'none',
	hydroDate: new Date(),
	status: '',
});
const editProductModal = ref(false);
const hasActiveFilters = computed(() => {
	return (
		Boolean(appliedFilters.building)
		|| Boolean(appliedFilters.weight)
		|| Boolean(appliedFilters.modelType)
		|| Boolean(appliedFilters.brand)
		|| Boolean(appliedFilters.manufactureYear)
		|| Boolean(appliedFilters.refillPeriod)
		|| appliedFilters.refillDateMode !== 'none'
		|| appliedFilters.nextRefillDateMode !== 'none'
		|| appliedFilters.hydroDateMode !== 'none'
		|| Boolean(appliedFilters.status)
	);
});
const activeFilterCount = computed(() => {
	let count = 0;
	if (appliedFilters.building) count += 1;
	if (appliedFilters.weight) count += 1;
	if (appliedFilters.modelType) count += 1;
	if (appliedFilters.brand) count += 1;
	if (appliedFilters.manufactureYear) count += 1;
	if (appliedFilters.refillPeriod) count += 1;
	if (appliedFilters.refillDateMode !== 'none') count += 1;
	if (appliedFilters.nextRefillDateMode !== 'none') count += 1;
	if (appliedFilters.hydroDateMode !== 'none') count += 1;
	if (appliedFilters.status) count += 1;
	return count;
});
const dateModeOptions = [
	{ label: 'Kapalı', value: 'none' },
	{ label: 'Günlük', value: 'daily' },
	{ label: 'Aylık', value: 'monthly' },
];
const statusOptions = computed(() => {
	return filterOptions.value.statuses.map((statusValue) => {
		const label = productStatusTypeLabels[
			statusValue as keyof typeof productStatusTypeLabels
		] || statusValue;
		return {
			label,
			value: statusValue,
		};
	});
});

const uniqueValues = (
	values: Array<string | number | null | undefined>,
): string[] => {
	return Array.from(
		new Set(values.filter(value => value !== null && value !== undefined)),
	)
		.map(value => String(value).trim())
		.filter(Boolean)
		.sort((a, b) => a.localeCompare(b, 'tr'));
};

const buildQuery = () => {
	const query: Record<string, string> = {};
	const toDateRange = (mode: string, dateValue: Date, fromKey: string, toKey: string) => {
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

	Object.assign(query, toDateRange(appliedFilters.refillDateMode, appliedFilters.refillDate, 'refill_date_from', 'refill_date_to'));
	Object.assign(query, toDateRange(appliedFilters.nextRefillDateMode, appliedFilters.nextRefillDate, 'next_refill_date_from', 'next_refill_date_to'));
	Object.assign(query, toDateRange(appliedFilters.hydroDateMode, appliedFilters.hydroDate, 'hydro_date_from', 'hydro_date_to'));

	if (appliedFilters.building) query.building = appliedFilters.building.trim();
	if (appliedFilters.weight) query.unit = appliedFilters.weight.trim();
	if (appliedFilters.modelType) {
		query.model_type = appliedFilters.modelType.trim();
	}
	if (appliedFilters.brand) query.brand = appliedFilters.brand.trim();
	if (appliedFilters.manufactureYear) query.manufacture_year = appliedFilters.manufactureYear.trim();
	if (appliedFilters.refillPeriod) query.refill_period = appliedFilters.refillPeriod.trim();
	if (appliedFilters.status) query.status = appliedFilters.status.trim();
	return query;
};

const loadProducts = async () => {
	loading.value = true;
	try {
		const data = await $fetch<ProductWithLocation[]>('/api/products', {
			query: buildQuery(),
		});
		tabledata.value = Array.isArray(data) ? data : [];
		selectedProducts.value = [];
	}
	catch (err) {
		console.error('Error fetching products:', err);
		tabledata.value = [];
	}
	finally {
		loading.value = false;
	}
};

const loadFilterOptions = async () => {
	try {
		const data = await $fetch<ProductWithLocation[]>('/api/products');
		const products = Array.isArray(data) ? data : [];
		filterOptions.value = {
			buildings: uniqueValues(
				products.map(item => item?.locations?.building_id?.name),
			),
			units: uniqueValues(products.map(item => item?.unit)),
			modelTypes: uniqueValues(products.map(item => item?.model_type)),
			brands: uniqueValues(products.map(item => item?.brand)),
			manufactureYears: uniqueValues(products.map(item => item?.manufacture_year)),
			refillPeriods: uniqueValues(products.map(item => item?.refill_period)),
			statuses: uniqueValues(products.map(item => item?.current_status)),
		};
	}
	catch (err) {
		console.error('Error fetching filter options:', err);
	}
};

const refresh = async () => {
	await Promise.all([loadProducts(), loadFilterOptions()]);
};

await refresh();

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
	// {
	//   accessorKey: "next_hydrostatic_test_date",
	//   header: headerLabels.next_hydrostatic_test_date,
	// },
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

const openEditModal = () => {
	editProductModal.value = true;
};

const downloadPdf = async () => {
	const urls = await generateLabelsPng(selectedProducts.value);

	urls.forEach((url, index) => {
		const a = document.createElement('a');
		a.href = url;
		a.download = `etiket-${index + 1}.png`;
		a.click();
		URL.revokeObjectURL(url);
	});
};

const handleDeleteProducts = async () => {
	if (selectedProducts.value.length === 0) return;

	const productIds = (selectedProducts.value as Array<{ id: number }>).map(
		product => product.id,
	);
	loading.value = true;
	deleteProductConfirmModal.value = false;
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
		await refresh();
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

const applyFilters = async () => {
	appliedFilters.building = filterForm.building;
	appliedFilters.weight = filterForm.weight;
	appliedFilters.modelType = filterForm.modelType;
	appliedFilters.brand = filterForm.brand;
	appliedFilters.manufactureYear = filterForm.manufactureYear;
	appliedFilters.refillPeriod = filterForm.refillPeriod;
	appliedFilters.refillDateMode = filterForm.refillDateMode;
	appliedFilters.refillDate = new Date(filterForm.refillDate);
	appliedFilters.nextRefillDateMode = filterForm.nextRefillDateMode;
	appliedFilters.nextRefillDate = new Date(filterForm.nextRefillDate);
	appliedFilters.hydroDateMode = filterForm.hydroDateMode;
	appliedFilters.hydroDate = new Date(filterForm.hydroDate);
	appliedFilters.status = filterForm.status;
	showFilters.value = false;
	await loadProducts();
};

const clearFilters = async () => {
	filterForm.building = '';
	filterForm.weight = '';
	filterForm.modelType = '';
	filterForm.brand = '';
	filterForm.manufactureYear = '';
	filterForm.refillPeriod = '';
	filterForm.refillDateMode = 'none';
	filterForm.refillDate = new Date();
	filterForm.nextRefillDateMode = 'none';
	filterForm.nextRefillDate = new Date();
	filterForm.hydroDateMode = 'none';
	filterForm.hydroDate = new Date();
	filterForm.status = '';
	appliedFilters.building = '';
	appliedFilters.weight = '';
	appliedFilters.modelType = '';
	appliedFilters.brand = '';
	appliedFilters.manufactureYear = '';
	appliedFilters.refillPeriod = '';
	appliedFilters.refillDateMode = 'none';
	appliedFilters.refillDate = new Date();
	appliedFilters.nextRefillDateMode = 'none';
	appliedFilters.nextRefillDate = new Date();
	appliedFilters.hydroDateMode = 'none';
	appliedFilters.hydroDate = new Date();
	appliedFilters.status = '';
	showFilters.value = false;
	await loadProducts();
};
</script>

<template>
	<div>
		<BaseLoader v-if="loading" />
		<div>
			<PageHeader title="Tüm lokasyonlardaki tüpler listeleniyor">
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
					<Button
						v-if="selectedProducts.length"
						outlined
						label="QR Kod Oluştur"
						icon="ri-qr-code-line"
						size="small"
						@click="generateQRCodes"
					/>

					<Button
						v-if="selectedProducts.length === 1"
						outlined
						label="Düzenle"
						icon="ri-edit-line"
						size="small"
						severity="info"
						:disabled="selectedProducts.length !== 1"
						@click="openEditModal"
					/>

					<Button
						v-if="selectedProducts.length"
						severity="danger"
						outlined
						label="Ürünleri Sil"
						icon="ri-delete-bin-5-line"
						size="small"
						@click="deleteProductConfirmModal = true"
					/>
				</template>
			</PageHeader>
		</div>
		<Drawer
			v-model:visible="showFilters"
			header="Filtreler"
			position="left"
			:style="{ width: '22rem' }"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Bulduğu bina/alan</label>
					<Select
						v-model="filterForm.building"
						:options="filterOptions.buildings"
						placeholder="Bina/alan seç"
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Ağırlık</label>
					<Select
						v-model="filterForm.weight"
						:options="filterOptions.units"
						placeholder="Ağırlık seç"
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Modeli / tipi</label>
					<Select
						v-model="filterForm.modelType"
						:options="filterOptions.modelTypes"
						placeholder="Modeli / tipi seç"
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Markası</label>
					<Select
						v-model="filterForm.brand"
						:options="filterOptions.brands"
						placeholder="Marka seç"
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Üretim tarihi</label>
					<Select
						v-model="filterForm.manufactureYear"
						:options="filterOptions.manufactureYears"
						placeholder="Üretim tarihi seç"
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Yeniden dolum periyodu</label>
					<Select
						v-model="filterForm.refillPeriod"
						:options="filterOptions.refillPeriods"
						placeholder="Yeniden dolum periyodu seç"
						filter
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Dolum tarihi</label>
					<Select
						v-model="filterForm.refillDateMode"
						:options="dateModeOptions"
						option-label="label"
						option-value="value"
					/>
				</div>
				<div
					v-if="filterForm.refillDateMode !== 'none'"
					class="flex flex-col gap-2"
				>
					<label class="text-sm font-medium text-gray-600">Tarih</label>
					<DatePicker
						v-model="filterForm.refillDate"
						:view="filterForm.refillDateMode === 'monthly' ? 'month' : 'date'"
						:date-format="filterForm.refillDateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
						size="small"
						show-button-bar
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Yeniden dolum tarihi</label>
					<Select
						v-model="filterForm.nextRefillDateMode"
						:options="dateModeOptions"
						option-label="label"
						option-value="value"
					/>
				</div>
				<div
					v-if="filterForm.nextRefillDateMode !== 'none'"
					class="flex flex-col gap-2"
				>
					<label class="text-sm font-medium text-gray-600">Tarih</label>
					<DatePicker
						v-model="filterForm.nextRefillDate"
						:view="filterForm.nextRefillDateMode === 'monthly' ? 'month' : 'date'"
						:date-format="filterForm.nextRefillDateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
						size="small"
						show-button-bar
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Hidrostatik test tarihi</label>
					<Select
						v-model="filterForm.hydroDateMode"
						:options="dateModeOptions"
						option-label="label"
						option-value="value"
					/>
				</div>
				<div
					v-if="filterForm.hydroDateMode !== 'none'"
					class="flex flex-col gap-2"
				>
					<label class="text-sm font-medium text-gray-600">Tarih</label>
					<DatePicker
						v-model="filterForm.hydroDate"
						:view="filterForm.hydroDateMode === 'monthly' ? 'month' : 'date'"
						:date-format="filterForm.hydroDateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
						size="small"
						show-button-bar
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">Durum</label>
					<Select
						v-model="filterForm.status"
						:options="statusOptions"
						option-label="label"
						option-value="value"
						placeholder="Durum seç"
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
					@click="applyFilters"
				/>
			</div>
		</Drawer>
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
				>
					<template
						v-if="isCellCustom(item.accessorKey)"
						#body="slotProps"
					>
						<CustomCell
							:field="item.accessorKey"
							:value="slotProps.data[item.accessorKey]"
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
			<template #header>
				<div class="flex justify-between items-center w-full">
					<h2 class="text-xl font-semibold">
						QR Kod Listesi
					</h2>
					<Button
						icon="ri-printer-line"
						class="mr-2"
						label="PDF Indir"
						severity="secondary"
						@click="downloadPdf"
					/>
				</div>
			</template>
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
					:loading="loading"
					:disabled="loading"
					@click="handleDeleteProducts"
				/>
				<Button
					label="Vazgeç"
					severity="secondary"
					outlined
					:disabled="loading"
					@click="deleteProductConfirmModal = false"
				/>
			</template>
		</Dialog>
		<ProductEditDialog
			v-model:visible="editProductModal"
			:product="selectedProducts.length === 1 ? selectedProducts[0] : undefined"
			@updated="refresh"
		/>
	</div>
</template>
