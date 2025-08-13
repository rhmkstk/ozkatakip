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
			:class="isActive ? 'border-green-300 text-green-600' : 'border-slate-100 text-slate-400'"
		>
			{{ isDone ? '✓' : step }}
		</div>
		<span
			class="font-semibold text-sm"
			:class="isActive ? 'text-slate-600' : 'text-slate-400'"
		>
			{{ title }}
		</span>
	</button>
</template>
