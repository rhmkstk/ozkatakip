<script setup lang="ts">
import imageCompression from 'browser-image-compression';
import type { FileUploadSelectEvent } from 'primevue';
import { headerLabels, fillLabels, imageCompressionOptions } from '~/constants';

definePageMeta({
	layout: 'mobile',
});

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();

const activeTab = ref('0');
const compressedImage = ref<File | null>(null);
const inspectionFormLoading = ref(false);
const drawersShow = reactive({
	change: false,
	success: false,
	needChange: false,
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

const fillForm = reactive({
	filling: false,
	trigger_valve: false,
	manometer: false,
	hose_and_nozzle: false,
	wheel: false,
	paint: false,
	hydrostatic_pressure_test: false,
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

async function onFileSelect(event: FileUploadSelectEvent) {
	const imageFile = event.files[0];

	try {
		const compressedFile = await imageCompression(imageFile, imageCompressionOptions);
		compressedImage.value = compressedFile as File;
	}
	catch (error) {
		console.warn(error);
	}
}

async function saveInspectionForm() {
	const result = controlFields.every(field => inspectionForm[field as keyof typeof inspectionForm] === true);
	inspectionFormLoading.value = true;
	try {
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
			inspectionForm.photo_url = result?.signedUrl || null;
		}
		const response = await $fetch('/api/inspections', {
			method: 'POST',
			body: {
				...inspectionForm,
				fire_extinguisher_id: data.value?.product.id,
				result,
			},
		});

		const userId = (await supabase.auth.getUser()).data.user?.id;

		$fetch('/api/transactions', {
			method: 'POST',
			body: {
				type: 'bakım',
				user: userId,
				product_id: data.value?.product.id,
				details: response.id,
			},
		});

		if (response) {
			inspectionFormLoading.value = false;
			if (result) {
				drawersShow.success = true;
				return;
			}
			else {
				drawersShow.needChange = true;
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
}

async function saveFillRecord() {
	inspectionFormLoading.value = true;
	try {
		const response = await $fetch('/api/fill', {
			method: 'POST',
			body: {
				...fillForm,
				product_id: data.value?.product.id,
			},
		});

		if (response) {
			const userId = (await supabase.auth.getUser()).data.user?.id;

			$fetch('/api/transactions', {
				method: 'POST',
				body: {
					type: 'dolum',
					user: userId,
					product_id: data.value?.product.id,
					details: response.id,
				},
			});
			inspectionFormLoading.value = false;
			drawersShow.success = true;
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
			</header>
			<div
				v-if="data?.product"
				class="bg-slate-100 p-2 rounded-lg space-x-3 mb-4 flex"
			>
				<img
					src="https://www.capitalsolutions.pk/wp-content/uploads/2021/06/DCP6Kg-ABC-2.jpg"
					alt="fire-estinguisher"
					class="object-cover max-w-full w-1/3 h-[200px] rounded"
				>
				<div class="pt-2 px-2 flex-1 flex flex-col">
					<h4 class="text-sm font-semibold leading-3">
						{{ data.product.unit }} KG
					</h4>
					<h3 class="text-lg font-semibold truncate">
						{{ data.product.model_type }}
					</h3>

					<div class="flex items-center space-x-1">
						<span class="size-1.5 rounded-full bg-green-600" />
						<span class="text-xs text-slate-500 uppercase">{{ data.product.current_status }}</span>
					</div>
					<div class="flex space-x-1 mt-4">
						<i class="ri-map-pin-line -mt-0.5" />
						<span class="text-sm uppercase">{{ data.location.room }}	, {{ data.location.building_id.name }} </span>
					</div>
					<div class="flex space-x-1 mt-2">
						<i class="ri-calendar-line -mt-0.5" />
						<p class="text-sm text-gray-700">
							Dolum tarihi: <b>{{ data.product.refill_date }}</b>, Hidrastatik test tarihi: <b>{{ data.product.hydrostatic_test_date }}</b>
						</p>
					</div>
				</div>
			</div>
			<div class="card">
				<Tabs v-model:value="activeTab">
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
										v-model="fillForm.filling"
										input-id="filling"
										binary
									/>
									<label for="filling"> {{ fillLabels.filling }}  </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="fillForm.trigger_valve"
										input-id="triggger-valve"
										binary
									/>
									<label for="triggger-valve"> {{ fillLabels.trigger_valve }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="fillForm.manometer"
										input-id="manometer"
										binary
									/>
									<label for="manometer"> {{ fillLabels.manometer }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="fillForm.hose_and_nozzle"
										input-id="hose-nozzle"
										binary
									/>
									<label for="hose-nozzle"> {{ fillLabels.hose_and_nozzle }} </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="fillForm.wheel"
										input-id="wheel"
										binary
									/>
									<label for="wheel"> {{ fillLabels.wheel }}  </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="fillForm.paint"
										input-id="wet-paint"
										binary
									/>
									<label for="wet-paint"> {{ fillLabels.paint }}  </label>
								</div>
								<div class="flex items-center gap-2">
									<Checkbox
										v-model="fillForm.hydrostatic_pressure_test"
										input-id="hydrostatic-pressure-test"
										binary
									/>
									<label for="hydrostatic-pressure-test"> {{ fillLabels.hydrostatic_pressure_test }}  </label>
								</div>
								<Button
									class="w-full mt-4"
									label="Dolum kaydi olustur"
									@click="saveFillRecord"
								/>
							</form>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</div>
		</div>
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
		<Dialog
			v-model:visible="drawersShow.needChange"
			:show-header="false"
			:modal="true"
		>
			<div class="flex flex-col items-center pt-4">
				<div class="flex items-center space-x-1">
					<h3 class="text-lg font-semibold">
						Bakim kaydi basarıyla olusturuldu!
					</h3>
					<i class="ri-check-line text-green-600 text-4xl" />
				</div>

				<Message
					severity="warn"
					class="my-6"
				>
					YSC kullanima uygun olmadigi icin degisim gerektirmektedir. Lütfen degisim kaydi olusturunuz!
				</Message>
			</div>
			<template #footer>
				<Button
					label="Degisim kaydi olustur"
					severity="primary"
					size="large"
					class="mx-auto"
					@click="drawersShow.needChange = false; drawersShow.change = true"
				/>
			</template>
		</Dialog>
		<TransactionsSuccessDialog
			:visible="drawersShow.success"
			:title="activeTab === '0' ? 'Bakim kaydi basariyla olusturuldu!' : 'Dolum kaydi basariyla olusturuldu!'"
			@close="drawersShow.success = false"
		/>
	</div>
</template>
