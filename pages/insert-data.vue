<script setup lang="ts">
import { headerLabels, fireExtinguishers } from '@/constants';
import type { TablesInsert } from '~/types/database.types';

const HYDROSTATIC_TEST_PERIOD = 4; // years
const toast = useToast();
const productStatusOptions = [
	{ label: 'Aktif', value: 'active' },
	{ label: 'Arızalı', value: 'damaged' },
	{ label: 'Kayıp', value: 'lost' },
	{ label: 'Yedek', value: 'spare' },
];

const loading = ref(false);
const newBuilding = ref({
	loading: false,
	modal: false,
	name: '',
});
const buildings = ref([]);
const selectedBuilding = ref<TablesInsert<'locations'> | null>(null);

const { error, refresh: refreshBuildings } = await useFetch('/api/location-buildings', {
	onResponse({ response }) {
		if (response._data) {
			buildings.value = response._data;
		}
		else {
			console.error('Error fetching data:', error);
		}
	},
});

const form = reactive<{ product: TablesInsert<'products'>; location: TablesInsert<'locations'> }>({
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
	const item = fireExtinguishers.find(f => f.name === form.product.model_type);
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
		current_status: 'aktif',
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
			const item = fireExtinguishers.find(f => f.name === form.product.model_type);
			const year = form.product.manufacture_year.getFullYear();
			const res = await $fetch('/api/products', {
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
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'YSC kaydedilirken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		loading.value = false;

		resetForm();
	}
};

const saveNewBuilding = async () => {
	try {
		newBuilding.value.loading = true;
		const response = await $fetch('/api/location-buildings', {
			method: 'POST',
			body: {
				name: newBuilding.value.name,
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
		console.error('Error saving product:', error);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Bina kaydedilirken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		newBuilding.value.name = '';
		newBuilding.value.loading = false;
		newBuilding.value.modal = false;
		await refreshBuildings();
	}
};

watch(() => form.product.refill_date, (newDate) => {
	if (newDate) {
		const refillDate = new Date(newDate);
		const nextRefillDate = new Date(refillDate);
		nextRefillDate.setFullYear(refillDate.getFullYear() + form.product.refill_period);
		form.product.next_refill_date = nextRefillDate;
	}
});
watch(() => form.product.hydrostatic_test_date, (newDate) => {
	if (newDate) {
		const refillDate = new Date(newDate);
		const nextRefillDate = new Date(refillDate);
		nextRefillDate.setFullYear(refillDate.getFullYear() + HYDROSTATIC_TEST_PERIOD);
		form.product.next_hydrostatic_test_date = nextRefillDate;
	}
});
</script>

<template>
	<div class="flex">
		<BaseLoader v-if="loading" />
		<form
			class="mx-auto max-w-[700px] flex-1"
			@submit.prevent
		>
			<h2 class="font-semibold text-2xl mb-12">
				YSC Kayit formu
			</h2>
			<Button
				label="Yeni bina olustur"
				severity="secondary"
				outlined
				@click="newBuilding.modal = true"
			/>
			<div class="space-y-4 mt-6 w-full">
				<div class="form-row">
					<div class="form-item">
						<label for="building_area">{{
							headerLabels.building_area
						}}</label>
						<Select
							v-model="selectedBuilding"
							:options="buildings"
							option-label="name"
							placeholder="Bina seçin"
						/>
					</div>
					<div class="form-item">
						<label for="location">Bulundugu oda</label>
						<InputText
							id="location"
							v-model="form.location.room"
						/>
					</div>
					<div class="form-item">
						<label for="location_id">{{
							headerLabels.location_id
						}}</label>
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
						<label for="current_status">{{ headerLabels.current_status }}</label>
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
						<label for="refill_date">{{
							headerLabels.refill_date
						}}</label>
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
						<label for="next_refill_date">{{ headerLabels.next_refill_date }}</label>
						<DatePicker
							id="next_refill_date"
							v-model="form.product.next_refill_date"
							date-format="dd/mm/yy"
							readonly
						/>
					</div>
					<div class="form-item">
						<label for="refill_period">{{ headerLabels.refill_period }}</label>
						<InputNumber
							id="refill_period"
							v-model="form.product.refill_period"
							:use-grouping="false"
							fluid
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
			v-model:visible="newBuilding.modal"
			modal
			header="Yeni bina oluştur"
			:style="{ width: '25rem' }"
		>
			<BaseLoader v-if="newBuilding.loading" />
			<span class="text-surface-500 dark:text-surface-400 block mb-8">
				Bina oluşturduktan sonra o binaya bağlı olarak tam konumu belirleyebilirsin.
			</span>
			<div class="form-item mb-12">
				<label for="building-name">Bina adi</label>
				<InputText
					id="building-name"
					v-model="newBuilding.name"
				/>
			</div>
			<div class="flex justify-end gap-2">
				<Button
					type="button"
					label="Vazgeç"
					severity="secondary"
					@click="newBuilding.modal = false"
				/>
				<Button
					type="button"
					label="Kaydet"
					@click="saveNewBuilding"
				/>
			</div>
		</Dialog>
	</div>
</template>

<style lang="postcss">
</style>
