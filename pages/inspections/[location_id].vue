<script setup lang="ts">
import { inspectionFormFields, headerLabels } from '~/constants';
import type { Tables } from '~/types/database.types';

definePageMeta({
	layout: 'mobile',
});

type InspectionResponse = Tables<'inspections'> & {
	products?: {
		brand?: string | null;
		model_type?: string | null;
		serial_number?: number | null;
		unit?: string | null;
		locations?: {
			location_id?: string;
			room?: string;
			building_id?: {
				name?: string;
			} | null;
		} | null;
	} | null;
};

const route = useRoute();
const locationId = computed(() => route.params.location_id as string);

const {
	data: inspections,
	pending,
	error,
	refresh,
} = await useFetch<InspectionResponse[]>('/api/inspections/getByLocationId', {
	params: { location_id: locationId },
	watch: [locationId],
	immediate: true,
	default: () => [],
});

const inspection = computed(() => inspections.value?.[0] ?? null);

const formattedDate = computed(() => {
	if (!inspection.value?.created_at) {
		return null;
	}
	return new Date(inspection.value.created_at).toLocaleString('tr-TR', {
		dateStyle: 'long',
		timeStyle: 'short',
	});
});

const locationLabel = computed(
	() => inspection.value?.products?.locations?.location_id ?? locationId.value,
);
const buildingLabel = computed(
	() => inspection.value?.products?.locations?.building_id?.name ?? null,
);
const roomLabel = computed(() => inspection.value?.products?.locations?.room ?? null);
const extinguisherInfo = computed(() => {
	if (!inspection.value?.products) {
		return null;
	}

	const { brand, model_type, unit, serial_number } = inspection.value.products;
	const parts = [
		brand,
		model_type,
		unit ? `${unit} KG` : null,
		serial_number ? `Seri No: ${serial_number}` : null,
	].filter(Boolean);

	return parts.length ? parts.join(' · ') : null;
});

const booleanIconClass = (value: boolean | null | undefined) => {
	if (value === null || value === undefined) {
		return 'ri-question-line text-slate-400';
	}
	return value ? 'ri-checkbox-circle-fill text-emerald-600' : 'ri-close-circle-fill text-rose-600';
};

const booleanAriaLabel = (value: boolean | null | undefined) => {
	if (value === null || value === undefined) {
		return 'Belirtilmedi';
	}
	return value ? 'Uygun' : 'Uygun değil';
};

const getInspectionFieldValue = (key: string) => {
	if (!inspection.value) {
		return undefined;
	}
	return inspection.value[key as keyof InspectionResponse] as boolean | null | undefined;
};

useHead(() => ({
	title: `Bakım Raporu - ${locationLabel.value}`,
	meta: [
		{
			name: 'description',
			content: 'YSC üzerinde yapılan son bakım kaydının detaylarını görüntüleyin.',
		},
	],
}));
</script>

<template>
	<div class="flex flex-col gap-4 pb-6">
		<section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
				YSC No
			</p>
			<p class="mt-1 text-3xl font-bold text-slate-900">
				{{ locationLabel }}
			</p>
			<p v-if="buildingLabel || roomLabel" class="text-sm text-slate-500">
				{{ roomLabel }}
				<span v-if="buildingLabel && roomLabel"> · </span>
				{{ buildingLabel }}
			</p>
			<p v-if="extinguisherInfo" class="mt-3 text-sm text-slate-600">
				{{ extinguisherInfo }}
			</p>
			<div class="mt-5 grid grid-cols-2 gap-4">
				<div class="rounded-lg bg-slate-50 p-4">
					<p class="text-xs text-slate-500 uppercase">{{ headerLabels.result }}</p>
					<i
						class="mt-2 text-4xl"
						:class="booleanIconClass(inspection?.result)"
						:aria-label="booleanAriaLabel(inspection?.result)"
						role="img"
					/>
				</div>
				<div class="rounded-lg bg-slate-50 p-4">
					<p class="text-xs text-slate-500 uppercase">Kaydedildiği tarih</p>
					<p class="mt-2 text-xl font-semibold text-slate-900">
						{{ formattedDate || "Bilgi yok" }}
					</p>
				</div>
			</div>
		</section>

		<div
			v-if="pending"
			class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"
		>
			<i class="ri-loader-4-line text-2xl text-slate-500 animate-spin" />
			<p class="mt-2 text-sm text-slate-500">Bakım kaydı yükleniyor...</p>
		</div>

		<div
			v-else-if="error"
			class="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-600"
		>
				<p class="font-semibold">Kayda ulaşılamadı.</p>
				<p class="mt-1 text-rose-500">Lütfen bağlantınızı kontrol edip tekrar deneyin.</p>
				<Button class="mt-3" label="Tekrar dene" icon="ri-refresh-line" @click="() => refresh()" />
		</div>

		<div
			v-else-if="!inspection"
			class="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-600"
		>
			<p class="font-semibold">Bu lokasyon için kayıt bulunamadı.</p>
			<p class="mt-1 text-sm">Lütfen başka bir YSC numarası deneyin.</p>
		</div>

		<template v-else>
			<section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
				<h2 class="text-sm font-semibold text-slate-600 mb-4">Bakım maddeleri</h2>
				<div class="grid gap-4 grid-cols-2">
					<div
						v-for="field in inspectionFormFields"
						:key="field.key"
						class="rounded-lg border border-slate-100 bg-slate-50 p-4"
					>
						<p class="text-xs font-medium text-slate-500">
							{{ field.label }}
						</p>
						<i
							class="mt-2 text-3xl"
							:class="booleanIconClass(getInspectionFieldValue(field.key))"
							:aria-label="booleanAriaLabel(getInspectionFieldValue(field.key))"
							role="img"
						/>
					</div>
				</div>
			</section>

			<section class="grid gap-4 lg:grid-cols-2">
				<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<p class="text-sm font-semibold text-slate-600">
						{{ headerLabels.note }}
					</p>
					<p v-if="inspection.note" class="mt-2 whitespace-pre-line text-sm text-slate-700">
						{{ inspection.note }}
					</p>
					<p v-else class="mt-2 text-sm text-slate-400">
						Not girilmemiş.
					</p>
				</div>

				<div class="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
					<p class="text-sm font-semibold text-slate-600">
						{{ headerLabels.photo_url }}
					</p>
					<div v-if="inspection.photo_url" class="mt-4">
						<ZoomImage :src="inspection.photo_url" />
					</div>
					<p v-else class="mt-2 text-sm text-slate-400">
						Fotoğraf bulunmuyor.
					</p>
				</div>
			</section>
		</template>
	</div>
</template>
