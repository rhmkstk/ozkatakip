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
	editingName: '',
	editingId: null as number | null,
	deleting: false,
});
const deleteConfirm = ref({
	visible: false,
	items: [] as PendingDeleteItem[],
	deleting: false,
});
const buildings = ref<BuildingRow[]>([]);
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
};

const openBuildingManager = async () => {
	buildingManager.value.modal = true;
	await refreshBuildingOptions();
};

const resetBuildingEdit = () => {
	buildingManager.value.editingName = '';
	buildingManager.value.editingId = null;
};

const resetBuildingManagerForm = () => {
	buildingManager.value.name = '';
	resetBuildingEdit();
};

const closeBuildingManager = () => {
	buildingManager.value.modal = false;
	resetBuildingManagerForm();
};

const startBuildingEdit = (building: BuildingRow) => {
	buildingManager.value.editingId = building.id;
	buildingManager.value.editingName = building.name;
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
		buildingManager.value.name = '';
		buildingManager.value.saving = false;
		await refreshBuildingOptions();
	}
};

const updateBuilding = async () => {
	const buildingName = buildingManager.value.editingName.trim();
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
		resetBuildingEdit();
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
		if (buildingManager.value.editingId === building.id) {
			resetBuildingEdit();
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
	}
	finally {
		buildingManager.value.deleting = false;
		deleteConfirm.value.deleting = false;
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
	<div>
		<BaseLoader v-if="loading" />
		<PageHeader
			title="Yeni YSC kaydı"
			eyebrow="Envanter"
		/>
		<form
			class="mx-auto max-w-[900px]"
			@submit.prevent
		>
			<div class="app-panel w-full divide-y divide-slate-200 px-5 sm:px-7">
				<section class="py-6">
					<div class="mb-5">
						<p class="text-base font-bold text-slate-900">
							Konum bilgileri
						</p>
						<p class="mt-1 text-sm text-slate-500">
							YSC'nin sahada bulunduğu bina ve noktayı tanımlayın.
						</p>
					</div>
					<div class="space-y-5">
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
									label="Binaları düzenle"
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
					</div>
				</section>

				<section class="py-7">
					<div class="mb-5">
						<p class="text-base font-bold text-slate-900">
							Ekipman bilgileri
						</p>
						<p class="mt-1 text-sm text-slate-500">
							Tip, kapasite ve kimlik bilgilerini girin.
						</p>
					</div>
					<div class="space-y-5">
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
									placeholder="Ağırlık seçin"
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
					</div>
				</section>

				<section class="py-7">
					<div class="mb-5">
						<p class="text-base font-bold text-slate-900">
							Periyodik tarihler
						</p>
						<p class="mt-1 text-sm text-slate-500">
							Dolum ve hidrostatik test planını oluşturun.
						</p>
					</div>
					<div class="space-y-5">
						<div class="form-row">
							<div class="form-item">
								<label for="refill_period">{{ headerLabels.refill_period }}</label>
								<Select
									id="refill_period"
									v-model="form.product.refill_period"
									:options="refillPeriodOptions"
									option-label="label"
									option-value="value"
									placeholder="Yeniden dolum periyodu seçin"
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
				</section>
			</div>
			<div class="sticky bottom-0 mt-5 flex justify-end border-t border-slate-200 bg-[#f3f5f7]/95 py-4 backdrop-blur">
				<Button
					label="YSC kaydını oluştur"
					icon="ri-save-line"
					type="button"
					size="large"
					@click="saveProduct"
				/>
			</div>
		</form>
		<Dialog
			v-model:visible="buildingManager.modal"
			modal
			:style="{ width: '38rem' }"
		>
			<template #header>
				<AppDialogHeader
					title="Binaları düzenle"
					subtitle="Bina ve alan adlarını buradan ekleyebilir, güncelleyebilir veya silebilirsiniz."
				/>
			</template>
			<section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
				<div class="mb-2 flex items-center justify-between">
					<label
						for="building-name"
						class="text-sm font-semibold text-slate-700"
					>
						Yeni bina veya alan
					</label>
				</div>
				<div class="flex gap-2">
					<InputText
						id="building-name"
						v-model="buildingManager.name"
						class="min-w-0 flex-1"
						placeholder="Örn. İdari bina"
					/>
					<Button
						type="button"
						label="Ekle"
						icon="ri-add-line"
						:loading="buildingManager.saving"
						:disabled="buildingManager.saving || buildingManager.updating || buildingManager.deleting || !buildingManager.name.trim()"
						@click="saveNewBuilding"
					/>
				</div>
			</section>

			<section class="mt-6">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="text-sm font-bold text-slate-900">
						Kayıtlı binalar
					</h3>
					<span class="text-xs text-slate-400">{{ buildings.length }} kayıt</span>
				</div>
				<p
					v-if="!buildings.length"
					class="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500"
				>
					Kayıtlı bina bulunamadı.
				</p>
				<div
					v-else
					class="max-h-64 space-y-2 overflow-y-auto pr-1"
				>
					<div
						v-for="building in buildings"
						:key="building.id"
						class="rounded-lg border border-slate-200 px-3 py-2.5"
					>
						<div
							v-if="buildingManager.editingId === building.id"
							class="flex items-center gap-2"
						>
							<InputText
								v-model="buildingManager.editingName"
								autofocus
								class="min-w-0 flex-1"
								aria-label="Bina adı"
								@keydown.enter="updateBuilding"
								@keydown.esc="resetBuildingEdit"
							/>
							<Button
								type="button"
								icon="ri-check-line"
								aria-label="Değişikliği kaydet"
								title="Kaydet"
								size="small"
								:loading="buildingManager.updating"
								:disabled="!buildingManager.editingName.trim()"
								@click="updateBuilding"
							/>
							<Button
								type="button"
								icon="ri-close-line"
								aria-label="Düzenlemeyi iptal et"
								title="İptal"
								severity="secondary"
								text
								size="small"
								:disabled="buildingManager.updating"
								@click="resetBuildingEdit"
							/>
						</div>
						<div
							v-else
							class="flex items-center gap-3"
						>
							<span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><i class="ri-building-line" /></span>
							<span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{{ building.name }}</span>
							<Button
								type="button"
								icon="ri-edit-line"
								aria-label="Düzenle"
								title="Düzenle"
								severity="secondary"
								text
								size="small"
								:disabled="buildingManager.saving || buildingManager.updating || buildingManager.deleting || Boolean(buildingManager.editingId)"
								@click="startBuildingEdit(building)"
							/>
							<Button
								type="button"
								icon="ri-delete-bin-line"
								aria-label="Sil"
								title="Sil"
								severity="danger"
								text
								size="small"
								:disabled="buildingManager.saving || buildingManager.updating || buildingManager.deleting || Boolean(buildingManager.editingId)"
								@click="openDeleteConfirm([{ building, relations: null }])"
							/>
						</div>
					</div>
				</div>
			</section>
			<template #footer>
				<Button
					type="button"
					label="Kapat"
					severity="secondary"
					@click="closeBuildingManager"
				/>
			</template>
		</Dialog>
		<Dialog
			v-model:visible="deleteConfirm.visible"
			modal
			header="Silme onayı"
			:style="{ width: '30rem' }"
			:closable="!deleteConfirm.deleting"
		>
			<span class="text-surface-700 mb-4 block">
				Aşağıdaki binayı silmek üzeresiniz. Binaya bağlı kayıtlar varsa onlar da
				kalıcı olarak silinecek. Bu işlem geri alınamaz.
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
