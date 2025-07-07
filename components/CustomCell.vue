<script setup lang="ts">
type Props = {
	field: string;
	value: unknown;
};
// need better type definitions

const props = defineProps<Props>();

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
