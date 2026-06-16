<script setup lang="ts">
import { defineComponent, h } from 'vue';
import ZoomImage from './ZoomImage.vue';
import { productStatusTypeLabels, transactionTypeLabels } from '~/constants';

type Props = {
	field: string;
	value: unknown;
	type?: string;
};
// need better type definitions

const props = defineProps<Props>();
const { getUserNameById, loadUserDirectory } = useUserDirectory();

onMounted(() => {
	loadUserDirectory();
});

const CreatedAtCell = defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(cellProps) {
		return () => {
			const formattedDateTime = formatTurkishDateTime(cellProps.value);
			const [date, time] = formattedDateTime.includes(' ')
				? formattedDateTime.split(' ')
				: [formattedDateTime, ''];
			const children = [
				h('span', {
					class: 'font-medium app-text',
				}, date),
			];

			if (time) {
				children.push(
					h('span', {
						class: 'inline-flex items-center gap-1 text-xs app-text-muted',
					}, [
						h('i', {
							'class': 'ri-time-line text-sm leading-none',
							'aria-hidden': 'true',
						}),
						h('span', time),
					]),
				);
			}

			return h('span', {
				class: 'inline-flex flex-col items-start gap-0.5 whitespace-nowrap leading-tight',
			}, children);
		};
	},
});

const TransactionTypeCell = defineComponent({
	props: {
		value: {
			type: String,
			default: '',
		},
	},
	setup(cellProps) {
		return () => {
			const iconMap: Record<string, string> = {
				fill: 'ri-ink-bottle-line',
				inspection: 'ri-shield-check-line',
				change: 'ri-exchange-line',
				other: 'ri-more-line',
			};
			const label = transactionTypeLabels[cellProps.value as keyof typeof transactionTypeLabels] || cellProps.value;

			return h('span', {
				class: 'inline-flex items-center gap-2 whitespace-nowrap',
			}, [
				h('i', {
					'class': `${iconMap[cellProps.value] || 'ri-more-line'} text-base leading-none app-text-muted`,
					'aria-hidden': 'true',
				}),
				h('span', label),
			]);
		};
	},
});

// function converIsoString(isoString: string): string {
// 	const date = new Date(isoString);
// 	const day = String(date.getUTCDate()).padStart(2, '0');
// 	const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
// 	const year = date.getUTCFullYear();
// 	return `${day}.${month}.${year}`;
// }

const customCells = {
	modelType: (value: string) => ({
		name: 'span',
		props: {},
		text: getShortModelType(value),
	}),
	boolean: (value: boolean | null) => ({
		name: 'i',
		props: {
			class: value
				? 'ri-check-fill text-3xl font-semibold'
				: props.type === 'fill' ? 'ri-subtract-line text-3xl font-semibold app-text-muted' : 'ri-close-line text-3xl font-semibold',
			style: value
				? 'color: var(--p-green-600)'
				: props.type === 'fill' ? undefined : 'color: var(--p-red-600)',
		},
		text: null,
	}),
	photo: (value: string) => ({
		name: ZoomImage,
		props: {
			src: value,
			alt: 'Product Photo',
		},
		text: null,
	}),
	type: (value: string) => ({
		name: TransactionTypeCell,
		props: {
			value,
		},
		text: null,
	}),
	productStatus: (value: string) => ({
		name: 'span',
		props: {},
		text: productStatusTypeLabels[value as keyof typeof productStatusTypeLabels] || value,
	}),
	userName: (value: string) => ({
		name: 'span',
		props: {},
		text: getUserNameById(value),
	}),
};
const componentDefinitions = {
	'model_type': customCells.modelType,
	'products.model_type': customCells.modelType,
	'products.refill_date': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishMonthYear(value),
	}),
	'products.next_refill_date': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishMonthYear(value),
	}),
	'products.hydrostatic_test_date': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishMonthYear(value),
	}),
	'created_at': (value: string) => ({
		name: CreatedAtCell,
		props: {
			value,
		},
		text: null,
	}),
	'manufacture_year': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishYear(value),
	}),
	'hydrostatic_test_date': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishMonthYear(value),
	}),
	'next_hydrostatic_test_date': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishMonthYear(value),
	}),
	'refill_date': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishMonthYear(value),
	}),
	'next_refill_date': (value: string) => ({
		name: 'span',
		props: {},
		text: formatTurkishMonthYear(value),
	}),

	'result': customCells.boolean,
	'position': customCells.boolean,
	'body': customCells.boolean,
	'control_card': customCells.boolean,
	'hose_and_nozzle': customCells.boolean,
	'instruction_and_label': customCells.boolean,
	'mass': customCells.boolean,
	'pin_and_seal': customCells.boolean,
	'pressure': customCells.boolean,
	'working_mechanism': customCells.boolean,
	'filling': customCells.boolean,
	'trigger_valve': customCells.boolean,
	'manometer': customCells.boolean,
	'wheel': customCells.boolean,
	'paint': customCells.boolean,
	'is_expiry': customCells.boolean,
	'hydrostatic_pressure_test': customCells.boolean,
	'photo_url': customCells.photo,
	'type': customCells.type,
	'current_status': customCells.productStatus,
	'user': customCells.userName,
};

const currentComponentData = computed(() => {
	if (props.field in componentDefinitions) {
		return componentDefinitions[props.field](props.value);
	}
	return null;
});

function getShortModelType(modelType: string | null | undefined): string {
	if (!modelType) return '';

	const mappings = {
		'Karbondioksit gazli': 'CO2',
		'Kuru Kimyevi Tozlu': 'KKT',
		'Bioversal köpüklü': 'BIO',
	} as const;

	return mappings[modelType as keyof typeof mappings] || modelType;
}
</script>

<template>
	<component
		:is="currentComponentData.name"
		v-if="currentComponentData"
		v-bind="currentComponentData.props"
	>
		{{ currentComponentData.text }}
	</component>
</template>
