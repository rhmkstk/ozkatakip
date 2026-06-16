<script lang="ts" setup>
type Props = {
	step: string;
	title: string;
	isActive: boolean;
	isDone?: boolean;
};

defineProps<Props>();
</script>

<template>
	<button class="flex flex-col space-y-2 items-center">
		<div
			class="size-8 rounded-full border-2 flex items-center justify-center text-lg font-semibold"
			:class="isActive ? '' : 'app-text-subtle'"
			:style="isActive ? 'border-color: var(--p-green-300); color: var(--p-green-600)' : 'border-color: var(--p-surface-100)'"
		>
			{{ isDone ? '✓' : step }}
		</div>
		<span
			class="font-semibold text-sm"
			:class="isActive ? 'app-text-muted' : 'app-text-subtle'"
		>
			{{ title }}
		</span>
	</button>
</template>
