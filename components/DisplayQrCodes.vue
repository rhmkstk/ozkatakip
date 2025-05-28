<script lang="ts" setup>
import QRCode from 'qrcode';
import type { TablesInsert } from '~/types/database.types';

type Props = {
	products: TablesInsert<'products'>[];
};

const props = defineProps<Props>();

// Store a map of product.id to QR data URL
const qrCodes = ref<Record<string, string>>({});

const ModelTypeAbbrs = {
	'5 KG KARBONDİOKSİT GAZLI': '5 KG CO2',
	'10 KG KARBONDİOKSİT GAZLI': '10 KG CO2',
	'6 KG ABC KURU KİMYEVİ TOZLU': '6 KG KKT',
	'2 KG ABC KURU KİMYEVİ TOZLU': '2 KG KKT',
	'12 KG ABC KURU KİMYEVİ TOZLU': '12 KG KKT',
	'25 KG ABC KURU KİMYEVİ TOZLU': '25 KG KKT',
	'50 KG ABC KURU KİMYEVİ TOZLU': '50 KG KKT',
	'2 KG BIOVERSAL KOPUKLU': '2 KG BIO',
	'6 KG BIOVERSAL KOPUKLU': '6 KG BIO',
	'9 KG BIOVERSAL KOPUKLU': '9 KG BIO',
	'25 KG BIOVERSAL KOPUKLU': '25 KG BIO',
	'50 KG BIOVERSAL KOPUKLU': '50 KG BIO',
};

onMounted(async () => {
	for (const product of props.products) {
		try {
			const dataUrl = await QRCode.toDataURL(String(product.serial_number) || '');
			qrCodes.value[product.id] = dataUrl;
		}
		catch (err) {
			console.error(`Error generating QR for ${product.id}:`, err);
		}
	}
});
</script>

<template>
	<div class="flex gap-4 flex-wrap justify-center">
		<div
			v-for="product in products"
			:key="product.id"
			class="flex items-center"
		>
			<img
				:src="qrCodes[product.id]"
				alt="QR Code"
				class="size-64"
			>
			<div class="flex items-center">
				<div class="flex flex-col space-y-2 align-baseline space-x-3 font-semibold">
					<p class="text-left">
						Modeli/Tipi: {{ ModelTypeAbbrs[product.model_type] }}
					</p>
					<p class="text-left">
						Seri no: {{ product.serial_number }}
					</p>
					<p class="text-left">
						Marka: {{ product.brand }}
					</p>
					<p class="text-left">
						Üretim tarihi: {{ product.manufacture_year.slice(0, 4) }}
					</p>
				</div>
			</div>
		</div>
	</div>
</template>
