<script setup lang="ts">
import imageCompression from 'browser-image-compression';
import type { FileUploadSelectEvent } from 'primevue';
import type { Database } from '~/types/database.types';
import { handleUploadImage } from '~/utils/handleUploadImage';
import {
	imageCompressionOptions,
	inspectionFormFields,
	fillFormFields,
	productStatusTypeLabels,
} from '~/constants';

type FetchError = {
	data?: {
		message?: string;
	};
	message?: string;
};

definePageMeta({
	layout: 'mobile',
});

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const { toTenantPath } = useTenant();
const activeTab = ref('0');
const lastInspectionDate = ref<Date | null>(null);
const showInspectionAlert = ref(false);
const compressedImage = ref<File | null>(null);
const inspectionFormLoading = ref(false);
const locationFormLoading = ref(false);
const buildingFormLoading = ref(false);
const showBuildingForm = ref(false);
const productEditVisible = ref(false);
const locationConfirmVisible = ref(false);
const buildings = ref<Database['public']['Tables']['location_buildings']['Row'][]>([]);
const newBuildingName = ref('');
const drawersShow = reactive({
	change: false,
	success: false,
	needChange: false,
});

const inspectionForm = reactive({
	fire_extinguisher_id: null,
	position: true,
	is_expiry: true,
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

const locationForm = reactive({
	buildingId: null as number | null,
	room: '',
	locationId: '',
});

const isLoading = computed(() => {
	return (
		status.value === 'pending'
		|| status.value === 'idle'
		|| inspectionFormLoading.value
	);
});

const loadingLabel = computed(() => {
	return status.value === 'pending' || status.value === 'idle'
		? 'YSC bilgileri hazırlanıyor'
		: 'Kayıt oluşturuluyor';
});

const statusBgColors: Record<
	Database['public']['Enums']['product_status'],
	string
> = {
	active: 'bg-green-600',
	damaged: 'bg-red-600',
	lost: 'bg-gray-500',
	spare: 'bg-yellow-500',
	scrap: 'bg-gray-900',
};

const statusBgColor = computed(() => {
	const currentStatus = data.value?.product.current_status;
	return currentStatus ? statusBgColors[currentStatus] : 'bg-gray-500';
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
	'is_expiry',
];

const { data, status, refresh } = await useAsyncData(`product-${String(route.params.id)}`, async () => {
	return await $fetch('/api/products/getByIdentifier', {
		params: { identifier: route.params.id },
	});
});

const editableProduct = computed(() => {
	if (!data.value) {
		return null;
	}

	return {
		...data.value.product,
		locations: data.value.location,
	};
});

const loadBuildings = async () => {
	const response = await $fetch<Database['public']['Tables']['location_buildings']['Row'][]>(
		'/api/location-buildings',
	);
	buildings.value = Array.isArray(response) ? response : [];
};

const resetLocationForm = () => {
	locationForm.buildingId = null;
	locationForm.room = '';
	locationForm.locationId = '';
};

const selectedBuildingName = computed(() => {
	return buildings.value.find(building => building.id === locationForm.buildingId)?.name ?? '';
});

const requestMoveProduct = () => {
	if (
		!data.value?.product.id
		|| !locationForm.buildingId
		|| !locationForm.room.trim()
		|| !locationForm.locationId.trim()
	) {
		toast.add({
			severity: 'warn',
			summary: 'Eksik bilgi',
			detail: 'Bina, bulunduğu yer ve YSC No alanlarını doldurun.',
			life: 3000,
		});
		return;
	}

	locationConfirmVisible.value = true;
};

const saveNewBuilding = async () => {
	const name = newBuildingName.value.trim();
	if (!name) {
		toast.add({
			severity: 'warn',
			summary: 'Uyarı',
			detail: 'Bina adı boş olamaz.',
			life: 2500,
		});
		return;
	}

	buildingFormLoading.value = true;
	try {
		const building = await $fetch<Database['public']['Tables']['location_buildings']['Row']>(
			'/api/location-buildings',
			{
				method: 'POST',
				body: { name },
			},
		);
		await loadBuildings();
		locationForm.buildingId = building.id;
		newBuildingName.value = '';
		showBuildingForm.value = false;
		toast.add({
			severity: 'success',
			summary: 'Başarılı',
			detail: 'Bina kaydedildi.',
			life: 2000,
		});
	}
	catch (error) {
		console.error('Error saving building:', error);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Bina kaydedilirken bir hata oluştu.',
			life: 3000,
		});
	}
	finally {
		buildingFormLoading.value = false;
	}
};

const moveProduct = async () => {
	if (
		!data.value?.product.id
		|| !locationForm.buildingId
		|| !locationForm.room.trim()
		|| !locationForm.locationId.trim()
	) {
		locationConfirmVisible.value = false;
		return;
	}

	locationFormLoading.value = true;
	try {
		await $fetch('/api/products/move', {
			method: 'POST',
			body: {
				productId: data.value.product.id,
				buildingId: locationForm.buildingId,
				room: locationForm.room,
				locationId: locationForm.locationId,
			},
		});

		locationConfirmVisible.value = false;
		resetLocationForm();
		toast.add({
			severity: 'success',
			summary: 'Başarılı',
			detail: 'Tüpün konumu güncellendi.',
			life: 2500,
		});

		await navigateTo(toTenantPath('/mobile'), { replace: true });
	}
	catch (error) {
		console.error('Error moving product:', error);
		const fetchError = error as FetchError;
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail:
        fetchError.data?.message
        || fetchError.message
        || 'Tüpün konumu güncellenirken bir hata oluştu.',
			life: 5000,
		});
	}
	finally {
		locationFormLoading.value = false;
	}
};

const refreshProduct = async () => {
	await refresh();
};

const inspectionAlert = computed(() => {
	const formattedDate = lastInspectionDate.value
		? new Date(lastInspectionDate.value).toLocaleDateString('tr-TR', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			})
		: '';

	return `Bu YSC için ${formattedDate} tarihinde bakım kaydı oluşturuldu. Yeni bir kayıt oluşturursanız aynı ay içinde birden fazla bakım kaydı bulunacak.`;
});

const isRefillDateExpired = computed(() => {
	const nextRefillDate = data.value?.product.next_refill_date;

	if (!nextRefillDate) {
		return false;
	}

	const refillDate = new Date(nextRefillDate);
	const today = new Date();

	refillDate.setHours(0, 0, 0, 0);
	today.setHours(0, 0, 0, 0);

	return refillDate < today;
});

const refillDateAlert = computed(() => {
	const nextRefillDate = data.value?.product.next_refill_date;

	if (!nextRefillDate) {
		return '';
	}

	return `Bu YSC'nin dolum süresi ${formatTurkishDate(nextRefillDate)} tarihinde dolmuş. Lütfen dolum işlemini planlayın.`;
});

const checkInspectionForm = () => {
	return controlFields.every(
		field => inspectionForm[field as keyof typeof inspectionForm] === true,
	);
};

async function onFileSelect(event: FileUploadSelectEvent) {
	const imageFile = event.files[0];
	const reader = new FileReader();
	reader.onload = (e) => {
		if (e.target && e.target.result) {
			inspectionForm.photo_url = e.target.result as string;
		}
	};

	reader.readAsDataURL(imageFile);

	try {
		const compressedFile = await imageCompression(
			imageFile,
			imageCompressionOptions,
		);
		compressedImage.value = compressedFile as File;
	}
	catch (error) {
		console.warn(error);
	}
}

async function saveInspectionForm() {
	const result = checkInspectionForm();
	inspectionFormLoading.value = true;
	try {
		const userId = (await supabase.auth.getUser()).data.user?.id;
		if (compressedImage.value) {
			inspectionForm.photo_url = await handleUploadImage(compressedImage.value);
		}
		const response = await $fetch('/api/inspections', {
			method: 'POST',
			body: {
				...inspectionForm,
				fire_extinguisher_id: data.value?.product.id,
				result,
				user_id: userId,
				date: formatDateOnlyForApi(new Date()),
			},
		});

		if (response) {
			$fetch('/api/transactions', {
				method: 'POST',
				body: {
					type: 'inspection',
					user: userId,
					product_id: data.value?.product.id,
					details: response.id,
				},
			});
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
	const isAnyItemSelected = Object.values(fillForm).some(
		value => typeof value === 'boolean' && value === true,
	);
	if (!isAnyItemSelected) {
		toast.add({
			severity: 'warn',
			summary: 'Uyarı',
			detail: 'Dolum kaydı oluşturmak için en az bir alan seçilmelidir.',
			life: 2000,
		});
		return;
	}
	inspectionFormLoading.value = true;
	const userId = (await supabase.auth.getUser()).data.user?.id;
	try {
		const response = await $fetch('/api/fill', {
			method: 'POST',
			body: {
				...fillForm,
				product_id: data.value?.product.id,
				user_id: userId,
			},
		});

		if (response) {
			const refillPeriod = data.value?.product.refill_period || 2;
			const now = new Date();
			const fillDate = now.toISOString().split('T')[0];
			const refillDate = new Date(now);
			refillDate.setFullYear(refillDate.getFullYear() + Number(refillPeriod));
			const formattedRefillDate = refillDate.toISOString().split('T')[0];
			const nextHydrostaticTestDate = new Date(now);
			nextHydrostaticTestDate.setFullYear(
				nextHydrostaticTestDate.getFullYear() + 4,
			);
			const formattedHydrostaticTestDate = nextHydrostaticTestDate
				.toISOString()
				.split('T')[0];

			await $fetch('/api/products', {
				method: 'PUT',
				body: {
					...data.value?.product,
					current_status: 'active',
					...(fillForm.filling
						? {
								refill_date: fillDate,
								next_refill_date: formattedRefillDate,
							}
						: {}),
					...(fillForm.hydrostatic_pressure_test
						? {
								hydrostatic_test_date: fillDate,
								next_hydrostatic_test_date: formattedHydrostaticTestDate,
							}
						: {}),
				},
			});

			$fetch('/api/transactions', {
				method: 'POST',
				body: {
					type: 'fill',
					user: userId,
					product_id: data.value?.product.id,
					details: response.id,
				},
			});
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
	finally {
		inspectionFormLoading.value = false;
	}
}

function isInSameMonth(dateInput: Date): boolean {
	const date = new Date(dateInput);
	const now = new Date();

	return (
		date.getFullYear() === now.getFullYear()
		&& date.getMonth() === now.getMonth()
	);
}

onMounted(async () => {
	await loadBuildings();
	const assetUid = data.value?.product.asset_uid;
	if (!assetUid) return;

	const latestInspections = await $fetch('/api/inspections/getLatestByAssetUid', {
		params: {
			asset_uid: assetUid,
			month: formatDateOnlyForApi(new Date())?.slice(0, 7),
		},
	});

	const latestInspection = latestInspections?.[0];
	const inspectionDate = latestInspection?.date;
	if (inspectionDate && isInSameMonth(new Date(inspectionDate))) {
		lastInspectionDate.value = new Date(inspectionDate);
		showInspectionAlert.value = true;
	}
});
</script>

<template>
	<div class="-mx-4 min-h-dvh bg-slate-100 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
		<header class="sticky top-0 z-30 mb-5 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
			<Button
				icon="ri-arrow-left-line"
				severity="secondary"
				text
				aria-label="Geri dön"
				@click="$router.push(toTenantPath('/mobile'))"
			/>
			<div class="min-w-0">
				<p class="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">
					Saha işlemi
				</p>
				<h1 class="truncate text-lg font-bold tracking-[-0.02em] text-slate-950">
					YSC detayı
				</h1>
			</div>
			<span
				v-if="data?.location.location_id"
				class="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600"
			>YSC {{ data.location.location_id }}</span>
		</header>
		<MobileLoading
			v-if="isLoading"
			:label="loadingLabel"
		/>
		<div
			v-else-if="status === 'error'"
			class="mx-4 flex flex-col gap-y-5 rounded-xl border border-red-200 bg-white p-5"
		>
			<span class="flex size-11 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600"><i class="ri-error-warning-line" /></span>
			<div>
				<h2 class="font-bold text-slate-900">
					YSC bulunamadı
				</h2><p class="mt-1 text-sm leading-6 text-slate-500">
					Tüp kodunu, QR kodunu veya YSC No bilgisini kontrol edip tekrar deneyin.
				</p>
			</div>
			<Button
				label="Aramaya dön"
				icon="ri-arrow-left-line"
				@click="$router.push(toTenantPath('/mobile'))"
			/>
		</div>

		<div
			v-else
			class="flex h-full flex-col px-4"
		>
			<section
				v-if="data?.product"
				class="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white"
			>
				<div
					class="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3"
				>
					<div class="min-w-0">
						<p class="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
							YSC
						</p>
						<h2 class="mt-0.5 truncate text-lg font-bold text-slate-950">
							{{ data.product.model_type }}
						</h2>
						<p class="text-sm text-slate-500">
							{{ data.product.unit ? `${data.product.unit}` : "Birim belirtilmemiş" }}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5">
						<span
							class="size-2 rounded-full"
							:class="statusBgColor"
						/>
						<span class="text-[10px] font-bold uppercase tracking-wide text-slate-600">{{
							productStatusTypeLabels[
								data.product
									.current_status as keyof typeof productStatusTypeLabels
							]
						}}</span>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-px bg-slate-200">
					<div class="col-span-2 bg-white px-4 py-3">
						<div class="flex items-start gap-3">
							<span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-600"><i class="ri-map-pin-line" /></span>
							<div class="min-w-0">
								<p class="text-xs text-slate-500">
									Konum
								</p><p class="mt-0.5 text-sm font-semibold text-slate-800">
									{{ data.location.room }}, {{ data.location.building_id.name }}
								</p>
							</div>
						</div>
					</div>
					<div class="bg-white px-4 py-3">
						<p class="text-xs text-slate-500">
							YSC kodu
						</p><p class="mt-1 break-all text-sm font-semibold text-slate-800">
							{{ data.product.asset_code }}
						</p>
					</div>
					<div class="bg-white px-4 py-3">
						<p class="text-xs text-slate-500">
							Seri no
						</p><p class="mt-1 text-sm font-semibold text-slate-800">
							{{ data.product.serial_number ?? "Belirtilmemiş" }}
						</p>
					</div>
					<div class="bg-white px-4 py-3">
						<p class="text-xs text-slate-500">
							Son dolum
						</p><p class="mt-1 text-sm font-semibold text-slate-800">
							{{ formatTurkishDate(data.product.refill_date) }}
						</p>
					</div>
					<div class="bg-white px-4 py-3">
						<p class="text-xs text-slate-500">
							Sonraki dolum
						</p><p class="mt-1 text-sm font-semibold text-slate-800">
							{{ formatTurkishDate(data.product.next_refill_date) }}
						</p>
					</div>
					<div class="bg-white px-4 py-3">
						<p class="text-xs text-slate-500">
							Hidrostatik test
						</p><p class="mt-1 text-sm font-semibold text-slate-800">
							{{ data.product.hydrostatic_test_date ? formatTurkishDate(data.product.hydrostatic_test_date) : "Belirtilmemiş" }}
						</p>
					</div>
					<div class="bg-white px-4 py-3">
						<p class="text-xs text-slate-500">
							Dolum periyodu
						</p><p class="mt-1 text-sm font-semibold text-slate-800">
							{{ data.product.refill_period }} yıl
						</p>
					</div>
				</div>
			</section>
			<div
				v-if="isRefillDateExpired"
				class="my-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5"
			>
				<i class="ri-calendar-close-line mt-0.5 text-xl text-red-600" />
				<div>
					<p class="text-sm font-bold text-red-900">
						Dolum tarihi geçti
					</p><p class="mt-1 text-xs leading-5 text-red-800/80">
						{{ refillDateAlert }}
					</p>
				</div>
			</div>
			<div
				v-if="showInspectionAlert"
				class="my-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5"
			>
				<i class="ri-history-line mt-0.5 text-xl text-amber-600" />
				<div>
					<p class="text-sm font-bold text-amber-900">
						Bu ay bakım kaydı var
					</p><p class="mt-1 text-xs leading-5 text-amber-800/80">
						{{ inspectionAlert }}
					</p>
				</div>
			</div>
			<div>
				<Tabs
					v-model:value="activeTab"
					class="mobile-transaction-tabs"
				>
					<TabList>
						<Tab
							value="0"
							class="w-1/3"
						>
							Bakım
						</Tab>
						<Tab
							value="1"
							class="w-1/3"
						>
							Dolum
						</Tab>
						<Tab
							value="2"
							class="w-1/3"
						>
							Düzenle
						</Tab>
					</TabList>
					<TabPanels>
						<TabPanel value="0">
							<form
								class="m-0"
								@submit.prevent
							>
								<div
									v-for="(field, index) in inspectionFormFields"
									:key="field.key"
									class="flex min-h-12 items-center gap-3 py-3"
									:class="index < inspectionFormFields.length - 1 ? 'border-b border-slate-100' : ''"
								>
									<Checkbox
										v-model="
											inspectionForm[field.key as keyof typeof inspectionForm]
										"
										:input-id="field.key"
										binary
									/>
									<label
										:for="field.key"
										class="flex-1 text-sm font-medium"
									>{{ field.label }}</label>
								</div>

								<div class="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-5">
									<label
										for="note"
										class="text-sm font-medium text-slate-700"
									>Not</label>
									<Textarea
										v-model="inspectionForm.note"
										rows="3"
									/>
								</div>
								<div class="mt-5 flex flex-col items-start gap-2">
									<!-- auto attributesi dosyanin select olduktan hemen sonra otomatik olarak update olmasini sagliyor.
										Ayni zamanda yuklenen dosyanin isminin gozukmesini engelledigi icin kullandim. -->
									<FileUpload
										mode="basic"
										custom-upload
										auto
										accept="image/*"
										class="p-button-outlined p-button-secondary"
										choose-label="Cihazın fotoğrafını çek/yükle"
										:pt="{ input: { capture: 'environment' } }"
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
										class="shadow-md rounded-xl w-64 sm:w-12"
									>
								</div>
								<Button
									class="mt-5 w-full"
									label="Bakım kaydı oluştur"
									@click="saveInspectionForm"
								/>
							</form>
						</TabPanel>
						<TabPanel value="1">
							<form
								class="m-0"
								@submit.prevent
							>
								<div
									v-for="(field, index) in fillFormFields"
									:key="field.key"
									class="flex min-h-12 items-center gap-3 py-3"
									:class="index < fillFormFields.length - 1 ? 'border-b border-slate-100' : ''"
								>
									<Checkbox
										v-model="fillForm[field.key as keyof typeof fillForm]"
										:input-id="field.key"
										binary
									/>
									<label
										:for="field.key"
										class="flex-1 text-sm font-medium"
									>{{ field.label }}</label>
								</div>
								<Button
									class="mt-5 w-full"
									label="Dolum kaydı oluştur"
									@click="saveFillRecord"
								/>
							</form>
						</TabPanel>
						<TabPanel value="2">
							<div class="space-y-6">
								<section class="space-y-4">
									<div class="flex items-center justify-between gap-3">
										<h3 class="font-semibold">
											Konum değiştir
										</h3>
										<Button
											size="small"
											severity="secondary"
											outlined
											:label="showBuildingForm ? 'Vazgeç' : 'Yeni bina ekle'"
											@click="showBuildingForm = !showBuildingForm"
										/>
									</div>

									<div
										v-if="showBuildingForm"
										class="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-3"
									>
										<label
											for="new-building-name"
											class="block text-sm font-medium"
										>
											Yeni bina/alan adı
										</label>
										<InputText
											id="new-building-name"
											v-model="newBuildingName"
											class="w-full"
										/>
										<Button
											class="w-full"
											label="Binayı kaydet"
											:loading="buildingFormLoading"
											@click="saveNewBuilding"
										/>
									</div>

									<div class="flex flex-col gap-2">
										<label for="move-building">Bulunduğu bina/alan</label>
										<Select
											id="move-building"
											v-model="locationForm.buildingId"
											:options="buildings"
											option-label="name"
											option-value="id"
											placeholder="Bina/alan seçin"
											class="w-full"
											filter
										/>
									</div>

									<div class="flex flex-col gap-2">
										<label for="move-room">Bulunduğu yer</label>
										<InputText
											id="move-room"
											v-model="locationForm.room"
											class="w-full"
										/>
									</div>

									<div class="flex flex-col gap-2">
										<label for="move-location-id">YSC No</label>
										<InputText
											id="move-location-id"
											v-model="locationForm.locationId"
											class="w-full"
										/>
									</div>

									<Button
										class="w-full"
										label="Konumu güncelle"
										@click="requestMoveProduct"
									/>
								</section>

								<Divider />

								<section class="space-y-3">
									<h3 class="font-semibold">
										Diğer tüp bilgileri
									</h3>
									<p class="text-sm text-slate-600">
										Dolum periyodu, seri no, tarihler ve teknik bilgileri düzenleyebilirsiniz.
									</p>
									<Button
										class="w-full"
										severity="secondary"
										outlined
										label="Tüp bilgilerini düzenle"
										@click="productEditVisible = true"
									/>
								</section>
							</div>
						</TabPanel>
					</TabPanels>
				</Tabs>
			</div>
		</div>
		<Drawer
			v-model:visible="drawersShow.change"
			position="full"
			class="mobile-full-drawer"
		>
			<template #header>
				<AppDialogHeader
					title="YSC değişimi"
					subtitle="Arızalı YSC'yi yenisiyle değiştirin."
				/>
			</template>
			<InspectionStepper
				:current-product-data="{
					product: data?.product,
					location: data?.location,
				}"
				@close="drawersShow.change = false"
			/>
		</Drawer>
		<TransactionInfoDialog
			v-model:is-active="drawersShow.needChange"
			@open-change-dialog="drawersShow.change = true"
		/>
		<TransactionsSuccessDialog
			:visible="drawersShow.success"
			:title="
				activeTab === '0'
					? 'Bakım kaydı oluşturuldu'
					: 'Dolum kaydı oluşturuldu'
			"
			:description="activeTab === '0' ? 'YSC kontrol sonucu bu ayki bakım listesine işlendi.' : 'Dolum işlemi ve yeni dolum tarihi sisteme işlendi.'"
			@close="drawersShow.success = false"
		/>
		<ProductEditDialog
			v-model:visible="productEditVisible"
			:product="editableProduct"
			@updated="refreshProduct"
		/>
		<Dialog
			v-model:visible="locationConfirmVisible"
			modal
			class="mobile-dialog"
			:closable="!locationFormLoading"
			:style="{ width: 'min(26rem, calc(100vw - 1.5rem))' }"
		>
			<template #header>
				<AppDialogHeader
					title="Konum değişikliğini onaylayın"
					subtitle="Kaydetmeden önce mevcut ve yeni konumu kontrol edin."
				/>
			</template>

			<div class="space-y-4">
				<div class="rounded-xl bg-slate-50 p-3.5">
					<p class="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
						Taşınacak cihaz
					</p>
					<p class="mt-1 break-all text-sm font-semibold text-slate-900">
						{{ data?.product.asset_code }}
					</p>
				</div>

				<div class="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
					<div class="min-w-0 rounded-xl border border-slate-200 p-3">
						<p class="text-[10px] font-bold uppercase tracking-wide text-slate-400">
							Mevcut konum
						</p>
						<p class="mt-2 text-sm font-semibold text-slate-900">
							YSC {{ data?.location.location_id }}
						</p>
						<p class="mt-1 break-words text-xs leading-5 text-slate-500">
							{{ data?.location.building_id.name }} · {{ data?.location.room }}
						</p>
					</div>
					<span class="flex items-center justify-center text-lg text-slate-400">
						<i class="ri-arrow-right-line" />
					</span>
					<div class="min-w-0 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
						<p class="text-[10px] font-bold uppercase tracking-wide text-blue-500">
							Yeni konum
						</p>
						<p class="mt-2 break-words text-sm font-semibold text-slate-900">
							YSC {{ locationForm.locationId.trim() }}
						</p>
						<p class="mt-1 break-words text-xs leading-5 text-slate-600">
							{{ selectedBuildingName }} · {{ locationForm.room.trim() }}
						</p>
					</div>
				</div>

				<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button
						label="Vazgeç"
						severity="secondary"
						text
						:disabled="locationFormLoading"
						@click="locationConfirmVisible = false"
					/>
					<Button
						label="Onayla ve taşı"
						icon="ri-map-pin-line"
						:loading="locationFormLoading"
						@click="moveProduct"
					/>
				</div>
			</div>
		</Dialog>
	</div>
</template>
