<script setup lang="ts">
import { headerLabels, fireExtinguishers } from '@/constants';
import type { Tables, TablesInsert } from '~/types/database.types';

const HYDROSTATIC_TEST_PERIOD = 4; // years
type BuildingRow = Tables<'location_buildings'>;
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

const toast = useToast();
const productStatusOptions = [
	{ label: 'Aktif', value: 'active' },
	{ label: 'Arızalı', value: 'damaged' },
	{ label: 'Kayıp', value: 'lost' },
	{ label: 'Yedek', value: 'spare' },
];
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
	name: '',
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

const closeDeleteConfirm = () => {
	deleteConfirm.value.visible = false;
	deleteConfirm.value.items = [];
	deleteConfirm.value.deleting = false;
};

const form = reactive<{
	product: TablesInsert<'products'>;
	location: TablesInsert<'locations'>;
}>({
	product: {
		brand: '',
		model_type: '',
		serial_number: 0,
		manufacture_year: '',
		unit: '',
		refill_period: 2,
		refill_date: null,
		next_refill_date: null,
		hydrostatic_test_date: null,
		next_hydrostatic_test_date: null,
		current_status: 'active',
		location: null,
	},
	location: {
		room: '',
		location_id: '',
		building_id: 0,
	},
});

const fireExtinguisherWeightOptions = computed(() => {
	if (!form.product.model_type) return [];
	const item = fireExtinguishers.find(
		f => f.name === form.product.model_type,
	);
	return item ? item.weightOptions : [];
});

const resetForm = () => {
	form.product = {
		brand: '',
		model_type: '',
		serial_number: 0,
		manufacture_year: '',
		unit: '',
		refill_period: 2,
		refill_date: null,
		next_refill_date: null,
		hydrostatic_test_date: null,
		next_hydrostatic_test_date: null,
		current_status: 'active',
		location: null,
		pressure_source: 'Azot(N)',
	};
	form.location = {
		room: '',
		location_id: '',
		building_id: 0,
	};
};

const saveProduct = async () => {
	try {
		loading.value = true;
		const locationResponse = await $fetch('/api/locations', {
			method: 'POST',
			body: {
				location_id: form.location.location_id,
				building_id: selectedBuilding.value?.id,
				room: form.location.room,
			},
		});

		if (locationResponse.id) {
			const item = fireExtinguishers.find(
				f => f.name === form.product.model_type,
			);
			const year = new Date(form.product.manufacture_year).getFullYear();
			await $fetch('/api/products', {
				method: 'POST',
				body: {
					...form.product,
					...item?.tecnicDetails,
					location: locationResponse.id,
					manufacture_year: new Date(`${year}-01-01`),
				},
			});

			toast.add({
				severity: 'success',
				summary: 'Başarılı',
				detail: 'YSC kaydedildi.',
				life: 2000,
			});
		}
	}
	catch (error) {
		console.error('Error saving product:', error);
		const fetchError = error as {
			statusCode?: number;
			data?: { statusCode?: number; message?: string };
			message?: string;
		};
		const statusCode = fetchError?.statusCode ?? fetchError?.data?.statusCode;
		const message = fetchError?.data?.message ?? fetchError?.message;
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail:
				statusCode === 409
					? 'Bu konum için zaten bir YSC kayıtlı.'
					: message || 'YSC kaydedilirken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		loading.value = false;

		resetForm();
	}
};

const saveNewBuilding = async () => {
	const buildingName = buildingManager.value.name.trim();
	if (!buildingName) {
		toast.add({
			severity: 'warn',
			summary: 'Uyarı',
			detail: 'Bina adı boş olamaz.',
			life: 2000,
		});
		return;
	}

	try {
		buildingManager.value.saving = true;
		const response = await $fetch('/api/location-buildings', {
			method: 'POST',
			body: {
				name: buildingName,
			},
		});

		if (response) {
			toast.add({
				severity: 'success',
				summary: 'Başarılı',
				detail: 'Bina kaydedildi.',
				life: 2000,
			});
		}
	}
	catch (error) {
		console.error('Error saving building:', error);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Bina kaydedilirken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		buildingManager.value.name = '';
		buildingManager.value.saving = false;
		await refreshBuildingOptions();
	}
};

const deleteBuilding = async (building: BuildingRow, force = false) => {
	try {
		await $fetch('/api/location-buildings', {
			method: 'DELETE',
			body: {
				id: building.id,
				force,
			},
		});

		toast.add({
			severity: 'success',
			summary: 'Başarılı',
			detail: 'Bina silindi.',
			life: 2000,
		});

		if (selectedBuilding.value?.id === building.id) {
			selectedBuilding.value = null;
		}

		closeDeleteConfirm();
	}
	catch (error) {
		const fetchError = error as {
			statusCode?: number;
			data?: {
				statusCode?: number;
				message?: string;
				data?: {
					requiresConfirmation?: boolean;
					relations?: BuildingRelations;
				};
			};
			message?: string;
		};

		const statusCode = fetchError?.statusCode ?? fetchError?.data?.statusCode;
		const message = fetchError?.data?.message ?? fetchError?.message;
		const payload = fetchError?.data?.data;

		if (
			statusCode === 409
			&& payload?.requiresConfirmation
			&& !force
		) {
			deleteConfirm.value.items = [
				{
					building,
					relations: payload.relations ?? null,
				},
			];
			deleteConfirm.value.visible = true;
			return;
		}

		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: message || 'Bina silinirken bir hata oluştu.',
			life: 2500,
		});
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
		toast.add({
			severity: 'warn',
			summary: 'Uyarı',
			detail: 'Lütfen silmek için en az bir bina seçin.',
			life: 2000,
		});
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
				await $fetch('/api/location-buildings', {
					method: 'DELETE',
					body: {
						id: building.id,
						force: false,
					},
				});

				if (selectedBuilding.value?.id === building.id) {
					selectedBuilding.value = null;
				}
				deletedCount += 1;
			}
			catch (error) {
				const fetchError = error as {
					statusCode?: number;
					data?: {
						statusCode?: number;
						message?: string;
						data?: {
							requiresConfirmation?: boolean;
							relations?: BuildingRelations;
						};
					};
					message?: string;
				};
				const statusCode = fetchError?.statusCode ?? fetchError?.data?.statusCode;
				const payload = fetchError?.data?.data;

				if (
					statusCode === 409
					&& payload?.requiresConfirmation
				) {
					pendingConfirmItems.push({
						building,
						relations: payload.relations ?? null,
					});
				}
				else {
					toast.add({
						severity: 'error',
						summary: 'Hata',
						detail: fetchError?.data?.message ?? fetchError?.message ?? 'Bina silinirken bir hata oluştu.',
						life: 2500,
					});
				}
			}
		}

		if (deletedCount > 0) {
			toast.add({
				severity: 'success',
				summary: 'Başarılı',
				detail: `${deletedCount} bina silindi.`,
				life: 2000,
			});
		}

		await refreshBuildingOptions();

		if (pendingConfirmItems.length) {
			deleteConfirm.value.items = pendingConfirmItems;
			deleteConfirm.value.visible = true;
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
		if (!refillDate) {
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
		if (newDate) {
			const refillDate = new Date(newDate);
			const nextRefillDate = new Date(refillDate);
			nextRefillDate.setFullYear(
				refillDate.getFullYear() + HYDROSTATIC_TEST_PERIOD,
			);
			form.product.next_hydrostatic_test_date = nextRefillDate;
		}
	},
);
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
				type="submit"
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
				Bu ekrandan yeni bina ekleyebilir, varolan binaları silebilirsin.
			</span>
			<div class="form-item mb-4">
				<label for="building-name">Bina adi</label>
				<InputText
					id="building-name"
					v-model="buildingManager.name"
				/>
			</div>
			<div class="flex justify-end gap-2 mb-8">
				<Button
					type="button"
					label="Yeni bina kaydet"
					:loading="buildingManager.saving"
					:disabled="buildingManager.saving || buildingManager.deleting"
					@click="saveNewBuilding"
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
					<MultiSelect
						v-model="selectedBuildingIds"
						:options="buildings"
						option-label="name"
						option-value="id"
						display="chip"
						filter
						placeholder="Silmek için bina seçin"
						class="w-full"
						:disabled="buildingManager.saving || buildingManager.deleting"
					/>
					<div class="flex justify-end mb-12">
						<Button
							type="button"
							label="Secili binalari sil"
							severity="danger"
							:loading="buildingManager.deleting"
							:disabled="buildingManager.saving || buildingManager.deleting || !selectedBuildingIds.length"
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
					@click="buildingManager.modal = false"
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
				Seçili binalardan bazılarına bağlı kayıtlar var.
				Onaylarsan bu veriler de kalıcı olarak silinecek.
			</span>
			<ul class="list-disc pl-5 text-sm text-surface-600 mb-6">
				<li
					v-for="item in deleteConfirm.items"
					:key="item.building.id"
				>
					<b>{{ item.building.name }}</b>
					<span v-if="item.relations">
						({{ item.relations.locations }} konum, {{ item.relations.products }} YSC, {{ item.relations.transactions }} işlem, {{ item.relations.fillRecords }} dolum, {{ item.relations.inspections }} kontrol)
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
