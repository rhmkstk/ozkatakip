<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});

const locationId = ref<string | null>('');
const showScanner = ref(false);
</script>

<template>
	<div class="flex flex-col space-y-4 h-dvh pb-4">
		<div class="mt-auto">
			<form
				class="w-full"
				@submit.prevent
			>
				<div class="form-row">
					<div class="form-item">
						<label for="building_area">YSC no</label>
						<div class="flex space-x-2">
							<InputText
								id="building_area"
								v-model="locationId"
								placeholder="ATM-2"
								size="large"
								class="flex-1"
							/>
							<Button
								size="large"
								label="Ara"
								@click="$router.push(`/mobile/transactions/${locationId}`)"
							/>
						</div>
					</div>
				</div>
			</form>
			<Divider align="center">
				<span class="text-sm">Veya</span>
			</Divider>
			<Button
				class="w-full"
				icon="ri-camera-fill"
				size="large"
				outlined
				label="QR Kod Tara"
				@click="showScanner = true"
			/>

			<QRScanner
				v-if="showScanner"
				@close="showScanner = false"
				@scan-complete="(locationId) => $router.push(`/mobile/transactions/${locationId}`)"
			/>
		</div>
	</div>
</template>
