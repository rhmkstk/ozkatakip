<script setup lang="ts">
import * as XLSX from 'xlsx';
import type { TablesInsert } from '~/types/database.types';

const initialFormData: TablesInsert<'products'> = {
	manufacture_year: '',
	serial_number: 0,
	brand: '',
	model_type: '',
	current_status: null,
	location: null,
	manometer_scale_bar: null,
	pressure_source: '',
	working_pressure_bar: '',
	working_temperature_celsius: '',
	test_pressure_bar: null,
	safety_valve_setting_pressure_bar: '',
	hydrostatic_test_date: '',
	next_hydrostatic_test_date: '',
	refill_date: '',
	next_refill_date: '',
	refill_period: null,
};

const formData = ref({ ...initialFormData });
const isSubmitting = ref(false);
const message = ref('');
const messageClass = ref('');
const selectedFile = ref(null);
const parsedData = ref([]);
const fillIndex = ref(6);

const statusOptions = ['aktif', 'arızalı', 'kayıp', 'yedek'];

async function handleSubmit() {
	try {
		isSubmitting.value = true;
		message.value = '';

		const response = await $fetch('/api/products', {
			method: 'POST',
			body: formData.value,
		});

		if (response) {
			// Reset form after successful submission
			formData.value = { ...initialFormData };
			// Show success message
			message.value = 'Product created successfully!';
			messageClass.value = 'bg-green-100 text-green-700';
		}
	}
	catch (err: any) {
		message.value
      = err.message || 'An error occurred while creating the product';
		messageClass.value = 'bg-red-100 text-red-700';
	}
	finally {
		isSubmitting.value = false;
	}
}

const handleFileUpload = async (event) => {
	const file = event.target.files[0];
	if (file) {
		selectedFile.value = file;

		try {
			// Dosyayı binary string olarak okuyoruz
			const data = await file.arrayBuffer();

			// Excel dosyasını parse ediyoruz
			const workbook = XLSX.read(data);

			// İlk sayfayı alıyoruz
			const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

			// JSON formatına çeviriyoruz
			const jsonData = XLSX.utils.sheet_to_json(firstSheet);

			parsedData.value = mapExcelData(jsonData.slice(2, 22));
			console.log('parsedData', parsedData);
		}
		catch (error) {
			console.error('Dosya okuma hatası:', error);
			alert('Dosya okunurken bir hata oluştu!');
		}
	}
};

function fillForm() {
	const data = parsedData.value[fillIndex.value];
	const hydroDate = getRandomDate(2021, 2025);
	const nextHydroDate = addYears(hydroDate, 4);
	const fillDate = getRandomDate(2023, 2024);
	const nextFillDate = addYears(fillDate, 2);

	(formData.value.manufacture_year = getRandomDate().toLocaleDateString()),
	(formData.value.serial_number = data.serial_number),
	(formData.value.brand = data.brand);
	formData.value.model_type = data.model_type;
	(formData.value.current_status = 'aktif'),
	(formData.value.location = data.location),
	(formData.value.manometer_scale_bar = data.manometer_scale_bar),
	(formData.value.pressure_source = data.pressure_source),
	(formData.value.working_pressure_bar = data.working_pressure_bar),
	(formData.value.working_temperature_celsius
      = data.working_temperature_celsius),
	(formData.value.test_pressure_bar = data.test_pressure_bar),
	(formData.value.safety_valve_setting_pressure_bar
      = data.safety_valve_setting_pressure_bar),
	(formData.value.hydrostatic_test_date = hydroDate.toLocaleDateString()),
	(formData.value.next_hydrostatic_test_date = nextHydroDate.toLocaleDateString()),
	(formData.value.refill_date = fillDate.toLocaleDateString()),
	(formData.value.next_refill_date = nextFillDate.toLocaleDateString()),
	(formData.value.refill_period = 2);
}

function getRandomDate(date1 = 2012, date2 = 2022): Date {
	const start = new Date(date1, 0, 1); // January 1, 2012
	const end = new Date(date2, 11, 31); // December 31, 2022
	const randomTime
    = start.getTime() + Math.random() * (end.getTime() - start.getTime());
	return new Date(randomTime);
}

function addYears(date: Date, years: number = 2) {
	const newDate = new Date(date);
	newDate.setFullYear(newDate.getFullYear() + years);
	return newDate;
}
</script>

<template>
	<div class="max-w-2xl mx-auto p-4">
		<h1 class="text-2xl font-bold mb-6">
			Create New Product
		</h1>
		<div>
			<button @click="fillIndex = fillIndex - 1">
				-
			</button>
			<span>{{ fillIndex }}</span>
			<button @click="fillIndex = fillIndex + 1">
				+
			</button>
		</div>

		<form
			class="space-y-4"
			@submit.prevent="handleSubmit"
		>
			<!-- Required Fields Section -->
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Required Information
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Manufacture Year*</label>
						<input
							v-model="formData.manufacture_year"
							type="date"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Serial Number*</label>
						<input
							v-model="formData.serial_number"
							type="number"
							required
							class="w-full p-2 border rounded"
						>
					</div>
				</div>
			</div>

			<!-- Basic Information Section -->
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Basic Information
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Brand</label>
						<input
							v-model="formData.brand"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Model Type</label>
						<input
							v-model="formData.model_type"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Status</label>
						<select
							v-model="formData.current_status"
							class="w-full p-2 border rounded"
						>
							<option value="">
								Select Status
							</option>
							<option
								v-for="status in statusOptions"
								:key="status"
								:value="status"
							>
								{{ status }}
							</option>
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Location ID</label>
						<input
							v-model="formData.location"
							type="number"
							class="w-full p-2 border rounded"
						>
					</div>
				</div>
			</div>

			<!-- Technical Specifications -->
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Technical Specifications
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Manometer Scale (bar)</label>
						<input
							v-model="formData.manometer_scale_bar"
							type="number"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Pressure Source</label>
						<input
							v-model="formData.pressure_source"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Working Pressure (bar)</label>
						<input
							v-model="formData.working_pressure_bar"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Working Temperature (°C)</label>
						<input
							v-model="formData.working_temperature_celsius"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Test Pressure (bar)</label>
						<input
							v-model="formData.test_pressure_bar"
							type="number"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Safety Valve Setting Pressure (bar)</label>
						<input
							v-model="formData.safety_valve_setting_pressure_bar"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>
				</div>
			</div>

			<!-- Maintenance Dates -->
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Maintenance Information
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Hydrostatic Test Date</label>
						<input
							v-model="formData.hydrostatic_test_date"
							type="date"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Next Hydrostatic Test Date</label>
						<input
							v-model="formData.next_hydrostatic_test_date"
							type="date"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Refill Date</label>
						<input
							v-model="formData.refill_date"
							type="date"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Next Refill Date</label>
						<input
							v-model="formData.next_refill_date"
							type="date"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Refill Period (months)</label>
						<input
							v-model="formData.refill_period"
							type="number"
							class="w-full p-2 border rounded"
						>
					</div>
				</div>
			</div>

			<!-- Submit Button -->
			<div class="flex justify-end gap-4">
				<button
					type="submit"
					:disabled="isSubmitting"
					class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
				>
					{{ isSubmitting ? "Creating..." : "Create Product" }}
				</button>
			</div>
		</form>
		<button @click="fillForm">
			fill form
		</button>

		<!-- Show success/error messages -->
		<div
			v-if="message"
			:class="['mt-4 p-4 rounded', messageClass]"
		>
			{{ message }}
		</div>

		<div class="file-upload-container">
			<label
				for="excel-file"
				class="file-label"
			>Excel Dosyası Seç</label>
			<input
				id="excel-file"
				type="file"
				accept=".xlsx,.xls,.ods,.csv"
				class="file-input"
				@change="handleFileUpload"
			>
			<p
				v-if="selectedFile"
				class="selected-file"
			>
				Seçilen dosya: {{ selectedFile.name }}
			</p>
		</div>
	</div>
</template>
