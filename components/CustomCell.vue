<script setup lang="ts">
import { productStatusTypeLabels, transactionTypeLabels } from '~/constants';
import ZoomImage from './ZoomImage.vue';

type Props = {
	field: string;
	value: unknown;
};
// need better type definitions

const props = defineProps<Props>();

function converIsoString(isoString: string): string {
	const date = new Date(isoString);
	const day = String(date.getUTCDate()).padStart(2, '0');
	const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
	const year = date.getUTCFullYear();
	return `${day}.${month}.${year}`;
}

const customCells = {
	boolean: (value: boolean) => ({
		name: 'i',
		props: {
			class: value
				? 'ri-check-fill text-3xl text-green-600 font-semibold'
				: 'ri-close-line text-3xl text-red-600 font-semibold',
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
};
const componentDefinitions = {
	'products.refill_date': (value: string) => ({
		name: 'span',
		props: {},
		text: value,
	}),
	'products.next_refill_date': (value: string) => ({
		name: 'span',
		props: {},
		text: value,
		// text: new Date(value).toLocaleDateString('tr-TR', {
		// 	year: 'numeric',
		// 	month: '2-digit',
		// 	day: '2-digit',
		// }),
	}),
	'created_at': (value: string) => ({
		name: 'span',
		props: {},
		text: converIsoString(value),
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
	'hydrostatic_pressure_test': customCells.boolean,
	'photo_url': customCells.photo,
	'type': customCells.type,
	'current_status': customCells.productStatus,
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
