<script lang="ts" setup>
import QRCode from 'qrcode';
import type { Tables } from '~/types/database.types';

type ProductWithLocation = Tables<'products'> & {
	locations: Tables<'locations'> | null;
};

type Props = {
	products: ProductWithLocation[];
};

const props = defineProps<Props>();

// Store a map of product.id to QR data URL
const qrCodes = ref<Record<string, string>>({});

onMounted(async () => {
	for (const product of props.products) {
		try {
			const dataUrl = await QRCode.toDataURL(String(product.locations?.location_id) || '');
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
						Modeli/Tipi: {{ product.unit }} {{ product.model_type }}
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
