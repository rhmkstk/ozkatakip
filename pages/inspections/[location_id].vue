<script setup lang="ts">
import { inspectionFormFields, headerLabels } from '~/constants';
import type { Tables } from '~/types/database.types';

definePageMeta({
	layout: 'mobile',
});

type InspectionResponse = Tables<'inspections'> & {
	inspector?: {
		first_name?: string | null;
		last_name?: string | null;
	} | null;
	products?: {
		brand?: string | null;
		model_type?: string | null;
		serial_number?: number | null;
		unit?: string | null;
		refill_date?: string | null;
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

const lastInspectionDate = computed(() => {
	if (!inspection.value) {
		return null;
	}
	return inspection.value.date || inspection.value.created_at || null;
});

const formattedLastInspectionDate = computed(() => {
	if (!lastInspectionDate.value) {
		return null;
	}

	return inspection.value?.date
		? formatTurkishDate(lastInspectionDate.value)
		: formatTurkishDateTime(lastInspectionDate.value);
});

const formattedRefillDate = computed(() => {
	if (!inspection.value?.products?.refill_date) {
		return null;
	}

	return formatTurkishDate(inspection.value.products.refill_date);
});

const locationLabel = computed(
	() => inspection.value?.products?.locations?.location_id ?? locationId.value,
);
const buildingLabel = computed(
	() => inspection.value?.products?.locations?.building_id?.name ?? null,
);
const roomLabel = computed(() => inspection.value?.products?.locations?.room ?? null);
const inspectorLabel = computed(() => {
	if (!inspection.value?.inspector) {
		return null;
	}

	const { first_name, last_name } = inspection.value.inspector;
	return [first_name, last_name].filter(Boolean).join(' ') || null;
});

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

const resultToneClass = computed(() => {
	if (inspection.value?.result === true) {
		return 'border-emerald-200 bg-emerald-50 text-emerald-700';
	}

	if (inspection.value?.result === false) {
		return 'border-rose-200 bg-rose-50 text-rose-700';
	}

	return 'border-slate-200 bg-slate-100 text-slate-600';
});

const resultLabel = computed(() => {
	if (inspection.value?.result === true) {
		return 'Uygun';
	}

	if (inspection.value?.result === false) {
		return 'Uygun değil';
	}

	return 'Belirsiz';
});

const inspectionFieldCardClass = (value: boolean | null | undefined) => {
	if (value === true) {
		return 'border-emerald-200 bg-emerald-50/70';
	}

	if (value === false) {
		return 'border-rose-200 bg-rose-50/70';
	}

	return 'border-slate-200 bg-slate-50';
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
	<div class="flex flex-col gap-5 pb-8">
		<section
			class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]"
		>
			<div
				class="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] px-5 py-5"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
							YSC No
						</p>
						<p class="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
							{{ locationLabel }}
						</p>
						<p
							v-if="buildingLabel || roomLabel"
							class="mt-2 text-sm text-slate-600"
						>
							{{ roomLabel }}
							<span v-if="buildingLabel && roomLabel"> · </span>
							{{ buildingLabel }}
						</p>
					</div>
					<div
						class="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
						:class="resultToneClass"
					>
						<i
							class="text-base"
							:class="booleanIconClass(inspection?.result)"
							:aria-label="booleanAriaLabel(inspection?.result)"
							role="img"
						/>
						<span>{{ resultLabel }}</span>
					</div>
				</div>
				<p
					v-if="extinguisherInfo"
					class="mt-4 max-w-2xl text-sm leading-6 text-slate-600"
				>
					{{ extinguisherInfo }}
				</p>
			</div>

			<div class="grid gap-3 p-4 sm:grid-cols-2">
				<div
					class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 backdrop-blur"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
						Son kontrol tarihi
					</p>
					<p class="mt-2 text-base font-semibold leading-6 text-slate-900">
						{{ formattedLastInspectionDate || "Bilgi yok" }}
					</p>
				</div>
				<div
					class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 backdrop-blur"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
						Dolum tarihi
					</p>
					<p class="mt-2 text-base font-semibold leading-6 text-slate-900">
						{{ formattedRefillDate || "Bilgi yok" }}
					</p>
				</div>
				<div
					class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 backdrop-blur"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
						Son kontrolü yapan
					</p>
					<p class="mt-2 text-base font-semibold leading-6 text-slate-900">
						{{ inspectorLabel || "Bilgi yok" }}
					</p>
				</div>
				<div
					class="rounded-2xl border border-slate-200 bg-slate-900 p-4 text-slate-50 shadow-inner"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
						{{ headerLabels.result }}
					</p>
					<div class="mt-2 flex items-center gap-3">
						<i
							class="text-3xl"
							:class="booleanIconClass(inspection?.result)"
							:aria-label="booleanAriaLabel(inspection?.result)"
							role="img"
						/>
						<p class="text-base font-semibold">
							{{ resultLabel }}
						</p>
					</div>
				</div>
			</div>
		</section>

		<div
			v-if="pending"
			class="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/90 p-10 text-center shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]"
		>
			<i class="ri-loader-4-line text-2xl text-slate-500 animate-spin" />
			<p class="mt-2 text-sm text-slate-500">
				Bakım kaydı yükleniyor...
			</p>
		</div>

		<div
			v-else-if="error"
			class="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-600 shadow-[0_12px_30px_-24px_rgba(225,29,72,0.35)]"
		>
			<p class="font-semibold">
				Kayda ulaşılamadı.
			</p>
			<p class="mt-1 text-rose-500">
				Lütfen bağlantınızı kontrol edip tekrar deneyin.
			</p>
			<Button
				class="mt-3"
				label="Tekrar dene"
				icon="ri-refresh-line"
				@click="() => refresh()"
			/>
		</div>

		<div
			v-else-if="!inspection"
			class="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]"
		>
			<p class="font-semibold">
				Bu lokasyon için kayıt bulunamadı.
			</p>
			<p class="mt-1 text-sm">
				Lütfen başka bir YSC numarası deneyin.
			</p>
		</div>

		<template v-else>
			<section
				class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]"
			>
				<div class="mb-5 flex items-end justify-between gap-3">
					<div>
						<p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
							Kontrol listesi
						</p>
						<h2 class="mt-2 text-lg font-semibold tracking-tight text-slate-900">
							Bakım maddeleri
						</h2>
					</div>
					<p class="text-xs text-slate-400">
						{{ inspectionFormFields.length }} madde
					</p>
				</div>
				<div class="grid gap-3 grid-cols-2">
					<div
						v-for="field in inspectionFormFields"
						:key="field.key"
						class="rounded-2xl border p-4 transition-colors"
						:class="inspectionFieldCardClass(getInspectionFieldValue(field.key))"
					>
						<p class="text-xs font-medium leading-5 text-slate-600">
							{{ field.label }}
						</p>
						<div class="mt-3 flex items-center justify-between gap-3">
							<i
								class="text-3xl"
								:class="booleanIconClass(getInspectionFieldValue(field.key))"
								:aria-label="booleanAriaLabel(getInspectionFieldValue(field.key))"
								role="img"
							/>
							<span class="text-xs font-medium text-slate-500">
								{{ booleanAriaLabel(getInspectionFieldValue(field.key)) }}
							</span>
						</div>
					</div>
				</div>
			</section>

			<section class="grid gap-4 lg:grid-cols-2">
				<div
					class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]"
				>
					<p class="text-sm font-semibold text-slate-600">
						{{ headerLabels.note }}
					</p>
					<p
						v-if="inspection.note"
						class="mt-2 whitespace-pre-line text-sm text-slate-700"
					>
						{{ inspection.note }}
					</p>
					<p
						v-else
						class="mt-2 text-sm text-slate-400"
					>
						Not girilmemiş.
					</p>
				</div>

				<div
					class="rounded-[24px] border border-slate-200 bg-white p-5 text-sm shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)]"
				>
					<p class="text-sm font-semibold text-slate-600">
						{{ headerLabels.photo_url }}
					</p>
					<div
						v-if="inspection.photo_url"
						class="mt-4"
					>
						<ZoomImage :src="inspection.photo_url" />
					</div>
					<p
						v-else
						class="mt-2 text-sm text-slate-400"
					>
						Fotoğraf bulunmuyor.
					</p>
				</div>
			</section>
		</template>
	</div>
</template>
