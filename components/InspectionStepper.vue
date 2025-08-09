<script lang="ts" setup>
import type { FileUploadSelectEvent } from 'primevue';
import imageCompression from 'browser-image-compression';
import { imageCompressionOptions } from '~/constants';

type Props = {
	currentProductData: {
		product: unknown;
		location: unknown;
	};
};

const { currentProductData } = defineProps<Props>();

const supabase = useSupabaseClient();
const toast = useToast();
const compressedImage = ref<File | null>(null);
const newProductData = reactive({
	location: null,
	product: null,
});
const activeStep = ref('1');
const loading = ref(false);
const showScanner = ref(false);
const newProductId = ref('');
const photo_url = ref<string >('');

const src = ref(null);

async function onFileSelect(event: FileUploadSelectEvent) {
	const imageFile = event.files[0];
	const reader= new FileReader();
	reader.onload = (e) => {
		if (e.target && e.target.result) {
			photo_url.value = e.target.result as string;
		}
	};
	try {
		const compressedFile = await imageCompression(imageFile, imageCompressionOptions);
		compressedImage.value = compressedFile as File;
	}
	catch (error) {
		console.warn(error);
	}
}

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

async function applyChanges(callback: () => void) {
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

		const userId = (await supabase.auth.getUser()).data.user?.id;

		const details = `arizali YSC no: ${currentProductData.location.location_id}, yeni YSC no: ${newProductData.location.location_id}`;

		$fetch('/api/transactions', {
			method: 'POST',
			body: {
				type: 'dolum',
				user: userId,
				product_id: newProductData.product.id,
				details,
			},
		});

		callback();

		// toast.add({
		// 	severity: 'success',
		// 	summary: 'Başarılı',
		// 	detail: 'Degisim kaydı başarıyla oluşturuldu.',
		// 	life: 2000,
		// });
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
		loading.value = false;
		// emit('close');
	}
}

async function createInspectionForm() {
	loading.value = true;
	try {
		const userId = (await supabase.auth.getUser()).data.user?.id;
		const token = (await supabase.auth.getSession()).data.session?.access_token;

		if (compressedImage.value) {
			const formData = new FormData();
			formData.append('file', compressedImage.value);

			const uploadImageResponse = await fetch('/api/upload/inspection-photo', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});
			const result = await uploadImageResponse.json();
			photo_url.value = result?.signedUrl || null;
		}

		await $fetch('/api/inspections', {
			method: 'POST',
			body: {
				position: true,
				body: true,
				control_card: true,
				hose_and_nozzle: true,
				instruction_and_label: true,
				mass: true,
				pin_and_seal: true,
				pressure: true,
				working_mechanism: true,
				result: true,
				note: null,
				photo_url: photo_url.value,
				user_id: userId,
				fire_extinguisher_id: newProductData.product.id,
			},
		});
	}
	catch (error) {
		console.error('Error creating inspection form:', error);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Rutin kontrol formu oluşturulurken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		loading.value = false;
	}
}
</script>

<template>
	<div class="card flex justify-center border-t border-slate-200 pt-5">
		<BaseLoader v-if="loading" />
		<Stepper
			v-model:value="activeStep"
		>
			<StepList>
				<Step
					value="1"
					as-child
				>
					<CustomStepperButton
						step="1"
						title="Yeni YSC"
						:is-active="activeStep === '1'"
					/>
				</Step>
				<Step
					value="2"
					as-child
				>
					<CustomStepperButton
						step="2"
						title="Degisim"
						:is-active="activeStep === '2'"
					/>
				</Step>
				<Step
					value="3"
					as-child
				>
					<CustomStepperButton
						step="3"
						title="Onay"
						:is-active="activeStep === '3'"
					/>
				</Step>
			</StepList>
			<StepPanels>
				<StepPanel
					v-slot="{ activateCallback }"
					value="1"
				>
					<div>
						<h4 class="mb-4 mt-10 font-semibold text-slate-600">
							Bu adimda YSC no girerek veya QR kod okutarak yeni YSC yi sec.
						</h4>

						<div>
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
												@click="getNewProductData(newProductId, () => activateCallback('2'))"
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
							<QRScanner
								v-if="showScanner"
								@close="showScanner = false"
								@scan-complete="(scannedNumber) => newProductId = scannedNumber"
							/>
						</div>
					</div>
					<!-- <div class="p-4">
						<div class="flex flex-col items-center mb-6">
							<i class="ri-checkbox-circle-line text-6xl text-green-600" />
							<h3 class="text-lg font-semibold mb-2">
								Rutin kontrol formunu olusturdun
							</h3>
							<h4 class="text-gray-800 text-center">
								YSC gerekli kontrollerden gecemedigi icin degistirilmesi gerekli! Devam ederek degisim islemini tamamlayabilirsin.
							</h4>
						</div>
					</div> -->

					<!-- <div class="flex pt-6 justify-end">
						<Button
							label="Devam"
							icon="ri-arrow-right-line"
							icon-pos="right"
							@click="activateCallback('2')"
						/>
					</div> -->
				</StepPanel>
				<StepPanel
					v-slot="{ activateCallback }"
					value="2"
				>
					<h4 class="mb-4 mt-10 font-semibold text-slate-600">
						Bu adimda yeni ve eski YSC bilgilerini kontrol et, bilgiler dogruysa son adim icin devam et
					</h4>
					<div>
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

					<div class="pt-4 flex justify-between border-t border-slate-200">
						<Button
							label="Geri"
							severity="secondary"
							icon="ri-arrow-left-line"
							@click="activateCallback('1')"
						/>
						<Button
							label="Devam et"
							icon="ri-arrow-right-line"
							icon-pos="right"
							@click="applyChanges(() => activateCallback('3'))"
						/>
					</div>
				</StepPanel>
				<StepPanel
					v-slot="{ activateCallback }"
					value="3"
				>
					<h4 class="mb-4 mt-10 font-semibold text-slate-600">
						Son adimdasin! Bu adimda yeni YSC nin fotografini ekle ve degisim kaydini tamamla.
					</h4>

					<div class="card flex flex-col items-center gap-6">
						<FileUpload
							mode="basic"
							custom-upload
							auto
							accept="image/*"
							severity="secondary"
							class="p-button-outlined"
							@select="onFileSelect"
						/>
						<img
							v-if="compressedImage"
							:src="photo_url"
							alt="Image"
							class="shadow-md rounded-xl w-64 sm:w-12"
						>
					</div>

					<div class="pt-4 border-t border-slate-200 mt-12 flex justify-end">
						<Button
							icon="ri-check-line"
							icon-pos="right"
							label="Degisim kaydini tamamla"
							@click="createInspectionForm"
						/>
					</div>
				</StepPanel>
			</StepPanels>
		</Stepper>
	</div>
</template>
