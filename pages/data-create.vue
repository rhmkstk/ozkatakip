<script setup lang="ts">
import type { TablesInsert } from '~/types/database.types';

const formData = ref<TablesInsert<'locations'>>({
	building_area: '',
	location: '',
	location_id: '',
});

const isSubmitting = ref(false);
const message = ref('');
const messageClass = ref('');

async function handleSubmit() {
	try {
		isSubmitting.value = true;
		message.value = '';

		const response = await $fetch('/api/locations', {
			method: 'POST',
			body: formData.value,
		});

		// Success
		message.value = 'Location created successfully!';
		messageClass.value = 'bg-green-100 text-green-700';
		// Reset form
		formData.value = {
			building_area: '',
			location: '',
			location_id: '',
		} as TablesInsert<'locations'>;
	}
	catch (error: any) {
		// Error handling
		message.value = error.message || 'An error occurred while creating the location';
		messageClass.value = 'bg-red-100 text-red-700';
	}
	finally {
		isSubmitting.value = false;
	}
}
</script>

<template>
	<div class="max-w-2xl mx-auto p-4">
		<h1 class="text-2xl font-bold mb-6">
			Create New Location
		</h1>

		<form
			class="space-y-4"
			@submit.prevent="handleSubmit"
		>
			<div>
				<label
					for="building_area"
					class="block text-sm font-medium mb-1"
				>Building Area</label>
				<input
					id="building_area"
					v-model="formData.building_area"
					type="text"
					required
					class="w-full p-2 border rounded"
				>
			</div>

			<div>
				<label
					for="location"
					class="block text-sm font-medium mb-1"
				>Location</label>
				<input
					id="location"
					v-model="formData.location"
					type="text"
					required
					class="w-full p-2 border rounded"
				>
			</div>

			<div>
				<label
					for="location_id"
					class="block text-sm font-medium mb-1"
				>Location ID</label>
				<input
					id="location_id"
					v-model="formData.location_id"
					type="text"
					required
					class="w-full p-2 border rounded"
				>
			</div>

			<button
				type="submit"
				class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
				:disabled="isSubmitting"
			>
				{{ isSubmitting ? 'Creating...' : 'Create Location' }}
			</button>
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
