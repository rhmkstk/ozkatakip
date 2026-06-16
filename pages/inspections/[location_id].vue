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
		return 'ri-question-line app-text-subtle';
	}
	return value
		? 'ri-checkbox-circle-fill'
		: 'ri-close-circle-fill';
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
		return 'app-status-success';
	}

	if (inspection.value?.result === false) {
		return 'app-status-danger';
	}

	return 'app-border app-bg-subtle app-text-muted';
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
		return 'app-status-success';
	}

	if (value === false) {
		return 'app-status-danger';
	}

	return 'app-border app-bg-subtle';
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
			class="overflow-hidden rounded-[28px] border app-border app-surface shadow-sm"
		>
			<div
				class="border-b app-border app-bg-subtle px-5 py-5"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-[11px] font-semibold uppercase tracking-[0.24em] app-text-muted">
							YSC No
						</p>
						<p class="mt-2 text-3xl font-semibold tracking-tight app-text">
							{{ locationLabel }}
						</p>
						<p
							v-if="buildingLabel || roomLabel"
							class="mt-2 text-sm app-text-muted"
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
					class="mt-4 max-w-2xl text-sm leading-6 app-text-muted"
				>
					{{ extinguisherInfo }}
				</p>
			</div>

			<div class="grid gap-3 p-4 sm:grid-cols-2">
				<div
					class="rounded-2xl border app-border app-bg-subtle p-4 backdrop-blur"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] app-text-muted">
						Son kontrol tarihi
					</p>
					<p class="mt-2 text-base font-semibold leading-6 app-text">
						{{ formattedLastInspectionDate || "Bilgi yok" }}
					</p>
				</div>
				<div
					class="rounded-2xl border app-border app-bg-subtle p-4 backdrop-blur"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] app-text-muted">
						Dolum tarihi
					</p>
					<p class="mt-2 text-base font-semibold leading-6 app-text">
						{{ formattedRefillDate || "Bilgi yok" }}
					</p>
				</div>
				<div
					class="rounded-2xl border app-border app-bg-subtle p-4 backdrop-blur"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em] app-text-muted">
						Son kontrolü yapan
					</p>
					<p class="mt-2 text-base font-semibold leading-6 app-text">
						{{ inspectorLabel || "Bilgi yok" }}
					</p>
				</div>
				<div
					class="rounded-2xl border app-border app-surface-inverse p-4 shadow-inner"
				>
					<p class="text-[11px] font-semibold uppercase tracking-[0.18em]" style="color: var(--p-surface-300)">
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
			class="flex flex-col items-center justify-center rounded-[24px] border border-dashed app-border-subtle app-surface p-10 text-center shadow-sm"
		>
			<i class="ri-loader-4-line text-2xl app-text-muted animate-spin" />
			<p class="mt-2 text-sm app-text-muted">
				Bakım kaydı yükleniyor...
			</p>
		</div>

		<div
			v-else-if="error"
			class="rounded-[24px] border app-status-danger p-5 text-sm shadow-sm"
		>
			<p class="font-semibold">
				Kayda ulaşılamadı.
			</p>
			<p class="mt-1">
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
			class="rounded-[24px] border app-border app-surface p-8 text-center app-text-muted shadow-sm"
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
				class="rounded-[28px] border app-border app-surface p-5 shadow-sm"
			>
				<div class="mb-5 flex items-end justify-between gap-3">
					<div>
						<p class="text-[11px] font-semibold uppercase tracking-[0.24em] app-text-muted">
							Kontrol listesi
						</p>
						<h2 class="mt-2 text-lg font-semibold tracking-tight app-text">
							Bakım maddeleri
						</h2>
					</div>
					<p class="text-xs app-text-subtle">
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
						<p class="text-xs font-medium leading-5 app-text-muted">
							{{ field.label }}
						</p>
						<div class="mt-3 flex items-center justify-between gap-3">
							<i
								class="text-3xl"
								:class="booleanIconClass(getInspectionFieldValue(field.key))"
								:aria-label="booleanAriaLabel(getInspectionFieldValue(field.key))"
								role="img"
							/>
							<span class="text-xs font-medium app-text-muted">
								{{ booleanAriaLabel(getInspectionFieldValue(field.key)) }}
							</span>
						</div>
					</div>
				</div>
			</section>

			<section class="grid gap-4 lg:grid-cols-2">
				<div
					class="rounded-[24px] border app-border app-surface p-5 shadow-sm"
				>
					<p class="text-sm font-semibold app-text-muted">
						{{ headerLabels.note }}
					</p>
					<p
						v-if="inspection.note"
						class="mt-2 whitespace-pre-line text-sm app-text"
					>
						{{ inspection.note }}
					</p>
					<p
						v-else
						class="mt-2 text-sm app-text-subtle"
					>
						Not girilmemiş.
					</p>
				</div>

				<div
					class="rounded-[24px] border app-border app-surface p-5 text-sm shadow-sm"
				>
					<p class="text-sm font-semibold app-text-muted">
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
						class="mt-2 text-sm app-text-subtle"
					>
						Fotoğraf bulunmuyor.
					</p>
				</div>
			</section>
		</template>
	</div>
</template>
