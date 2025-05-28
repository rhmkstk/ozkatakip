<script setup lang="ts">
import { headerLabels } from '@/constants';
import type { TablesInsert } from '~/types/database.types';

type ProductKinds = 'kkt' | 'co2' | 'bio';
type KindList = {
	name: string;
	value: ProductKinds;
}[];
const toast = useToast();
const loading = ref(false);
const selectedKind = ref<{ name: string; value: ProductKinds }>({
	name: 'Kuru kimyevi tozlu',
	value: 'kkt',
});
const kindList: KindList = [
	{ name: 'Kuru kimyevi tozlu', value: 'kkt' },
	{ name: 'Karbondioksit gazli', value: 'co2' },
	{ name: 'Bioversal kopuklu', value: 'bio' },
];

const form = reactive<{ product: TablesInsert<'products'>; location: TablesInsert<'locations'> }>({
	product: {
		brand: '',
		model_type: '',
		serial_number: 0,
		manufacture_year: '',
		refill_period: 2,
		refill_date: null,
		next_refill_date: null,
		hydrostatic_test_date: null,
		next_hydrostatic_test_date: null,
		current_status: 'aktif',
		location: null,
		pressure_source: 'Azot(N)',
	},
	location: {
		location: '',
		building_area: '',
		location_id: '',
	},
});

const staticInfos = {
	kkt: {
		pressure_source: 'Azot(N)',
		manometer_scale_bar: '28',
		test_pressure_bar: '27',
		safety_valve_setting_pressure_bar: '24 - 27',
		working_pressure_bar: '17 - 18',
		working_temperature_celsius: '-30 / +60',
	},
	co2: {
		pressure_source: 'Karbondioksit(CO2)',
		manometer_scale_bar: '',
		test_pressure_bar: '250',
		safety_valve_setting_pressure_bar: '190',
		working_pressure_bar: '150',
		working_temperature_celsius: '-30 / +60',
	},
	bio: {
		pressure_source: 'Azot(N)',
		manometer_scale_bar: '28',
		test_pressure_bar: '27',
		safety_valve_setting_pressure_bar: '24 - 27',
		working_pressure_bar: '17 - 18',
		working_temperature_celsius: '-20 / +60',
	},
};

const resetForm = () => {
	form.product = {
		brand: '',
		model_type: '',
		serial_number: 0,
		manufacture_year: '',
		refill_period: 2,
		refill_date: '',
		next_refill_date: '',
		hydrostatic_test_date: '',
		next_hydrostatic_test_date: '',
		current_status: 'aktif',
		location: null,
	};
	form.location = {
		location: '',
		building_area: '',
		location_id: '',
	};
	selectedKind.value = kindList[0];
};

const saveProduct = async () => {
	try {
		loading.value = true;
		const locationResponse = await $fetch('/api/locations', {
			method: 'POST',
			body: {
				building_area: form.location.building_area,
				location: form.location.location,
				location_id: form.location.location_id,
			},
		});
		console.log('Location response:', locationResponse);

		if (locationResponse.id) {
			await $fetch('/api/products', {
				method: 'POST',
				body: {
					...staticInfos[selectedKind.value.value],
					...form.product,
					location: locationResponse.id,
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
		console.log('Form resetleniyor!!');
		loading.value = false;
		resetForm();
	}
};
</script>

<template>
	<div class="flex">
		<BaseLoader v-if="loading" />
		<Toast />
		<form
			class="mx-auto max-w-[800px] flex-1"
			@submit.prevent
		>
			<div class="space-y-4 mt-6 w-full">
				<div class="form-row">
					<div class="form-item">
						<label for="building_area">{{
							headerLabels.building_area
						}}</label>
						<InputText
							id="building_area"
							v-model="form.location.building_area"
						/>
					</div>
					<div class="form-item">
						<label for="location">{{
							headerLabels.location
						}}</label>
						<InputText
							id="location"
							v-model="form.location.location"
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
						<label for="product-kind">Urun tipini sec</label>
						<Select
							v-model="selectedKind"
							:options="kindList"
							option-label="name"
							placeholder="Tipini seçin"
						/>
					</div>
					<div class="form-item">
						<label for="current_status">{{ headerLabels.current_status }}</label>
						<InputText
							id="current_status"
							v-model="form.product.current_status"
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="pressure_source">{{
							headerLabels.pressure_source
						}}</label>
						<InputText
							id="pressure_source"
							:value="staticInfos[selectedKind.value].pressure_source"
							readonly
						/>
					</div>
					<div class="form-item">
						<label for="monometer_scale_bar">{{
							headerLabels.monometer_scale_bar
						}}</label>
						<InputText
							id="monometer_scale_bar"
							:value="staticInfos[selectedKind.value].monometer_scale_bar"
							readonly
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="test_pressure_bar">{{
							headerLabels.test_pressure_bar
						}}</label>
						<InputText
							id="test_pressure_bar"
							:value="staticInfos[selectedKind.value].test_pressure_bar"
							readonly
						/>
					</div>
					<div class="form-item">
						<label for="safety_valve_setting_pressure_bar">{{
							headerLabels.safety_valve_setting_pressure_bar
						}}</label>
						<InputText
							id="safety_valve_setting_pressure_bar"
							:value="
								staticInfos[selectedKind.value]
									.safety_valve_setting_pressure_bar
							"
							readonly
						/>
					</div>
				</div>
				<div class="form-row">
					<div class="form-item">
						<label for="working_pressure_bar">{{
							headerLabels.working_pressure_bar
						}}</label>
						<InputText
							id="working_pressure_bar"
							:value="staticInfos[selectedKind.value].working_pressure_bar"
							readonly
						/>
					</div>
					<div class="form-item">
						<label for="working_temperature_celsius">{{
							headerLabels.working_temperature_celsius
						}}</label>
						<InputText
							id="working_temperature_celsius"
							:value="
								staticInfos[selectedKind.value].working_temperature_celsius
							"
							readonly
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
						<label for="working_pressure_bar">{{
							headerLabels.model_type
						}}</label>
						<InputText
							id="model_type"
							v-model="form.product.model_type"
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
							date-format="dd/mm/yy"
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
						/>
					</div>
				</div>
			</div>
			<Button
				label="Kaydet"
				type="submit"
				class="w-full mt-8"
				@click="saveProduct"
			/>
		</form>
	</div>
</template>

<style lang="postcss">
</style>
