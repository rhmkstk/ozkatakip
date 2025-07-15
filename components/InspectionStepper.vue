<script lang="ts" setup>
type Props = {
	currentProductData: {
		product: unknown;
		location: unknown;
	};
};

type Emits = {
	(e: 'close'): void;
};

const { currentProductData } = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();

const newProductData = reactive({
	location: null,
	product: null,
});
const loading = ref(false);
const showScanner = ref(false);
const newProductId = ref('');

const currentProductSummaryCardData = computed(() => {
	if (currentProductData?.product && currentProductData?.location) {
		return [
			{
				key: 'YSC no',
				value: currentProductData.location.location_id,
			},
			{
				key: 'Modeli',
				value: currentProductData.product.model_type,
			},
			{
				key: 'Bina',
				value: currentProductData.location.building_id.name,
			},
			{
				key: 'Oda',
				value: currentProductData.location.room,
			},
		];
	}
	return [];
});

const newProductSummaryCardData = computed(() => {
	if (newProductData?.product && newProductData?.location) {
		return [
			{
				key: 'YSC no',
				value: newProductData.location.location_id,
			},
			{
				key: 'Modeli',
				value: newProductData.product.model_type,
			},
			{
				key: 'Bina',
				value: newProductData.location.building_id.name,
			},
			{
				key: 'Oda',
				value: newProductData.location.room,
			},
		];
	}
	return [];
});

async function getNewProductData(newLocationId: string, callback: () => void) {
	try {
		loading.value = true;
		const location = await $fetch('/api/locations/getByLocationId', {
			params: { location_id: newLocationId },
		});
		if (!location || location.length === 0) {
			throw new Error('Location not found');
		}
		const product = await $fetch('/api/products/getByLocationId', {
			params: { location_id: location[0].id },
		});
		if (!product || product.length === 0) {
			throw new Error('Product not found');
		}
		newProductData.location = location[0];
		newProductData.product = product[0];
	}
	catch (error) {
		console.error('Error fetching product data:', error);
		alert('YSC bulunamadı. Lütfen YSC noyu kontrol edin.');
	}
	finally {
		loading.value = false;
		callback();
	}
}

async function applyChanges() {
	loading.value = true;
	try {
		const currentResponse = await $fetch('/api/products', {
			method: 'PUT',
			body: {
				...currentProductData.product,
				location: newProductData.product.location,
				current_status: 'arızalı',
			},
		});

		if (!currentResponse) {
			toast.add({
				severity: 'error',
				summary: 'Hata',
				detail: 'Degisim kaydı oluşturulurken bir hata oluştu.',
				life: 2000,
			});
			return;
		}
		await $fetch('/api/products', {
			method: 'PUT',
			body: {
				...newProductData.product,
				location: currentProductData.product.location,
				current_status: 'aktif',
			},
		});

		toast.add({
			severity: 'success',
			summary: 'Başarılı',
			detail: 'Degisim kaydı başarıyla oluşturuldu.',
			life: 2000,
		});
	}
	catch (error) {
		console.error('Error saving fill record:', error);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Degisim kaydı oluşturulurken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		loading.value = true;
		emit('close');
	}
}
</script>

<template>
	<div class="card flex justify-center">
		<BaseLoader v-if="loading" />
		<Stepper
			value="1"
			class="basis-[50rem]"
		>
			<StepList>
				<Step value="1">
					Bakim
				</Step>
				<Step value="2">
					Yeni YSC
				</Step>
				<Step value="3">
					Degisim
				</Step>
			</StepList>
			<StepPanels>
				<StepPanel
					v-slot="{ activateCallback }"
					value="1"
				>
					<div class="border-2 border-dashed border-[#e2e8f0] rounded p-4">
						<div class="flex flex-col items-center mb-6">
							<i class="ri-checkbox-circle-line text-6xl text-green-600" />
							<h3 class="text-lg font-semibold mb-2">
								Rutin kontrol formunu olusturdun.
							</h3>
							<h4 class="text-gray-800 text-center">
								YSC gerekli kontrollerden gecemedigi icin degistirilmesi gerekli! Devam ederek degisim islemini tamamlayabilirsin.
							</h4>
						</div>
					</div>

					<div class="flex pt-6 justify-end">
						<Button
							label="Devam"
							icon="ri-arrow-right-line"
							icon-pos="right"
							@click="activateCallback('2')"
						/>
					</div>
				</StepPanel>
				<StepPanel
					v-slot="{ activateCallback }"
					value="2"
				>
					<div class="border-2 border-dashed border-[#e2e8f0] rounded p-4">
						<h4 class="text-gray-800 mb-6 font-semibold">
							Bu adimda YSC no girerek veya QR kod okutarak yeni YSC yi sec.
						</h4>

						<form
							class="mt-auto w-full"
							@submit.prevent
						>
							<div class="form-row">
								<div class="form-item">
									<label for="building_area">YSC no</label>
									<div class="flex space-x-2">
										<InputText
											id="building_area"
											v-model="newProductId"
											placeholder="ATM-2"
											class="flex-1"
										/>
										<Button
											label="Ara"
											@click="getNewProductData(newProductId, () => activateCallback('3'))"
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
							outlined
							label="QR Kod Tara"
							@click="showScanner = true"
						/>
					</div>
					<QRScanner
						v-if="showScanner"
						@close="showScanner = false"
						@scan-complete="(scannedNumber) => getNewProductData(scannedNumber, () => activateCallback('3'))"
					/>

					<div class="flex pt-6">
						<Button
							label="Geri"
							severity="secondary"
							icon="ri-arrow-left-line"
							@click="activateCallback('1')"
						/>
					</div>
				</StepPanel>
				<StepPanel
					v-slot="{ activateCallback }"
					value="3"
				>
					<div class="border-2 border-dashed border-[#e2e8f0] rounded p-4">
						<h4 class="text-gray-800 mb-6 font-semibold">
							Son adimdasin! Asagida ozet YSC bilgilerini kontrol et, eger her sey dogruysa degisim islemini tamamlayabilirsin.
						</h4>

						<div class="bg-gray-400 rounded-xl p-px">
							<h5 class="text-lg text-center font-semibold text-white">
								MEVCUT
							</h5>
							<div class="mt-1 bg-white p-3 rounded-xl">
								<ul
									class="space-y-2 list-disc list-inside"
								>
									<li
										v-for="item in currentProductSummaryCardData"
										:key="item.key"
										class="flex space-x-1"
									>
										<p class="font-semibold">
											{{ item.key }}:
										</p>
										<p class=" truncate">
											{{ item.value }}
										</p>
									</li>
								</ul>
							</div>
						</div>
						<Divider
							align="center"
						>
							<i class="ri-swap-line text-3xl" />
						</Divider>
						<div class="bg-green-600 rounded-xl p-px mb-12">
							<h5 class="text-lg text-center font-semibold text-white">
								YENI
							</h5>
							<div class="mt-1 bg-white p-3 rounded-xl">
								<ul
									class="space-y-2 list-disc list-inside"
								>
									<li
										v-for="item in newProductSummaryCardData"
										:key="item.key"
										class="flex space-x-1"
									>
										<p class="font-semibold">
											{{ item.key }}:
										</p>
										<p class=" truncate">
											{{ item.value }}
										</p>
									</li>
								</ul>
							</div>
						</div>
					</div>

					<div class="pt-6 flex justify-between">
						<Button
							label="Geri"
							severity="secondary"
							icon="ri-arrow-left-line"
							@click="activateCallback('2')"
						/>
						<Button
							label="Kaydet"
							icon="ri-save-line"
							icon-pos="right"
							@click="applyChanges"
						/>
					</div>
				</StepPanel>
			</StepPanels>
		</Stepper>
	</div>
</template>
