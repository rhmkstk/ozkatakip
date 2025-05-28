<script setup lang="ts">
import type { TablesInsert } from '~/types/database.types';

const initialFormData: TablesInsert<'inspections'> = {
	fire_extinguisher_id: null,
	position: true,
	body: true,
	control_card: true,
	hose_and_nozzle: true,
	instruction_and_label: true,
	mass: true,
	pin_and_seal: true,
	pressure: true,
	working_mechanism: true,
	result: null,
	note: null,
	photo_url: null,
	user_id: null,
	date: null,
};

const formData = ref({ ...initialFormData });
const isSubmitting = ref(false);
const message = ref('');
const messageClass = ref('');

async function handleSubmit() {
	try {
		isSubmitting.value = true;
		message.value = '';
		const toIsoDate = new Date(formData.value.date).toISOString();
		formData.value.date = toIsoDate;

		const response = await $fetch('/api/inspections', {
			method: 'POST',
			body: formData.value,
		});

		if (response) {
			// Reset form after successful submission
			formData.value = { ...initialFormData };
			// Show success message
			message.value = 'Inspection created successfully!';
			messageClass.value = 'bg-green-100 text-green-700';
		}
	}
	catch (err: any) {
		message.value = err.message || 'An error occurred while creating the inspection';
		messageClass.value = 'bg-red-100 text-red-700';
	}
	finally {
		isSubmitting.value = false;
	}
}

// function setDate() {
//   const date = new Date(2025, 2, 1, 0, 0, 0); // Local time (March 1, 2025, 00:00 in Turkey)
//   const timestamp = date.toISOString(); // Convert to UTC format
//   formData.value.date = timestamp
//   console.log(timestamp);
// }
</script>

<template>
	<div class="max-w-2xl mx-auto p-4">
		<h1 class="text-2xl font-bold mb-6">
			Create New Inspection
		</h1>

		<form
			class="space-y-4"
			@submit.prevent="handleSubmit"
		>
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Date
				</h2>
				<span>{{ formData.date }}</span>

				<input
					v-model="formData.date"
					type="datetime-local"
				>
			</div>
			<!-- Basic Information -->
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Basic Information
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Fire Extinguisher ID</label>
						<input
							v-model="formData.fire_extinguisher_id"
							type="number"
							class="w-full p-2 border rounded"
						>
					</div>
				</div>
			</div>

			<!-- Inspection Checks -->
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Inspection Checks
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Position*</label>
						<input
							v-model="formData.position"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Body</label>
						<input
							v-model="formData.body"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Control Card</label>
						<input
							v-model="formData.control_card"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Hose and Nozzle</label>
						<input
							v-model="formData.hose_and_nozzle"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Instruction and Label</label>
						<input
							v-model="formData.instruction_and_label"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Mass</label>
						<input
							v-model="formData.mass"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Pin and Seal</label>
						<input
							v-model="formData.pin_and_seal"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Pressure</label>
						<input
							v-model="formData.pressure"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Working Mechanism</label>
						<input
							v-model="formData.working_mechanism"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Final Result</label>
						<input
							v-model="formData.result"
							type="checkbox"
							class="form-checkbox h-5 w-5"
						>
					</div>
				</div>
			</div>

			<!-- Additional Information -->
			<div class="bg-gray-50 p-4 rounded-lg space-y-4">
				<h2 class="font-semibold">
					Additional Information
				</h2>

				<div class="grid grid-cols-1 gap-4">
					<div>
						<label class="block text-sm font-medium mb-1">Notes</label>
						<textarea
							v-model="formData.note"
							rows="3"
							class="w-full p-2 border rounded"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">Photo URL</label>
						<input
							v-model="formData.photo_url"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>

					<div>
						<label class="block text-sm font-medium mb-1">User ID</label>
						<input
							v-model="formData.user_id"
							type="text"
							class="w-full p-2 border rounded"
						>
					</div>
				</div>
			</div>

			<!-- Submit Button -->
			<div class="flex justify-end">
				<button
					type="submit"
					:disabled="isSubmitting"
					class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
				>
					{{ isSubmitting ? "Creating..." : "Create Inspection" }}
				</button>
			</div>
		</form>

		<!-- Show success/error messages -->
		<div
			v-if="message"
			:class="['mt-4 p-4 rounded', messageClass]"
		>
			{{ message }}
		</div>
	</div>
</template>

<style scoped>
.form-checkbox {
  @apply rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50;
}
</style>
