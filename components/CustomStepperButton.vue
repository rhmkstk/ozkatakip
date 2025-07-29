<script lang="ts" setup>
type Props = {
	step: string;
	title: string;
	isActive: boolean;
};

defineProps<Props>();
</script>

<template>
	<button class="flex flex-col space-y-2 items-center">
		<div
			class="size-8 rounded-full border-2 flex items-center justify-center text-lg font-semibold"
			:class="isActive ? 'border-slate-300 text-slate-600' : 'border-slate-100 text-slate-400'"
		>
			{{ step }}
		</div>
		<span
			class="font-semibold text-sm"
			:class="isActive ? 'text-slate-600' : 'text-slate-400'"
		>
			{{ title }}
		</span>
	</button>
</template>
