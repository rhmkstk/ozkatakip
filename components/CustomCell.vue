<script setup lang="ts">
import type { ColumnNode } from 'primevue';

type CustomCells = {
	[key: string]: (value: any) => {
		name: string;
		props: Record<string, any>;
		text: string | null;
	};
};

type Props = {
	slotProps: {
		data: any;
		node: any;
		column: ColumnNode;
		field: string | ((item: any) => string) | undefined;
		index: number;
		frozenRow: boolean;
		editorInitCallback: (event: Event) => void;
		rowTogglerCallback: (event: Event) => void;
	};
};

const props = defineProps<Props>();

const fields: CustomCells = {
	date: (value: string) => ({
		name: 'span',
		props: {},
		text: new Date(value).toLocaleDateString('tr-TR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}),
	}),
	check: (value: boolean) => ({
		name: 'i',
		props: {
			class: value
				? 'ri-check-fill text-3xl text-green-600 font-semibold'
				: 'ri-close-line text-3xl text-red-600 font-semibold',
		},
		text: null,
	}),
};
const components: CustomCells = {
	'products.refill_date': fields.date,
	'photo_url': (value: string) => ({
		name: 'img',
		props: {
			src: value,
			alt: 'Product Image',
			class: 'w-16 h-16 object-cover rounded-lg',
		},
		text: null,
	}),
	'result': fields.check,
};

const field = props.slotProps.field;
console.log('field:', props.slotProps.data.products.refill_date);
const c = components[field](props.slotProps.data[field]);
</script>

<template>
	<div>
		{{ c }}
	</div>

	<!-- <component :is="c.name" v-bind="c.props" :text="c.text" /> -->
</template>
