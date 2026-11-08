<script setup lang="ts">
defineProps<{
	title: string;
	subtitle?: string;
}>();
</script>

<template>
	<div class="min-w-0 pr-2">
		<h2 class="text-lg font-bold tracking-[-0.015em] text-slate-950">
			{{ title }}
		</h2>
		<p
			v-if="subtitle"
			class="mt-1 text-sm font-normal leading-5 text-slate-500"
		>
			{{ subtitle }}
		</p>
	</div>
</template>
