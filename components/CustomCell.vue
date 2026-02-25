<script setup lang="ts">
import ZoomImage from './ZoomImage.vue';
import { productStatusTypeLabels, transactionTypeLabels } from '~/constants';

type Props = {
	field: string;
	value: unknown;
	type?: string;
};
// need better type definitions

const props = defineProps<Props>();

// function converIsoString(isoString: string): string {
// 	const date = new Date(isoString);
// 	const day = String(date.getUTCDate()).padStart(2, '0');
// 	const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
// 	const year = date.getUTCFullYear();
// 	return `${day}.${month}.${year}`;
// }

const customCells = {
	boolean: (value: boolean | null) => ({
		name: 'i',
		props: {
			class: value
				? 'ri-check-fill text-3xl text-green-600 font-semibold'
				: props.type === 'fill' ? 'ri-subtract-line text-3xl font-semibold text-gray-500' : 'ri-close-line text-3xl text-red-600 font-semibold',
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
		name: 'span',
		props: {},
		text: transactionTypeLabels[value as keyof typeof transactionTypeLabels] || value,
	}),
	productStatus: (value: string) => ({
		name: 'span',
		props: {},
		text: productStatusTypeLabels[value as keyof typeof productStatusTypeLabels] || value,
	}),
	userName: (value: string) => ({
		name: 'span',
		props: {},
		text: getUserName(value),
	}),
};
const componentDefinitions = {
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
		name: 'span',
		props: {},
		text: formatTurkishDateTime(value),
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
