<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});

const productId = ref<string | null>('');
const showScanner = ref(false);
</script>

<template>
	<div class="flex flex-col space-y-4 h-full pb-4">
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
								v-model="productId"
								placeholder="ATM-2"
								size="large"
								class="flex-1"
							/>
							<Button
								size="large"
								label="Ara"
								@click="$router.push(`/mobile/transactions/${productId}`)"
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
			/>

			<Divider />
			<!-- QR Scan Button -->
			<Button
				class="mt-4"
				icon="ri-camera-fill"
				label="Kamera"
				size="large"
				@click="showScanner = true"
			/>

			<QRScanner
				v-if="showScanner"
				@close="showScanner = false"
				@scan-complete="(scannedNumber) => $router.push(`/mobile/transactions/${scannedNumber}`)"
			/>
		</div>
	</div>
</template>
