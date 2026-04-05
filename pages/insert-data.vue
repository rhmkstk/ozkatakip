<script setup lang="ts">
import {
	headerLabels,
	fireExtinguishers,
	productStatusOptions,
} from '@/constants';
import type { Tables, TablesInsert } from '~/types/database.types';

const HYDROSTATIC_TEST_PERIOD = 4; // years
type BuildingRow = Tables<'location_buildings'>;
type LocationRow = Tables<'locations'>;
type ProductRow = Tables<'products'>;
type InsertProductForm = Omit<
	TablesInsert<'products'>,
	| 'tenant_id'
	| 'serial_number'
	| 'manufacture_year'
	| 'refill_date'
	| 'next_refill_date'
	| 'hydrostatic_test_date'
	| 'next_hydrostatic_test_date'
> & {
	serial_number: number | null;
	manufacture_year: Date | null;
	refill_date: Date | null;
	next_refill_date: Date | null;
	hydrostatic_test_date: Date | null;
	next_hydrostatic_test_date: Date | null;
};
type InsertLocationForm = Omit<TablesInsert<'locations'>, 'tenant_id'>;
type BuildingRelations = {
	locations: number;
	products: number;
	transactions: number;
	fillRecords: number;
	inspections: number;
};
type PendingDeleteItem = {
	building: BuildingRow;
	relations: BuildingRelations | null;
};
type DeleteBuildingConfirmPayload = {
	requiresConfirmation?: boolean;
	relations?: BuildingRelations;
};
type DeleteBuildingFetchError = {
	statusCode?: number;
	data?: {
		statusCode?: number;
		message?: string;
		data?: DeleteBuildingConfirmPayload;
	};
	message?: string;
};
type GenericFetchError = {
	statusCode?: number;
	data?: {
		statusCode?: number;
		message?: string;
	};
	message?: string;
};

const toast = useToast();
const refillPeriodOptions = [
	{ label: '1 yıl', value: 1 },
	{ label: '2 yıl', value: 2 },
	{ label: '3 yıl', value: 3 },
	{ label: '4 yıl', value: 4 },
];

const loading = ref(false);
const buildingManager = ref({
	modal: false,
	saving: false,
	updating: false,
	name: '',
	editingId: null as number | null,
	deleting: false,
});
const deleteConfirm = ref({
	visible: false,
	items: [] as PendingDeleteItem[],
	deleting: false,
});
const buildings = ref<BuildingRow[]>([]);
const selectedBuildingIds = ref<number[]>([]);
const selectedBuilding = ref<BuildingRow | null>(null);

const notify = (
	severity: 'success' | 'warn' | 'error',
	detail: string,
	life = severity === 'success' ? 2000 : 6000,
) => {
	toast.add({
		severity,
		summary:
      severity === 'success' ? 'Başarılı' : severity === 'warn' ? 'Uyarı' : 'Hata',
		detail,
		life,
	});
};

const getFetchErrorStatus = (error: GenericFetchError | DeleteBuildingFetchError) =>
	error.statusCode ?? error.data?.statusCode;

const getFetchErrorMessage = (error: GenericFetchError | DeleteBuildingFetchError) =>
	error.data?.message ?? error.message;

const createInitialProductForm = (): InsertProductForm => ({
	brand: '',
	model_type: '',
	serial_number: null,
	manufacture_year: null,
	unit: '',
	refill_period: 2,
	refill_date: null,
	next_refill_date: null,
	hydrostatic_test_date: null,
	next_hydrostatic_test_date: null,
	current_status: 'active',
	location: null,
	pressure_source: 'Azot(N)',
});

const createInitialLocationForm = (): InsertLocationForm => ({
	room: '',
	location_id: '',
	building_id: 0,
});

const getSelectedFireExtinguisher = () =>
	fireExtinguishers.find(item => item.name === form.product.model_type);

const buildProductPayload = (locationId: number) => {
	const manufactureYear = form.product.manufacture_year
		? formatDateOnlyForApi(
				new Date(form.product.manufacture_year.getFullYear(), 0, 1),
			)
		: null;

	return {
		...form.product,
		...getSelectedFireExtinguisher()?.tecnicDetails,
		location: locationId,
		manufacture_year: manufactureYear,
		refill_date: formatDateOnlyForApi(form.product.refill_date),
		next_refill_date: formatDateOnlyForApi(form.product.next_refill_date),
		hydrostatic_test_date: formatDateOnlyForApi(
			form.product.hydrostatic_test_date,
		),
		next_hydrostatic_test_date: formatDateOnlyForApi(
			form.product.next_hydrostatic_test_date,
		),
	};
};

const blurActiveElement = async () => {
	await nextTick();
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
};

const openDeleteConfirm = (items: PendingDeleteItem[]) => {
	deleteConfirm.value.items = items;
	deleteConfirm.value.visible = true;
};

const deleteBuildingRequest = async (buildingId: number, force = false) => {
	await $fetch('/api/location-buildings', {
		method: 'DELETE',
		body: {
			id: buildingId,
			force,
		},
	});
};

const { error, refresh: refreshBuildings } = await useFetch<BuildingRow[]>(
	'/api/location-buildings',
	{
		onResponse({ response }) {
			if (Array.isArray(response._data)) {
				buildings.value = response._data;
			}
			else {
				console.error('Error fetching data:', error);
			}
		},
	},
);

const refreshBuildingOptions = async () => {
	await refreshBuildings();
	if (selectedBuilding.value) {
		const selected = buildings.value.find(
			item => item.id === selectedBuilding.value?.id,
		);
		selectedBuilding.value = selected ?? null;
	}
	selectedBuildingIds.value = selectedBuildingIds.value.filter(id =>
		buildings.value.some(item => item.id === id),
	);
};

const openBuildingManager = async () => {
	buildingManager.value.modal = true;
	await refreshBuildingOptions();
};

const resetBuildingManagerForm = () => {
	buildingManager.value.name = '';
	buildingManager.value.editingId = null;
};

const closeBuildingManager = () => {
	buildingManager.value.modal = false;
	resetBuildingManagerForm();
};

const startBuildingEdit = (building: BuildingRow) => {
	buildingManager.value.editingId = building.id;
	buildingManager.value.name = building.name;
};

const closeDeleteConfirm = () => {
	deleteConfirm.value.visible = false;
	deleteConfirm.value.items = [];
	deleteConfirm.value.deleting = false;
};

const form = reactive<{
	product: InsertProductForm;
	location: InsertLocationForm;
}>({
	product: createInitialProductForm(),
	location: createInitialLocationForm(),
});

const fireExtinguisherWeightOptions = computed(() => {
	if (!form.product.model_type) return [];
	const item = fireExtinguishers.find(
		f => f.name === form.product.model_type,
	);
	return item ? item.weightOptions : [];
});

const resetForm = () => {
	Object.assign(form.product, createInitialProductForm());
	Object.assign(form.location, createInitialLocationForm());
};

const resetTransientState = () => {
	loading.value = false;
	buildingManager.value.modal = false;
	deleteConfirm.value.visible = false;
};

const saveProduct = async () => {
	try {
		if (!selectedBuilding.value?.id) {
			notify('warn', 'Lütfen önce bir bina seçin.');
			return;
		}

		loading.value = true;
		const locationResponse = await $fetch<LocationRow>('/api/locations', {
			method: 'POST',
			body: {
				location_id: form.location.location_id,
				building_id: selectedBuilding.value.id,
				room: form.location.room,
			},
		});

		if (locationResponse.id) {
			await $fetch<ProductRow>('/api/products', {
				method: 'POST',
				body: buildProductPayload(locationResponse.id),
			});

			notify('success', 'YSC kaydedildi.');
		}
	}
	catch (error) {
		console.error('Error saving product:', error);
		const fetchError = error as GenericFetchError;
		notify(
			'error',
			getFetchErrorStatus(fetchError) === 409
				? 'Bu konum için zaten bir YSC kayıtlı.'
				: getFetchErrorMessage(fetchError)
					|| 'YSC kaydedilirken bir hata oluştu.',
			20000,
		);
	}
	finally {
		loading.value = false;
		resetForm();
		await blurActiveElement();
	}
};

const saveNewBuilding = async () => {
	const buildingName = buildingManager.value.name.trim();
	if (!buildingName) {
		notify('warn', 'Bina adı boş olamaz.');
		return;
	}

	try {
		buildingManager.value.saving = true;
		const response = await $fetch<BuildingRow>('/api/location-buildings', {
			method: 'POST',
			body: {
				name: buildingName,
			},
		});

		if (response) {
			notify('success', 'Bina kaydedildi.');
		}
	}
	catch (error) {
		console.error('Error saving building:', error);
		notify('error', 'Bina kaydedilirken bir hata oluştu.');
	}
	finally {
		resetBuildingManagerForm();
		buildingManager.value.saving = false;
		await refreshBuildingOptions();
	}
};

const updateBuilding = async () => {
	const buildingName = buildingManager.value.name.trim();
	const editingId = buildingManager.value.editingId;

	if (!editingId) {
		notify('warn', 'Lütfen düzenlemek için bir bina seçin.');
		return;
	}

	if (!buildingName) {
		notify('warn', 'Bina adı boş olamaz.');
		return;
	}

	try {
		buildingManager.value.updating = true;
		const response = await $fetch<BuildingRow>('/api/location-buildings', {
			method: 'PUT',
			body: {
				id: editingId,
				name: buildingName,
			},
		});

		if (response) {
			notify('success', 'Bina adı güncellendi.');
		}
	}
	catch (error) {
		console.error('Error updating building:', error);
		const fetchError = error as GenericFetchError;
		notify(
			'error',
			getFetchErrorMessage(fetchError)
			|| 'Bina güncellenirken bir hata oluştu.',
			2500,
		);
	}
	finally {
		resetBuildingManagerForm();
		buildingManager.value.updating = false;
		await refreshBuildingOptions();
	}
};

const deleteBuilding = async (building: BuildingRow, force = false) => {
	try {
		await deleteBuildingRequest(building.id, force);

		notify('success', 'Bina silindi.');

		if (selectedBuilding.value?.id === building.id) {
			selectedBuilding.value = null;
		}

		closeDeleteConfirm();
	}
	catch (error) {
		const fetchError = error as DeleteBuildingFetchError;
		const statusCode = getFetchErrorStatus(fetchError);
		const payload = fetchError?.data?.data;

		if (statusCode === 409 && payload?.requiresConfirmation && !force) {
			openDeleteConfirm([
				{
					building,
					relations: payload.relations ?? null,
				},
			]);
			return;
		}

		notify(
			'error',
			getFetchErrorMessage(fetchError) || 'Bina silinirken bir hata oluştu.',
			2500,
		);
	}
};

const confirmDeleteBuilding = async () => {
	if (!deleteConfirm.value.items.length) {
		return;
	}

	try {
		deleteConfirm.value.deleting = true;
		buildingManager.value.deleting = true;
		for (const item of deleteConfirm.value.items) {
			await deleteBuilding(item.building, true);
		}
		await refreshBuildingOptions();
		selectedBuildingIds.value = [];
	}
	finally {
		buildingManager.value.deleting = false;
		deleteConfirm.value.deleting = false;
	}
};

const deleteSelectedBuildings = async () => {
	if (!selectedBuildingIds.value.length) {
		notify('warn', 'Lütfen silmek için en az bir bina seçin.');
		return;
	}

	const selectedBuildings = buildings.value.filter(item =>
		selectedBuildingIds.value.includes(item.id),
	);

	try {
		buildingManager.value.deleting = true;
		const pendingConfirmItems: PendingDeleteItem[] = [];
		let deletedCount = 0;

		for (const building of selectedBuildings) {
			try {
				await deleteBuildingRequest(building.id);

				if (selectedBuilding.value?.id === building.id) {
					selectedBuilding.value = null;
				}
				deletedCount += 1;
			}
			catch (error) {
				const fetchError = error as DeleteBuildingFetchError;
				const statusCode = getFetchErrorStatus(fetchError);
				const payload = fetchError?.data?.data;

				if (statusCode === 409 && payload?.requiresConfirmation) {
					pendingConfirmItems.push({
						building,
						relations: payload.relations ?? null,
					});
				}
				else {
					notify(
						'error',
						getFetchErrorMessage(fetchError)
						|| 'Bina silinirken bir hata oluştu.',
						2500,
					);
				}
			}
		}

		if (deletedCount > 0) {
			notify('success', `${deletedCount} bina silindi.`);
		}

		await refreshBuildingOptions();

		if (pendingConfirmItems.length) {
			openDeleteConfirm(pendingConfirmItems);
		}
		else {
			selectedBuildingIds.value = [];
		}
	}
	finally {
		buildingManager.value.deleting = false;
	}
};

watch(
	() => [form.product.refill_date, form.product.refill_period],
	([refillDate, refillPeriod]) => {
		if (!refillDate || typeof refillPeriod !== 'number') {
			form.product.next_refill_date = null;
			return;
		}

		const nextRefillDate = new Date(refillDate);
		nextRefillDate.setFullYear(nextRefillDate.getFullYear() + refillPeriod);
		form.product.next_refill_date = nextRefillDate;
	},
);
watch(
	() => form.product.hydrostatic_test_date,
	(newDate) => {
		if (!newDate) {
			form.product.next_hydrostatic_test_date = null;
			return;
		}

		const refillDate = new Date(newDate);
		const nextRefillDate = new Date(refillDate);
		nextRefillDate.setFullYear(
			refillDate.getFullYear() + HYDROSTATIC_TEST_PERIOD,
		);
		form.product.next_hydrostatic_test_date = nextRefillDate;
	},
);

onBeforeRouteLeave(() => {
	resetTransientState();
});
</script>

<template>
	<div class="flex">
		<BaseLoader v-if="loading" />
		<form
			class="mx-auto max-w-[700px] flex-1"
			@submit.prevent
		>
			<h2 class="font-semibold text-2xl mb-8">
				YSC Kayit formu
			</h2>
			<div class="space-y-6 mt-6 w-full">
				<div class="form-row !items-end">
					<div class="form-item">
						<label for="building_area">{{ headerLabels.building_area }}</label>
						<Select
							v-model="selectedBuilding"
							:options="buildings"
							option-label="name"
							placeholder="Bina seçin"
						/>
					</div>
					<div class="form-item">
						<Button
							type="button"
							label="Binalari duzenle"
							severity="secondary"
							outlined
							@click="openBuildingManager"
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="location">Bulunduğu yer</label>
						<InputText
							id="location"
							v-model="form.location.room"
						/>
					</div>
					<div class="form-item">
						<label for="location_id">{{ headerLabels.location_id }}</label>
						<InputText
							id="location_id"
							v-model="form.location.location_id"
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="product-kind">{{ headerLabels.model_type }}</label>
						<Select
							v-model="form.product.model_type"
							:options="fireExtinguishers"
							option-label="name"
							option-value="name"
							placeholder="Tipini seçin"
						/>
					</div>
					<div class="form-item">
						<label for="unit">{{ headerLabels.unit }}</label>
						<Select
							v-model="form.product.unit"
							:options="fireExtinguisherWeightOptions"
							placeholder="Agirlik seçin"
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="working_pressure_bar">{{ headerLabels.brand }}</label>
						<InputText
							id="brand"
							v-model="form.product.brand"
						/>
					</div>
					<div class="form-item">
						<label for="current_status">{{
							headerLabels.current_status
						}}</label>
						<Select
							id="current_status"
							v-model="form.product.current_status"
							:options="productStatusOptions"
							option-label="label"
							option-value="value"
							placeholder="Durum seçin"
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="serial_number">{{ headerLabels.serial_number }}</label>
						<InputNumber
							id="serial_number"
							v-model="form.product.serial_number"
							:use-grouping="false"
							fluid
						/>
					</div>
					<div class="form-item">
						<label for="manufacture_year">{{
							headerLabels.manufacture_year
						}}</label>
						<DatePicker
							id="manufacture_year"
							v-model="form.product.manufacture_year"
							view="year"
							date-format="yy"
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="refill_period">{{ headerLabels.refill_period }}</label>
						<Select
							id="refill_period"
							v-model="form.product.refill_period"
							:options="refillPeriodOptions"
							option-label="label"
							option-value="value"
							placeholder="Yeniden dolum periyodu secin"
						/>
						<!-- <InputNumber
              id="refill_period"
              v-model="form.product.refill_period"
              :use-grouping="false"
              fluid
            /> -->
					</div>
					<div class="form-item">
						<label for="refill_date">{{ headerLabels.refill_date }}</label>
						<DatePicker
							id="refill_date"
							v-model="form.product.refill_date"
							date-format="dd/mm/yy"
						/>
						<!-- <InputText
							id="refill_date"
							v-model="form.product.refill_date"
						/> -->
					</div>
					<div class="form-item">
						<label for="next_refill_date">{{
							headerLabels.next_refill_date
						}}</label>
						<DatePicker
							id="next_refill_date"
							v-model="form.product.next_refill_date"
							date-format="dd/mm/yy"
							readonly
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="hydrostatic_test_date">{{
							headerLabels.hydrostatic_test_date
						}}</label>
						<DatePicker
							id="hydrostatic_test_date"
							v-model="form.product.hydrostatic_test_date"
							date-format="dd/mm/yy"
							show-button-bar
						/>
					</div>
					<div class="form-item">
						<label for="next_hydrostatic_test_date">{{
							headerLabels.next_hydrostatic_test_date
						}}</label>
						<DatePicker
							id="next_hydrostatic_test_date"
							v-model="form.product.next_hydrostatic_test_date"
							date-format="dd/mm/yy"
							readonly
						/>
					</div>
				</div>
			</div>
			<Button
				label="Kaydet"
				type="button"
				class="w-full mt-8"
				size="large"
				@click="saveProduct"
			/>
		</form>
		<Dialog
			v-model:visible="buildingManager.modal"
			modal
			header="Binalari duzenle"
			:style="{ width: '32rem' }"
		>
			<span class="text-surface-500 dark:text-surface-400 block mb-6">
				Bu ekrandan yeni bina ekleyebilir, varolan binaları yeniden
				adlandırabilir ve silebilirsin.
			</span>
			<div
				v-if="buildingManager.editingId"
				class="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
			>
				Düzenleme modu açık. Kaydı güncelledikten sonra istersen yeni bina
				eklemeye dönebilirsin.
			</div>
			<div class="form-item mb-4">
				<label for="building-name">Bina adi</label>
				<InputText
					id="building-name"
					v-model="buildingManager.name"
				/>
			</div>
			<div class="flex justify-end gap-2 mb-8">
				<Button
					v-if="buildingManager.editingId"
					type="button"
					label="Guncelle"
					:loading="buildingManager.updating"
					:disabled="
						buildingManager.saving
							|| buildingManager.updating
							|| buildingManager.deleting
					"
					@click="updateBuilding"
				/>
				<Button
					type="button"
					label="Yeni bina kaydet"
					:loading="buildingManager.saving"
					:disabled="
						buildingManager.saving
							|| buildingManager.updating
							|| buildingManager.deleting
					"
					@click="saveNewBuilding"
				/>
				<Button
					v-if="buildingManager.editingId"
					type="button"
					label="Vazgec"
					severity="secondary"
					text
					:disabled="
						buildingManager.saving
							|| buildingManager.updating
							|| buildingManager.deleting
					"
					@click="resetBuildingManagerForm"
				/>
			</div>
			<div class="border-t border-gray-200 pt-6">
				<h3 class="font-semibold text-base mb-4">
					Mevcut binalar
				</h3>
				<p
					v-if="!buildings.length"
					class="text-surface-500 text-sm"
				>
					Kayıtlı bina bulunamadı.
				</p>
				<div
					v-else
					class="space-y-4"
				>
					<div class="space-y-2">
						<div
							v-for="building in buildings"
							:key="building.id"
							class="flex items-center justify-between gap-3 rounded border border-gray-200 px-3 py-2"
						>
							<span class="truncate text-sm font-medium">{{
								building.name
							}}</span>
							<Button
								type="button"
								label="Duzenle"
								severity="secondary"
								text
								size="small"
								:disabled="
									buildingManager.saving
										|| buildingManager.updating
										|| buildingManager.deleting
								"
								@click="startBuildingEdit(building)"
							/>
						</div>
					</div>
					<MultiSelect
						v-model="selectedBuildingIds"
						:options="buildings"
						option-label="name"
						option-value="id"
						display="chip"
						filter
						placeholder="Silmek için bina seçin"
						class="w-full"
						:disabled="
							buildingManager.saving
								|| buildingManager.updating
								|| buildingManager.deleting
						"
					/>
					<div class="flex justify-end mb-12">
						<Button
							type="button"
							label="Secili binalari sil"
							severity="danger"
							:loading="buildingManager.deleting"
							:disabled="
								buildingManager.saving
									|| buildingManager.updating
									|| buildingManager.deleting
									|| !selectedBuildingIds.length
							"
							@click="deleteSelectedBuildings"
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2">
				<Button
					type="button"
					label="Kapat"
					severity="secondary"
					@click="closeBuildingManager"
				/>
			</div>
		</Dialog>
		<Dialog
			v-model:visible="deleteConfirm.visible"
			modal
			header="Silme onayı"
			:style="{ width: '30rem' }"
			:closable="!deleteConfirm.deleting"
		>
			<span class="text-surface-700 block mb-4">
				Seçili binalardan bazılarına bağlı kayıtlar var. Onaylarsan bu veriler
				de kalıcı olarak silinecek.
			</span>
			<ul class="list-disc pl-5 text-sm text-surface-600 mb-6">
				<li
					v-for="item in deleteConfirm.items"
					:key="item.building.id"
				>
					<b>{{ item.building.name }}</b>
					<span v-if="item.relations">
						({{ item.relations.locations }} konum,
						{{ item.relations.products }} YSC,
						{{ item.relations.transactions }} işlem,
						{{ item.relations.fillRecords }} dolum,
						{{ item.relations.inspections }} kontrol)
					</span>
				</li>
			</ul>
			<div class="flex justify-end gap-2">
				<Button
					type="button"
					label="Vazgeç"
					severity="secondary"
					:disabled="deleteConfirm.deleting"
					@click="closeDeleteConfirm"
				/>
				<Button
					type="button"
					label="Onayla ve sil"
					severity="danger"
					:loading="deleteConfirm.deleting"
					@click="confirmDeleteBuilding"
				/>
			</div>
		</Dialog>
	</div>
</template>

<style lang="postcss"></style>
