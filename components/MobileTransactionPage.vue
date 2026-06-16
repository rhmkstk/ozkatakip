<script setup lang="ts">
import imageCompression from 'browser-image-compression';
import type { FileUploadSelectEvent } from 'primevue';
import type {
	MobileFillPayload,
	MobileInspectionPayload,
} from '~/types/mobile-transaction';
import {
	imageCompressionOptions,
	inspectionFormFields,
	fillFormFields,
} from '~/constants';
import { useMobileTransactionContext } from '~/composables/use-mobile-transaction-context';
import { useMobileTransactionActions } from '~/composables/use-mobile-transaction-actions';
import { useMobileOfflineState } from '~/composables/use-mobile-offline-state';

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const { toTenantPath } = useTenant();
const { submitInspection, submitFill } = useMobileTransactionActions();
const { isOnline, pendingCount, syncNow } = useMobileOfflineState();
const activeTab = ref('0');
const compressedImage = ref<File | null>(null);
const inspectionFormLoading = ref(false);
const drawersShow = reactive({
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

const isLoading = computed(() => {
	return (
		status.value === 'pending'
		|| status.value === 'idle'
		|| inspectionFormLoading.value
	);
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

const {
	data,
	status,
	lastInspectionDate,
	showInspectionAlert,
	inspectionAlert,
	isRefillDateExpired,
	refillDateAlert,
	contextSource,
	hasCachedFallback,
} = await useMobileTransactionContext(String(route.params.id));

const formattedInspectionAlertDate = computed(() => {
	if (!lastInspectionDate.value) {
		return '';
	}

	return new Date(lastInspectionDate.value).toLocaleDateString('tr-TR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});
});

const locationId = computed(() => String(route.params.id));
const changePagePath = computed(() =>
	toTenantPath(`/mobile/change/${locationId.value}`),
);
const offlineBannerText = computed(() => {
	if (contextSource.value === 'cache') {
		return 'Cevrimdisi modda kayitli son urun bilgileri gosteriliyor.';
	}

	if (contextSource.value === 'empty') {
		return 'Bu YSC daha once cihaza alinmamis. Urun bilgileri bos olabilir; kayitlariniz kuyruga alinacak.';
	}

	return '';
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

		if (!userId) {
			throw new Error('Missing required inspection context');
		}

		const inspectionPayload: Omit<
			MobileInspectionPayload,
      'fire_extinguisher_id' | 'photo_url' | 'user_id'
		> = {
			...inspectionForm,
			result,
			date: formatDateOnlyForApi(new Date()),
		};

		const response = await submitInspection({
			locationId: locationId.value,
			userId,
			inspection: inspectionPayload,
			photoFile: compressedImage.value,
			photoFileName: compressedImage.value?.name,
			photoFileType: compressedImage.value?.type,
		});

		if (response.mode === 'queued') {
			toast.add({
				severity: 'info',
				summary: 'Kuyruga alindi',
				detail: 'Bakim kaydi internet geldiginde gonderilecek.',
				life: 2500,
			});
			await syncNow();
		}

		inspectionFormLoading.value = false;
		if (result) {
			drawersShow.success = true;
			return;
		}
		else {
			drawersShow.needChange = true;
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
		if (!userId) {
			throw new Error('Missing required fill context');
		}

		const fillPayload: Omit<MobileFillPayload, 'product_id' | 'user_id'> = {
			...fillForm,
		};

		const response = await submitFill({
			locationId: locationId.value,
			userId,
			fill: fillPayload,
		});

		if (response.mode === 'queued') {
			toast.add({
				severity: 'info',
				summary: 'Kuyruga alindi',
				detail: 'Dolum kaydi internet geldiginde gonderilecek.',
				life: 2500,
			});
			await syncNow();
		}

		drawersShow.success = true;
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

function openChangePage() {
	drawersShow.needChange = false;
	navigateTo(changePagePath.value);
}
</script>

<template>
	<div>
		<BaseLoader v-if="isLoading" />
		<div
			v-if="!isLoading"
			class="flex flex-col h-full"
		>
			<div
				v-if="status === 'error' && isOnline && contextSource === 'network'"
				class="py-2 flex flex-col gap-y-8"
			>
				<p class="text-lg">
					Aradiginiz YSC bulunamadi! Geri donup farkli mevcut bir YSC ile islem
					yapabilirsiniz
				</p>
				<Button
					label="Geri"
					@click="$router.push(toTenantPath('/mobile'))"
				/>
			</div>
			<template v-else>
				<Message
					v-if="isOnline && pendingCount > 0"
					severity="info"
					class="mb-4"
				>
					{{ pendingCount }} islem senkronizasyon icin bekliyor.
				</Message>
				<Message
					v-if="contextSource !== 'network'"
					severity="secondary"
					class="mb-4"
				>
					{{ offlineBannerText }}
				</Message>
				<!-- <ProductSummary
          v-if="data?.product"
          :product="data.product"
          :location="data.location"
        /> -->
				<div>
					<ProductSummary2
						v-if="data?.product"
						:product="data.product"
						:location="data.location"
					/>
				</div>

				<Message
					v-if="isRefillDateExpired"
					severity="error"
					class="my-4"
				>
					{{ refillDateAlert }}
				</Message>
				<Message
					v-if="showInspectionAlert && hasCachedFallback"
					severity="warn"
					icon="ri-error-warning-line"
					class="my-8"
					:pt="{ content: { class: '!items-start' } }"
				>
					<template v-if="formattedInspectionAlertDate">
						Bu YSC numarasina
						<strong>{{ formattedInspectionAlertDate }}</strong>
						tarihinde bir bakım kaydı girilmiş. Yine de bakım kaydı oluşturmak
						istiyor musunuz?
					</template>
					<template v-else>
						{{ inspectionAlert }}
					</template>
				</Message>

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
								class="space-y-5 m-0"
								@submit.prevent
							>
								<div
									v-for="field in inspectionFormFields"
									:key="field.key"
									class="flex items-center gap-2"
								>
									<Checkbox
										v-model="
											inspectionForm[field.key as keyof typeof inspectionForm]
										"
										:input-id="field.key"
										binary
									/>
									<label :for="field.key"> {{ field.label }} </label>
								</div>

								<div class="flex flex-col gap-2">
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
									class="w-full mt-4"
									label="Bakim kaydi olustur"
									@click="saveInspectionForm"
								/>
							</form>
						</TabPanel>
						<TabPanel value="1">
							<form
								class="space-y-5 m-0"
								@submit.prevent
							>
								<div
									v-for="field in fillFormFields"
									:key="field.key"
									class="flex items-center gap-2"
								>
									<Checkbox
										v-model="fillForm[field.key as keyof typeof fillForm]"
										:input-id="field.key"
										binary
									/>
									<label :for="field.key"> {{ field.label }} </label>
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
			</template>
		</div>
		<TransactionInfoDialog
			v-model:is-active="drawersShow.needChange"
			@open-change-dialog="openChangePage"
		/>
		<TransactionsSuccessDialog
			:visible="drawersShow.success"
			:title="
				activeTab === '0'
					? 'Bakim kaydi basariyla olusturuldu!'
					: 'Dolum kaydi basariyla olusturuldu!'
			"
			@close="drawersShow.success = false"
		/>
	</div>
</template>
