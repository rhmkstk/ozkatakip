<script setup lang="ts">
import imageCompression from 'browser-image-compression';
import type { FileUploadSelectEvent } from 'primevue';
import { imageCompressionOptions } from '~/constants';
import { handleUploadImage } from '~/utils/handleUploadImage';
import type { Tables } from '~/types/database.types';

type LocationRow = Tables<'locations'>;
type BuildingRow = Tables<'location_buildings'>;
type LocationWithBuilding = LocationRow & { building_id: BuildingRow | null };
type ProductBundle = {
	product: Tables<'products'> | null;
	location: LocationWithBuilding | null;
};

const props = defineProps<{
	currentProductData: {
		product: Tables<'products'>;
		location: LocationWithBuilding;
	};
}>();

const supabase = useSupabaseClient();
const toast = useToast();
const activeStep = ref<'1' | '2' | '3'>('1');
const loading = ref(false);
const showScanner = ref(false);
const successVisible = ref(false);
const newProductIdentifier = ref('');
const compressedImage = ref<File | null>(null);
const photoUrl = ref<string | null>(null);
const selectedNewProductRefillPeriod = ref<number | null>(null);
const newProductData = reactive<ProductBundle>({ product: null, location: null });

const refillPeriodOptions = [
	{ label: '1 yıl', value: 1 },
	{ label: '2 yıl', value: 2 },
	{ label: '3 yıl', value: 3 },
	{ label: '4 yıl', value: 4 },
];

const steps = [
	{ value: '1', label: 'Yeni YSC' },
	{ value: '2', label: 'Karşılaştır' },
	{ value: '3', label: 'Onayla' },
] as const;

const stepIndex = computed(() => Number(activeStep.value));
const isRefillPeriodDirty = computed(() => {
	return Boolean(newProductData.product)
		&& newProductData.product?.refill_period !== selectedNewProductRefillPeriod.value;
});

const summaryRows = (product: Tables<'products'> | null, location: LocationWithBuilding | null) => [
	{ label: 'YSC No', value: location?.location_id || '—' },
	{ label: 'Model', value: product?.model_type || 'Belirtilmemiş' },
	{ label: 'Bina', value: location?.building_id?.name || 'Belirtilmemiş' },
	{ label: 'Konum', value: location?.room || 'Belirtilmemiş' },
	{ label: 'Dolum periyodu', value: product?.refill_period ? `${product.refill_period} yıl` : 'Belirtilmemiş' },
];

const currentSummary = computed(() => summaryRows(
	props.currentProductData.product,
	props.currentProductData.location,
));
const newSummary = computed(() => summaryRows(
	newProductData.product,
	newProductData.location,
));

const getNewProductData = async (identifier: string, showError = true) => {
	const normalized = identifier.trim();
	if (!normalized) return false;

	loading.value = true;
	try {
		const response = await $fetch('/api/products/getByIdentifier', {
			query: { identifier: normalized },
		});
		if (response.product.id === props.currentProductData.product.id) {
			toast.add({
				severity: 'warn',
				summary: 'Farklı bir YSC seçin',
				detail: 'Mevcut YSC, değişim ürünü olarak kullanılamaz.',
				life: 3000,
			});
			return false;
		}
		newProductData.location = response.location;
		newProductData.product = response.product;
		selectedNewProductRefillPeriod.value = response.product.refill_period ?? null;
		return true;
	}
	catch (error) {
		console.error('Error fetching replacement product:', error);
		if (showError) {
			toast.add({
				severity: 'error',
				summary: 'YSC bulunamadı',
				detail: 'Tüp kodunu, QR kodunu veya YSC No bilgisini kontrol edin.',
				life: 3500,
			});
		}
		return false;
	}
	finally {
		loading.value = false;
	}
};

const findNewProduct = async (identifier: string) => {
	if (await getNewProductData(identifier)) activeStep.value = '2';
};

const updateNewProductRefillPeriod = async () => {
	if (!newProductData.product?.id || selectedNewProductRefillPeriod.value === null) return;

	loading.value = true;
	try {
		await $fetch('/api/products', {
			method: 'PUT',
			body: {
				id: newProductData.product.id,
				refill_period: selectedNewProductRefillPeriod.value,
			},
		});
		newProductData.product.refill_period = selectedNewProductRefillPeriod.value;
		toast.add({
			severity: 'success',
			summary: 'Güncellendi',
			detail: 'Yeni YSC dolum periyodu güncellendi.',
			life: 2000,
		});
	}
	catch (error) {
		console.error('Error updating refill period:', error);
		toast.add({
			severity: 'error',
			summary: 'Hata',
			detail: 'Dolum periyodu güncellenemedi.',
			life: 2500,
		});
	}
	finally {
		loading.value = false;
	}
};

const applyChanges = async () => {
	if (!newProductData.product || !newProductData.location) return false;

	const details = `Arızalı YSC No: ${props.currentProductData.location.location_id}, yeni YSC No: ${newProductData.location.location_id}`;
	const response = await $fetch('/api/products/switch', {
		method: 'POST',
		body: {
			currentProduct: props.currentProductData.product,
			newProduct: newProductData.product,
			details,
		},
	});

	if (!response.success) return false;
	return true;
};

const createReplacementInspection = async () => {
	const userId = (await supabase.auth.getUser()).data.user?.id;
	if (compressedImage.value) {
		photoUrl.value = await handleUploadImage(compressedImage.value);
	}

	const inspection = await $fetch('/api/inspections', {
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
			photo_url: photoUrl.value,
			user_id: userId,
			date: formatDateOnlyForApi(new Date()),
			is_expiry: true,
			fire_extinguisher_id: newProductData.product?.id,
		},
	});

	await $fetch('/api/transactions', {
		method: 'POST',
		body: {
			type: 'inspection',
			user: userId,
			product_id: newProductData.product?.id,
			details: inspection.id,
		},
	});
};

const completeChange = async () => {
	loading.value = true;
	try {
		const changed = await applyChanges();
		if (!changed) throw new Error('Switch failed');
		await createReplacementInspection();
		successVisible.value = true;
	}
	catch (error) {
		console.error('Error completing product change:', error);
		toast.add({
			severity: 'error',
			summary: 'İşlem tamamlanamadı',
			detail: 'Değişim kaydı oluşturulurken bir hata oluştu.',
			life: 3500,
		});
	}
	finally {
		loading.value = false;
	}
};

const onFileSelect = async (event: FileUploadSelectEvent) => {
	const imageFile = event.files[0];
	photoUrl.value = URL.createObjectURL(imageFile);
	try {
		compressedImage.value = await imageCompression(imageFile, imageCompressionOptions) as File;
	}
	catch (error) {
		console.warn(error);
		compressedImage.value = imageFile;
	}
};
</script>

<template>
	<div class="relative min-h-full">
		<MobileLoading
			v-if="loading"
			label="Değişim işlemi yapılıyor"
		/>

		<nav class="mb-6 grid grid-cols-3 border-b border-slate-200 bg-white px-2 pb-4">
			<div
				v-for="step in steps"
				:key="step.value"
				class="relative flex flex-col items-center"
			>
				<span
					class="z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition"
					:class="stepIndex >= Number(step.value) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-400'"
				>
					<i
						v-if="stepIndex > Number(step.value)"
						class="ri-check-line text-base"
					/>
					<span v-else>{{ step.value }}</span>
				</span>
				<span
					class="mt-1.5 text-[10px] font-semibold"
					:class="activeStep === step.value ? 'text-blue-700' : 'text-slate-400'"
				>{{ step.label }}</span>
			</div>
		</nav>

		<section
			v-if="activeStep === '1'"
			class="space-y-5 pb-5"
		>
			<div>
				<p class="app-kicker">
					1. adım
				</p>
				<h3 class="mt-1 text-xl font-bold text-slate-950">
					Yeni YSC'yi seçin
				</h3>
				<p class="mt-2 text-sm leading-6 text-slate-500">
					Yerine takılacak YSC'yi QR, tüp kodu veya YSC No ile bulun.
				</p>
			</div>

			<div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
				<p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
					Değiştirilecek YSC
				</p>
				<div class="flex items-center justify-between gap-3">
					<div class="min-w-0">
						<p class="truncate text-sm font-bold text-slate-900">
							YSC {{ currentProductData.location.location_id }}
						</p>
						<p class="truncate text-xs text-slate-500">
							{{ currentProductData.location.building_id?.name }} · {{ currentProductData.location.room }}
						</p>
					</div>
					<span class="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">Arızalı</span>
				</div>
			</div>

			<form
				class="space-y-3"
				@submit.prevent="findNewProduct(newProductIdentifier)"
			>
				<div class="form-item">
					<label for="new_product_identifier">Tüp kodu veya YSC No</label>
					<div class="flex gap-2">
						<InputText
							id="new_product_identifier"
							v-model="newProductIdentifier"
							placeholder="Kod veya YSC No"
							class="min-w-0 flex-1"
						/>
						<Button
							type="submit"
							label="Bul"
							:disabled="!newProductIdentifier.trim()"
						/>
					</div>
				</div>
				<div class="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
					<span class="h-px flex-1 bg-slate-200" /><span>veya</span><span class="h-px flex-1 bg-slate-200" />
				</div>
				<Button
					class="w-full"
					icon="ri-qr-scan-2-line"
					severity="secondary"
					outlined
					label="QR kodu tara"
					@click="showScanner = true"
				/>
			</form>
		</section>

		<section
			v-else-if="activeStep === '2'"
			class="space-y-5 pb-5"
		>
			<div>
				<p class="app-kicker">
					2. adım
				</p>
				<h3 class="mt-1 text-xl font-bold text-slate-950">
					Bilgileri karşılaştırın
				</h3>
				<p class="mt-2 text-sm leading-6 text-slate-500">
					Mevcut ve yeni YSC bilgilerini kontrol edin. Bu adımda henüz kayıt değişmez.
				</p>
			</div>

			<div class="space-y-3">
				<div class="overflow-hidden rounded-xl border border-red-200 bg-white">
					<div class="flex items-center justify-between bg-red-50 px-4 py-2.5">
						<strong class="text-xs text-red-700">Çıkarılacak YSC</strong><i class="ri-logout-box-r-line text-red-500" />
					</div>
					<dl class="divide-y divide-slate-100 px-4">
						<div
							v-for="row in currentSummary"
							:key="row.label"
							class="flex justify-between gap-4 py-2.5 text-sm"
						>
							<dt class="text-slate-500">
								{{ row.label }}
							</dt><dd class="truncate font-semibold text-slate-800">
								{{ row.value }}
							</dd>
						</div>
					</dl>
				</div>
				<div class="flex justify-center text-2xl text-slate-300">
					<i class="ri-arrow-down-line" />
				</div>
				<div class="overflow-hidden rounded-xl border border-emerald-200 bg-white">
					<div class="flex items-center justify-between bg-emerald-50 px-4 py-2.5">
						<strong class="text-xs text-emerald-700">Takılacak YSC</strong><i class="ri-login-box-line text-emerald-500" />
					</div>
					<dl class="divide-y divide-slate-100 px-4">
						<div
							v-for="row in newSummary"
							:key="row.label"
							class="flex justify-between gap-4 py-2.5 text-sm"
						>
							<dt class="text-slate-500">
								{{ row.label }}
							</dt><dd class="truncate font-semibold text-slate-800">
								{{ row.value }}
							</dd>
						</div>
					</dl>
				</div>
			</div>

			<div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
				<label
					for="new-product-refill-period"
					class="mb-2 block text-sm font-semibold text-slate-700"
				>Yeni YSC dolum periyodu</label>
				<div class="flex gap-2">
					<Select
						id="new-product-refill-period"
						v-model="selectedNewProductRefillPeriod"
						:options="refillPeriodOptions"
						option-label="label"
						option-value="value"
						class="min-w-0 flex-1"
					/>
					<Button
						icon="ri-save-line"
						aria-label="Periyodu kaydet"
						:disabled="!isRefillPeriodDirty"
						@click="updateNewProductRefillPeriod"
					/>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-2 pt-2">
				<Button
					label="Geri"
					icon="ri-arrow-left-line"
					severity="secondary"
					outlined
					@click="activeStep = '1'"
				/>
				<Button
					label="Devam"
					icon="ri-arrow-right-line"
					icon-pos="right"
					@click="activeStep = '3'"
				/>
			</div>
		</section>

		<section
			v-else
			class="space-y-5 pb-5"
		>
			<div>
				<p class="app-kicker">
					3. adım
				</p>
				<h3 class="mt-1 text-xl font-bold text-slate-950">
					Değişimi onaylayın
				</h3>
				<p class="mt-2 text-sm leading-6 text-slate-500">
					Onayladığınızda değişim kaydı ve yeni YSC için bakım kaydı birlikte oluşturulur.
				</p>
			</div>

			<div class="rounded-xl border border-blue-200 bg-blue-50 p-4">
				<div class="flex items-center gap-3">
					<span class="flex size-10 items-center justify-center rounded-full bg-white text-xl text-blue-600"><i class="ri-swap-line" /></span>
					<div class="min-w-0">
						<p class="text-xs text-blue-600">
							Değişim özeti
						</p>
						<p class="truncate text-sm font-bold text-blue-950">
							YSC {{ currentProductData.location.location_id }} → YSC {{ newProductData.location?.location_id }}
						</p>
					</div>
				</div>
			</div>

			<div class="rounded-xl border border-slate-200 bg-white p-4">
				<p class="text-sm font-semibold text-slate-800">
					Yeni YSC fotoğrafı
				</p>
				<p class="mt-1 text-xs leading-5 text-slate-500">
					Saha kaydını güçlendirmek için fotoğraf ekleyebilirsiniz.
				</p>
				<FileUpload
					mode="basic"
					custom-upload
					auto
					accept="image/*"
					class="p-button-outlined p-button-secondary mt-4 w-full"
					choose-label="Fotoğraf çek veya yükle"
					:pt="{ input: { capture: 'environment' } }"
					@select="onFileSelect"
				>
					<template #chooseicon>
						<i class="ri-camera-line" />
					</template>
				</FileUpload>
				<img
					v-if="photoUrl"
					:src="photoUrl"
					alt="Yeni YSC fotoğrafı"
					class="mt-3 aspect-video w-full rounded-lg object-cover"
				>
			</div>

			<div class="grid grid-cols-[auto_1fr] gap-2 pt-2">
				<Button
					icon="ri-arrow-left-line"
					aria-label="Geri"
					severity="secondary"
					outlined
					@click="activeStep = '2'"
				/>
				<Button
					label="Değişimi tamamla"
					icon="ri-check-line"
					icon-pos="right"
					@click="completeChange"
				/>
			</div>
		</section>

		<QRScanner
			v-if="showScanner"
			@close="showScanner = false"
			@scan-complete="(identifier: string) => { newProductIdentifier = identifier; showScanner = false; findNewProduct(identifier); }"
		/>
		<TransactionsSuccessDialog
			:visible="successVisible"
			title="Değişim kaydı oluşturuldu"
			description="Yeni YSC konuma atandı ve ilk bakım kaydı tamamlandı."
			@close="successVisible = false"
		/>
	</div>
</template>
