<script setup lang="ts">
import { fireExtinguishers, headerLabels } from '~/constants';
import type { Tables } from '~/types/database.types';

type ProductWithLocation = Tables<'products'> & {
	locations: Tables<'locations'> | null;
};

const props = defineProps<{
	visible: boolean;
	product?: ProductWithLocation | null;
}>();
const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'updated'): void;
}>();

const toast = useToast();
const editProductSaving = ref(false);
const editInitialSnapshot = ref('');
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
const editForm = reactive({
	id: 0,
	brand: '',
	model_type: '',
	serial_number: null as number | null,
	manufacture_year: null as Date | null,
	unit: '',
	refill_period: 2,
	refill_date: null as Date | null,
	next_refill_date: null as Date | null,
	hydrostatic_test_date: null as Date | null,
	next_hydrostatic_test_date: null as Date | null,
	current_status: 'active',
	pressure_source: '',
	working_pressure_bar: '',
	manometer_scale_bar: null as number | null,
	test_pressure_bar: null as number | null,
	safety_valve_setting_pressure_bar: '',
	working_temperature_celsius: '',
	locations: {
		building: '',
		room: '',
		location_id: '',
	},
});

const visibleModel = computed({
	get: () => props.visible,
	set: value => emit('update:visible', value),
});

const toDateOrNull = (value: string | Date | null | undefined) => {
	if (!value) return null;
	return parseStoredDate(value);
};

const resetEditForm = () => {
	editForm.id = 0;
	editForm.brand = '';
	editForm.model_type = '';
	editForm.serial_number = null;
	editForm.manufacture_year = null;
	editForm.unit = '';
	editForm.refill_period = 2;
	editForm.refill_date = null;
	editForm.next_refill_date = null;
	editForm.hydrostatic_test_date = null;
	editForm.next_hydrostatic_test_date = null;
	editForm.current_status = 'active';
	editForm.pressure_source = '';
	editForm.working_pressure_bar = '';
	editForm.manometer_scale_bar = null;
	editForm.test_pressure_bar = null;
	editForm.safety_valve_setting_pressure_bar = '';
	editForm.working_temperature_celsius = '';
	editForm.locations = { building: '', room: '', location_id: '' };
	editInitialSnapshot.value = '';
};

const toNullableString = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length ? trimmed : null;
};

const buildEditPayload = () => {
	const manufactureYear = editForm.manufacture_year
		? formatDateOnlyForApi(new Date(editForm.manufacture_year.getFullYear(), 0, 1))
		: null;
	return {
		id: editForm.id,
		brand: editForm.brand,
		model_type: editForm.model_type,
		serial_number: editForm.serial_number,
		manufacture_year: manufactureYear,
		unit: editForm.unit,
		refill_period: editForm.refill_period,
		refill_date: formatDateOnlyForApi(editForm.refill_date),
		next_refill_date: formatDateOnlyForApi(editForm.next_refill_date),
		hydrostatic_test_date: formatDateOnlyForApi(editForm.hydrostatic_test_date),
		next_hydrostatic_test_date: formatDateOnlyForApi(
			editForm.next_hydrostatic_test_date,
		),
		current_status: editForm.current_status,
		pressure_source: toNullableString(editForm.pressure_source),
		working_pressure_bar: toNullableString(editForm.working_pressure_bar),
		manometer_scale_bar: editForm.manometer_scale_bar,
		test_pressure_bar: editForm.test_pressure_bar,
		safety_valve_setting_pressure_bar: toNullableString(
			editForm.safety_valve_setting_pressure_bar,
		),
		working_temperature_celsius: toNullableString(
			editForm.working_temperature_celsius,
		),
	};
};

const getEditSnapshot = () => {
	const payload = buildEditPayload();
	return JSON.stringify(payload);
};

const openEditModal = (product: ProductWithLocation) => {
	console.log('Opening edit modal for product:', product);
	editForm.id = product.id;
	editForm.brand = product.brand || '';
	editForm.model_type = product.model_type || '';
	editForm.serial_number = product.serial_number ?? null;
	editForm.manufacture_year = toDateOrNull(product.manufacture_year);
	editForm.unit = product.unit || '';
	editForm.refill_period = product.refill_period || 2;
	editForm.refill_date = toDateOrNull(product.refill_date);
	editForm.next_refill_date = toDateOrNull(product.next_refill_date);
	editForm.hydrostatic_test_date = toDateOrNull(product.hydrostatic_test_date);
	editForm.next_hydrostatic_test_date = toDateOrNull(
		product.next_hydrostatic_test_date,
	);
	editForm.current_status = product.current_status || 'active';
	editForm.pressure_source = product.pressure_source || '';
	editForm.working_pressure_bar = product.working_pressure_bar || '';
	editForm.manometer_scale_bar = product.manometer_scale_bar ?? null;
	editForm.test_pressure_bar = product.test_pressure_bar ?? null;
	editForm.safety_valve_setting_pressure_bar
    = product.safety_valve_setting_pressure_bar || '';
	editForm.working_temperature_celsius
    = product.working_temperature_celsius || '';
	editForm.locations = {
		building: product.locations?.building_id?.name || '',
		room: product.locations?.room || '',
		location_id: product.locations?.location_id || '',
	};
	editInitialSnapshot.value = getEditSnapshot();
};

const fireExtinguisherWeightOptions = computed(() => {
	if (!editForm.model_type) return [];
	const item = fireExtinguishers.find(f => f.name === editForm.model_type);
	return item ? item.weightOptions : [];
});

const isEditDirty = computed(() => {
	if (!editInitialSnapshot.value) return false;
	return editInitialSnapshot.value !== getEditSnapshot();
});

const isEditValid = computed(() => {
	return Boolean(
		editForm.brand
		&& editForm.model_type
		&& editForm.unit
		&& editForm.current_status
		&& editForm.refill_period
		&& editForm.refill_date
		&& editForm.manufacture_year
		&& editForm.serial_number !== null,
	);
});

const handleUpdateProduct = async () => {
	if (!isEditDirty.value || !isEditValid.value) return;
	editProductSaving.value = true;
	try {
		await $fetch('/api/products', {
			method: 'PUT',
			body: buildEditPayload(),
		});
		emit('update:visible', false);
		resetEditForm();
		toast.add({
			severity: 'success',
			summary: 'Başarılı',
			detail: 'Ürün bilgileri güncellendi.',
		});
		emit('updated');
	}
	catch (err) {
		console.error('Error updating product:', err);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Ürün güncellenirken bir hata oluştu.',
		});
	}
	finally {
		editProductSaving.value = false;
	}
};

watch(
	() => editForm.refill_date,
	(newDate) => {
		if (newDate) {
			const refillDate = new Date(newDate);
			const nextRefillDate = new Date(refillDate);
			nextRefillDate.setFullYear(
				refillDate.getFullYear() + editForm.refill_period,
			);
			editForm.next_refill_date = nextRefillDate;
		}
	},
);
watch(
	() => editForm.hydrostatic_test_date,
	(newDate) => {
		if (newDate) {
			const refillDate = new Date(newDate);
			const nextRefillDate = new Date(refillDate);
			nextRefillDate.setFullYear(refillDate.getFullYear() + 4);
			editForm.next_hydrostatic_test_date = nextRefillDate;
		}
	},
);
watch(
	() => editForm.refill_period,
	(newPeriod) => {
		if (editForm.refill_date && newPeriod) {
			const refillDate = new Date(editForm.refill_date);
			const nextRefillDate = new Date(refillDate);
			nextRefillDate.setFullYear(refillDate.getFullYear() + newPeriod);
			editForm.next_refill_date = nextRefillDate;
		}
	},
);
watch(
	() => props.visible,
	(nextVisible) => {
		if (!nextVisible) {
			resetEditForm();
			return;
		}
		if (props.product) {
			openEditModal(props.product);
		}
	},
	{ immediate: true },
);
watch(
	() => props.product,
	(nextProduct) => {
		if (props.visible && nextProduct) {
			openEditModal(nextProduct);
		}
	},
);
</script>

<template>
	<Dialog
		v-model:visible="visibleModel"
		modal
		header="Ürün Bilgilerini Düzenle"
		:style="{ width: '50rem' }"
	>
		<BaseLoader v-if="editProductSaving" />
		<div class="space-y-6">
			<div class="form-row">
				<div class="form-item">
					<label for="edit-building">{{ headerLabels.building_area }}</label>
					<InputText
						id="edit-building"
						v-model="editForm.locations.building"
						disabled
					/>
				</div>
				<div class="form-item">
					<label for="edit-room">Bulunduğu yer</label>
					<InputText
						id="edit-room"
						v-model="editForm.locations.room"
						disabled
					/>
				</div>
				<div class="form-item">
					<label for="edit-location-id">{{ headerLabels.location_id }}</label>
					<InputText
						id="edit-location-id"
						v-model="editForm.locations.location_id"
						disabled
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-item">
					<label for="edit-model-type">{{ headerLabels.model_type }}</label>
					<Select
						id="edit-model-type"
						v-model="editForm.model_type"
						:options="fireExtinguishers"
						option-label="name"
						option-value="name"
						placeholder="Tipini seçin"
					/>
				</div>
				<div class="form-item">
					<label for="edit-unit">{{ headerLabels.unit }}</label>
					<Select
						id="edit-unit"
						v-model="editForm.unit"
						:options="fireExtinguisherWeightOptions"
						placeholder="Agirlik seçin"
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-item">
					<label for="edit-brand">{{ headerLabels.brand }}</label>
					<InputText
						id="edit-brand"
						v-model="editForm.brand"
					/>
				</div>
				<div class="form-item">
					<label for="edit-status">{{ headerLabels.current_status }}</label>
					<Select
						id="edit-status"
						v-model="editForm.current_status"
						:options="productStatusOptions"
						option-label="label"
						option-value="value"
						placeholder="Durum seçin"
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-item">
					<label for="edit-serial">{{ headerLabels.serial_number }}</label>
					<InputNumber
						id="edit-serial"
						v-model="editForm.serial_number"
						:use-grouping="false"
						fluid
					/>
				</div>
				<div class="form-item">
					<label for="edit-manufacture-year">{{
						headerLabels.manufacture_year
					}}</label>
					<DatePicker
						id="edit-manufacture-year"
						v-model="editForm.manufacture_year"
						view="year"
						date-format="yy"
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-item">
					<label for="edit-refill-date">{{ headerLabels.refill_date }}</label>
					<DatePicker
						id="edit-refill-date"
						v-model="editForm.refill_date"
						date-format="dd/mm/yy"
					/>
				</div>
				<div class="form-item">
					<label for="edit-next-refill-date">{{
						headerLabels.next_refill_date
					}}</label>
					<DatePicker
						id="edit-next-refill-date"
						v-model="editForm.next_refill_date"
						date-format="dd/mm/yy"
						readonly
					/>
				</div>
				<div class="form-item">
					<label for="edit-refill-period">{{
						headerLabels.refill_period
					}}</label>
					<Select
						id="edit-refill-period"
						v-model="editForm.refill_period"
						:options="refillPeriodOptions"
						option-label="label"
						option-value="value"
						placeholder="Yeniden dolum periyodu secin"
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-item">
					<label for="edit-hydro-date">{{
						headerLabels.hydrostatic_test_date
					}}</label>
					<DatePicker
						id="edit-hydro-date"
						v-model="editForm.hydrostatic_test_date"
						date-format="dd/mm/yy"
					/>
				</div>
				<div class="form-item">
					<label for="edit-next-hydro-date">{{
						headerLabels.next_hydrostatic_test_date
					}}</label>
					<DatePicker
						id="edit-next-hydro-date"
						v-model="editForm.next_hydrostatic_test_date"
						date-format="dd/mm/yy"
						readonly
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-item">
					<label for="edit-pressure-source">Basinc kaynagi</label>
					<InputText
						id="edit-pressure-source"
						v-model="editForm.pressure_source"
					/>
				</div>
				<div class="form-item">
					<label for="edit-working-pressure">Calisma basinci(Bar)</label>
					<InputText
						id="edit-working-pressure"
						v-model="editForm.working_pressure_bar"
					/>
				</div>
				<div class="form-item">
					<label for="edit-manometer">Monometre skala buyuklugu(Bar)</label>
					<InputNumber
						id="edit-manometer"
						v-model="editForm.manometer_scale_bar"
						:use-grouping="false"
						fluid
					/>
				</div>
			</div>
			<div class="form-row">
				<div class="form-item">
					<label for="edit-test-pressure">Test basıncı(Bar)</label>
					<InputNumber
						id="edit-test-pressure"
						v-model="editForm.test_pressure_bar"
						:use-grouping="false"
						fluid
					/>
				</div>
				<div class="form-item">
					<label for="edit-safety-valve">
						Emniyet valfi ayar basinci(Bar)
					</label>
					<InputText
						id="edit-safety-valve"
						v-model="editForm.safety_valve_setting_pressure_bar"
					/>
				</div>
				<div class="form-item">
					<label for="edit-temperature">Calisma sicaklik araligi(°C)</label>
					<InputText
						id="edit-temperature"
						v-model="editForm.working_temperature_celsius"
					/>
				</div>
			</div>
		</div>
		<template #footer>
			<div class="pt-4 space-x-4">
				<Button
					label="Vazgeç"
					severity="secondary"
					outlined
					@click="visibleModel = false"
				/>
				<Button
					label="Kaydet"
					:loading="editProductSaving"
					:disabled="!isEditDirty || !isEditValid"
					@click="handleUpdateProduct"
				/>
			</div>
		</template>
	</Dialog>
</template>
