<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});

const assetCode = ref('');
const showScanner = ref(false);
const { toTenantPath } = useTenant();
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
						<label for="asset_code">Tüp kodu</label>
						<div class="flex space-x-2">
							<InputText
								id="asset_code"
								v-model="assetCode"
								placeholder="XXXXX-XXXXX-X"
								size="large"
								class="flex-1"
							/>
							<Button
								size="large"
								label="Ara"
								:disabled="!assetCode.trim()"
								@click="$router.push(toTenantPath(`/mobile/transactions/${assetCode.trim()}`))"
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
				@scan-complete="(scannedAssetUid) => $router.push(toTenantPath(`/mobile/transactions/${scannedAssetUid}`))"
			/>
		</div>
	</div>
</template>
