<script lang="ts" setup>
import type {
	MobileTransactionContext,
	MobileTransactionCurrentProductData,
} from '~/types/mobile-transaction';

type Props = {
	currentProductData: MobileTransactionCurrentProductData;
};

type Emits = {
	(e: 'close'): void;
};

const { currentProductData } = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const { toTenantPath } = useTenant();
const loading = ref(false);
const state = ref(0);
const newProductId = ref('');
const newProductData = reactive({
	location: null as MobileTransactionCurrentProductData['location'] | null,
	product: null as MobileTransactionCurrentProductData['product'] | null,
});

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
				value: currentProductData.location.building_id?.name,
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
				value: newProductData.location.building_id?.name,
			},
			{
				key: 'Oda',
				value: newProductData.location.room,
			},
		];
	}
	return [];
});

async function getNewProductData() {
	try {
		loading.value = true;
		const mobileTransaction = await $fetch<MobileTransactionContext>(
			'/api/mobile/transactions/getByLocationId',
			{
				params: { location_id: newProductId.value },
			},
		);
		if (!mobileTransaction?.location || !mobileTransaction?.product) {
			throw new Error('Product not found');
		}
		newProductData.location = mobileTransaction.location;
		newProductData.product = mobileTransaction.product;
	}
	catch (error) {
		console.error('Error fetching product data:', error);
		alert('YSC bulunamadı. Lütfen YSC noyu kontrol edin.');
	}
	finally {
		loading.value = false;
		state.value = 1;
	}
}

async function applyChanges() {
	loading.value = true;
	try {
		if (!newProductData.product?.id || !newProductData.location?.location_id) {
			throw new Error('Missing new product data');
		}

		const currentResponse = await $fetch('/api/products/switch', {
			method: 'POST',
			body: {
				currentProduct: currentProductData.product,
				newProduct: newProductData.product,
				details: `arizali YSC no: ${currentProductData.location.location_id}, yeni YSC no: ${newProductData.location.location_id}`,
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
	<div class="h-full">
		<BaseLoader v-if="loading" />
		<div v-if="state === 0">
			<h5 class="mb-12 text-xl font-semibold">
				Yeni YSC nin bilgilerini girin
			</h5>
			<form
				class="mt-auto w-full"
				@submit.prevent
			>
				<div class="form-row">
					<div class="form-item">
						<label for="building_area">YSC no</label>
						<InputText
							id="building_area"
							v-model="newProductId"
							placeholder="ATM-2"
							size="large"
						/>
					</div>
				</div>
				<Button
					label="Ara"
					size="large"
					class="mt-6 w-full"
					@click="getNewProductData"
				/>
			</form>

			<Divider />
			<Button
				class="mt-4 w-full"
				icon="ri-camera-fill"
				label="QR Kod Tara"
				size="large"
				@click="$router.push(toTenantPath('/mobile/transactions/1'))"
			/>
		</div>
		<div
			v-else-if="state === 1"
			class="h-full"
		>
			<div>
				<p class="text-lg mb-8 pt-2">
					Degisim islemini tamamlamak istedigine emin misin ? Eger islemi onaylarsan Yeni YSC ile Mevcut YSC nin konum bilgileri degisecek ?
				</p>
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
				<footer class="flex justify-end px-4 py-6 space-x-4 -m-5 border-t border-slate-200">
					<Button
						label="Vazgeç"
						icon="ri-close-line"
						severity="secondary"
						size="large"
						@click="emit('close')"
					/>
					<Button
						label="Kaydet"
						icon="ri-save-line"
						severity="primary"
						size="large"
						@click="applyChanges"
					/>
				</footer>
			</div>
		</div>
	</div>
</template>
