<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});
</script>

<template>
	<div class="flex flex-col space-y-4 h-full pb-24">
		<span
			class="text-center text-4xl font-bold border-2 rounded-2xl p-3 w-max mx-auto text-blue-600"
		>ÖT</span>

		<label class="mt-auto">YSC no</label>
		<InputText
			type="text"
			placeholder="ATM-2"
		/>
		<Button
			label="Goster"
			@click="$router.push('/mobile/start')"
		/>
		<Divider />
		<Button
			class="mt-4"
			icon="ri-camera-fill"
			label="Kamera"
			size="large"
			@click="$router.push('/mobile/start')"
		/>
	</div>
</template>
