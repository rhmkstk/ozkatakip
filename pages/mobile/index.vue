<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});

const productId = ref<string | null>('');
</script>

<template>
	<div class="flex flex-col space-y-4 h-full pb-24">
		<Card>
			<template #content>
				<ul class="list-disc list-inside space-y-4 max-h-[50dvh] overflow-y-auto">
					<li>02.05.2025, saat 10:02 tarihinde bakim kaydi olusturdun</li>
					<li>02.05.2025, saat 10:15 tarihinde bakim kaydi olusturdun</li>
					<li>02.05.2025, saat 10:45 tarihinde bakim kaydi olusturdun</li>
					<li>02.05.2025, saat 13:15 tarihinde bakim kaydi olusturdun</li>
					<li>02.05.2025, saat 13:42 tarihinde bakim kaydi olusturdun</li>
					<li>02.05.2025, saat 14:29 tarihinde bakim kaydi olusturdun</li>
					<li>03.05.2025, saat 11:12 tarihinde dolum kaydi olusturdun</li>
				</ul>
			</template>
		</Card>
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
