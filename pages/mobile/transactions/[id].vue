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
const showInspectionAlert = ref(false);
const lastInspectionDate = ref<Date | null>(null);
const drawersShow = reactive({
	fill: false,
	change: false,
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
onMounted(async () => {
	const id = route.params.id as string;
	console.log('Mounted with id:', id);
	const data = await $fetch('/api/inspections/getByLocationId', {
		params: { location_id: id },
	});
	console.log('Fetched inspection data:', data[0].created_at);
	lastInspectionDate.value = data[0].created_at;
	if (lastInspectionDate.value) {
		isInLast30Days(lastInspectionDate.value)
			? showInspectionAlert.value = true
			: showInspectionAlert.value = false;
	}
});

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

const inspectionAlert = computed(() => {
	const formattedDate = lastInspectionDate.value
		? new Date(lastInspectionDate.value).toLocaleDateString('tr-TR', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			})
		: '';

	return	`  Bu YSC numarasina ${formattedDate} tarihinde bir bakım kaydı girilmiş. Yine de bakım kaydı oluşturmak istiyor musunuz?`;
});

const summaryCardData = computed(() => {
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
		];
	}
	return [];
});

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

function isInLast30Days(dateString: Date): boolean {
	const date = new Date(dateString);
	const now = new Date();

	// Calculate the timestamp for 30 days ago
	const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	// Check if date is after or equal to days30Ago and before or equal to now
	return date >= days30Ago && date <= now;
}
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
			// await $fetch('/api/transactions', {
			// 	method: 'POST',
			// 	body: {
			// 		type: 'bakım',
			// 		product_id: data.value?.product.id,
			// 		details: '',
			// 	},
			// });

			toast.add({
				severity: 'success',
				summary: 'Başarılı',
				detail: 'Bakim kaydı başarıyla oluşturuldu.',
				life: 2000,
			});
			drawersShow.fill = false;
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
				<Button
					class="ml-auto"
					icon="ri-battery-charge-line"
					label="Dolum"
					severity="contrast"
					@click="drawersShow.fill = true"
				/>
				<Button
					icon="ri-repeat-line"
					label="Degisim"
					severity="contrast"
					@click="drawersShow.change = true"
				/>
			</header>
			<ProductSummaryCard
				v-if="data?.product && data?.location"
				:data="summaryCardData"
			/>

			<Message
				v-if="showInspectionAlert"
				severity="warn"
				class="mt-4"
			>
				{{ inspectionAlert }}
			</Message>
			<!-- <div
				v-if="showInspectionAlert"
				class="bg-yellow-100 text-yellow-800 p-4 rounded-lg mb-4 mt-4"
			>
				<p class="text-sm">
					{{ inspectionAlert }}
				</p>
			</div> -->
			<div class="mt-auto pb-4">
				<h5 class="text-3xl font-semibold mt-8">
					Bakim kayit formu
				</h5>
				<form
					class="py-8 space-y-4"
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
							severity="secondary"
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
				</form>
				<Button
					size="large"
					class="w-full"
					label="Bakim kaydi olustur"
					@click="saveInspectionForm"
				/>
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
			position="bottom"
			style="height: auto"
		>
			<ProductChange
				:current-product-data="{
					product: data?.product,
					location: data?.location,
				}"
				@close="drawersShow.change = false"
			/>
		</drawer>
	</div>
</template>
