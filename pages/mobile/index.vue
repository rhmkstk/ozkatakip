<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});

const productId = ref<string | null>('');
</script>

<template>
	<div class="flex flex-col space-y-4 h-full pb-24">
		<span
			class="text-center text-4xl font-bold border-2 rounded-2xl p-3 w-max mx-auto text-blue-600"
		>ÖT</span>
		<form
			class="mt-auto w-full"
			@submit.prevent
		>
			<div class="form-row">
				<div class="form-item">
					<label for="building_area">YSC no</label>
					<InputText
						id="building_area"
						v-model="productId"
						placeholder="ATM-2"
						size="large"
					/>
				</div>
			</div>
			<Button
				label="Ara"
				size="large"
				class="mt-4 w-full"
				@click="$router.push(`/mobile/transactions/${productId}`)"
			/>
		</form>

		<Divider />
		<Button
			class="mt-4"
			icon="ri-camera-fill"
			label="Kamera"
			size="large"
			@click="$router.push('/mobile/transactions/1')"
		/>
	</div>
</template>
