<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});
</script>

<template>
	<div class="flex flex-col space-y-4">
		<h2>Islemler</h2>
		<Button label="Bakim kaydi olustur" />
		<Button
			label="Dolum kaydi olustur"
			@click="$router.push('/mobile/inspection-form')"
		/>
		<Button label="Degisim" />
	</div>
</template>
