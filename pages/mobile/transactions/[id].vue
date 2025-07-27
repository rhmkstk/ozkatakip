<script setup lang="ts">
import { headerLabels } from '~/constants';

definePageMeta({
	layout: 'mobile',
});

const router = useRouter();
const route = useRoute();
const toast = useToast();
const inspectionFormLoading = ref(false);
const fillRecordLoading = ref(false);
const drawersShow = reactive({
	fill: false,
	change: true,
});

const inspectionForm = reactive({
	fire_extinguisher_id: null,
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
	photo_url: null,
	user_id: null,
});

const controlFields = [
	'position',
	'body',
	'control_card',
	'hose_and_nozzle',
	'instruction_and_label',
	'mass',
	'pin_and_seal',
	'pressure',
	'working_mechanism',
];

const { data, status } = await useAsyncData(
	'product',
	async () => {
		const location = await $fetch('/api/locations/getByLocationId', {
			params: { location_id: route.params.id },
		});
		console.log('location data:', location);

		if (!location) {
			throw new Error('Location not found');
		}
		const product = await $fetch('/api/products/getByLocationId', {
			params: { location_id: location[0].id },
		});

		if (!product || product.length === 0) {
			throw new Error('Product not found');
		}

		return { product: product[0], location: location[0] };
	},
);

const fillRecordSummaryCardData = computed(() => {
	if (data.value?.product && data.value?.location) {
		return [
			{
				key: 'YSC no',
				value: data.value.location.location_id,
			},
			{
				key: 'Modeli',
				value: data.value.product.model_type,
			},
			{
				key: 'Bina',
				value: data.value.location.building_id.name,
			},
			{
				key: 'Oda',
				value: data.value.location.room,
			},
			{
				key: 'Dolum tarihi',
				value: new Date(data.value.product.refill_date).toLocaleDateString('tr-TR', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
				}),
			},
		];
	}
	return [];
});

function onFileSelect(event: Event) {
	const file = event.files[0] as File;
	const reader = new FileReader();

	reader.onload = async (e) => {
		const result = e.target?.result;
		inspectionForm.photo_url = result as string;
	};

	reader.readAsDataURL(file);
}

async function saveFillRecord() {
	fillRecordLoading.value = true;
	if (!data.value?.product || !data.value?.location) {
		console.error('Product or location data is missing');
		fillRecordLoading.value = false;
		return;
	}
	try {
		const response = await $fetch('/api/products', {
			method: 'PUT',
			body: {
				...data.value.product,
				refill_date: new Date(),
				next_refill_date: addYearToDate(new Date(), data.value.product.refill_period),
			},
		});

		if (response) {
			toast.add({
				severity: 'success',
				summary: 'Başarılı',
				detail: 'Dolum kaydı başarıyla oluşturuldu.',
				life: 2000,
			});
			drawersShow.fill = false;
		}
	}
	catch (error) {
		console.error('Error saving fill record:', error);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Dolum kaydı oluşturulurken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		fillRecordLoading.value = false;
		drawersShow.fill = false;
	}
}

async function saveInspectionForm() {
	const result = controlFields.every(field => inspectionForm[field] === true);
	inspectionFormLoading.value = true;
	try {
		const response = await $fetch('/api/inspections', {
			method: 'POST',
			body: {
				...inspectionForm,
				fire_extinguisher_id: data.value?.product.id,
				result,
			},
		});

		if (response) {
			if (!result) {
				drawersShow.fill = false;
				drawersShow.change = true;
			}
			else {
				toast.add({
					severity: 'success',
					summary: 'Başarılı',
					detail: 'Bakim kaydı başarıyla oluşturuldu.',
					life: 2000,
				});
				drawersShow.fill = false;
			}
		}
	}
	catch {
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Bakim kaydı oluşturulurken bir hata oluştu.',
			life: 2000,
		});
	}
	finally {
		inspectionFormLoading.value = false;
		router.push('/mobile');
	}
}
</script>

<template>
	<div class="h-full">
		<BaseLoader v-if="status === 'pending' || status === 'idle' || inspectionFormLoading" />
		<div
			v-else
			class="flex flex-col h-full"
		>
			<header class="flex items-center space-x-2 mb-6">
				<Button
					icon="ri-arrow-left-fill"
					severity="secondary"
					label="Geri"
					aria-label="go back"
					@click="$router.push('/mobile')"
				/>
				<!-- <Button
					class="ml-auto"
					icon="ri-battery-charge-line"
					label="Dolum"
					severity="contrast"
					@click="drawersShow.fill = true"
				/> -->
				<!-- <Button
					icon="ri-repeat-line"
					label="Degisim"
					severity="contrast"
					@click="drawersShow.change = true"
				/> -->
			</header>
			<div class="bg-slate-100 p-2 rounded-lg space-x-3 mb-4 flex">
				<img
					src="https://www.capitalsolutions.pk/wp-content/uploads/2021/06/DCP6Kg-ABC-2.jpg"
					alt="fire-estinguisher"
					class="object-cover max-w-full w-1/3 h-[200px] rounded"
				>
				<div class="pt-2 px-2 flex-1 flex flex-col">
					<h4 class="text-sm font-semibold leading-3">
						12 KG
					</h4>
					<h3 class="text-lg font-semibold truncate">
						Karbondioksit gazli
					</h3>

					<div class="flex items-center space-x-1">
						<span class="size-1.5 rounded-full bg-green-600" />
						<span class="text-xs text-slate-500">AKTİF</span>
					</div>
					<div class="flex space-x-1 mt-4">
						<i class="ri-map-pin-line -mt-0.5" />
						<span class="text-sm">MOBİL EKİPMAN BAKIM	, YEDEK , YEDEK225452</span>
					</div>
					<div class="flex space-x-1 mt-2">
						<i class="ri-calendar-line -mt-0.5" />
						<p class="text-sm text-gray-700">
							Dolum tarihi: <b>2027-07-05</b>, Hidrastatik test tarihi: <b>2027-07-05</b>
						</p>
					</div>
				</div>
			</div>
			<div class="card">
				<Tabs value="0">
					<TabList>
						<Tab
							value="0"
							class="w-1/2"
						>
							Bakım kayıt
						</Tab>
						<Tab
							value="1"
							class="w-1/2"
						>
							Dolum kayıt
						</Tab>
					</TabList>
					<TabPanels>
						<TabPanel value="0">
							<form
								class="space-y-4 m-0"
								@submit.prevent
							>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.position"
										input-id="position"
										binary
									/>
									<label for="position"> {{ headerLabels.position }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.body"
										input-id="body"
										binary
									/>
									<label for="body"> {{ headerLabels.body }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.control_card"
										input-id="control_card"
										binary
									/>
									<label for="control_card"> {{ headerLabels.control_card }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.hose_and_nozzle"
										input-id="hose_and_nozzle"
										binary
									/>
									<label for="hose_and_nozzle"> {{ headerLabels.hoze_and_nozzle }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.instruction_and_label"
										input-id="instruction_and_label"
										binary
									/>
									<label for="instruction_and_label"> {{ headerLabels.instruction_and_label }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.mass"
										input-id="mass"
										binary
									/>
									<label for="mass"> {{ headerLabels.mass }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.pin_and_seal"
										input-id="pin_and_seal"
										binary
									/>
									<label for="pin_and_seal"> {{ headerLabels.pin_and_seal }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.pressure"
										input-id="pressure"
										binary
									/>
									<label for="pressure"> {{ headerLabels.pressure }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="inspectionForm.working_mechanism"
										input-id="working_mechanism"
										binary
									/>
									<label for="working_mechanism"> {{ headerLabels.working_mechanism }} </label>
								</div>

								<div
									class="flex flex-col gap-2"
								>
									<label for="note"> Not </label>
									<Textarea
										v-model="inspectionForm.note"
										rows="3"
									/>
								</div>
								<div class="flex flex-col items-start gap-2">
									<FileUpload
										mode="basic"
										custom-upload
										auto
										accept="image/*"
										class="p-button-outlined"
										choose-label="Resim sec"
										@select="onFileSelect"
									>
										<template #chooseicon>
											<i class="ri-camera-line" />
										</template>
									</FileUpload>
									<img
										v-if="inspectionForm.photo_url"
										:src="inspectionForm.photo_url"
										alt="Image"
										class="shadow-md rounded-xl w-64"
									>
								</div>
								<Button
									class="w-full mt-4"
									label="Bakim kaydi olustur"
									@click="saveInspectionForm"
								/>
							</form>
						</TabPanel>
						<TabPanel value="1">
							<form
								class="space-y-4 m-0"
								@submit.prevent
							>
								<div class="flex items-center gap-2">
									<Checkbox
										input-id="filling"
										binary
									/>
									<label for="filling"> DOLUM İŞLEMİ </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										input-id="triggger-valve"
										binary
									/>
									<label for="triggger-valve"> TETİK / VANA </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										input-id="manometer"
										binary
									/>
									<label for="manometer"> MANOMETRE </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										input-id="hose-nozzle"
										binary
									/>
									<label for="hose-nozzle"> HORTUM / LANS </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										input-id="wheel"
										binary
									/>
									<label for="wheel"> TEKERLEK  </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										input-id="wet-paint"
										binary
									/>
									<label for="wet-paint"> YAŞ BOYA  </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										input-id="hydrostatic-pressure-test"
										binary
									/>
									<label for="hydrostatic-pressure-test"> HİDROSTATİK BASINÇ TESTİ  </label>
								</div>
								<Button
									class="w-full mt-4"
									label="Dolum kaydi olustur"
								/>
							</form>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</div>
		</div>
		<Drawer
			v-model:visible="drawersShow.fill"
			header="Dolum kaydi"
			position="bottom"
			style="height: auto"
		>
			<div class="pt-8 border-t border-slate-200">
				<BaseLoader v-if="fillRecordLoading" />
				<ProductSummaryCard :data="fillRecordSummaryCardData" />
				<p class="mt-10 mb-16 text-lg font-semibold">
					Dolum tarihi {{ new Date().toLocaleDateString('tr-TR', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
					}) }}, bir sonraki dolum tarihi {{
						addYearToDate(new Date(), data?.product.refill_period).toLocaleDateString('tr-TR', {
							year: 'numeric',
							month: '2-digit',
							day: '2-digit',
						})
					}} olarak kaydedilecek, onayliyor musunuz ?
				</p>
				<footer class="flex justify-end px-4 py-6 space-x-4 -m-5 border-t border-slate-200">
					<Button
						label="Vazgeç"
						icon="ri-close-line"
						severity="secondary"
						size="large"
						@click="drawersShow.fill = false"
					/>
					<Button
						label="Kaydet"
						icon="ri-save-line"
						severity="primary"
						size="large"
						@click="saveFillRecord"
					/>
				</footer>
			</div>
		</Drawer>
		<Drawer
			v-model:visible="drawersShow.change"
			header="Degisim"
			position="full"
			style="height: auto"
		>
			<InspectionStepper
				:current-product-data="{
					product: data?.product,
					location: data?.location,
				}"
				@close="drawersShow.change = false"
			/>
		</Drawer>
	</div>
</template>
