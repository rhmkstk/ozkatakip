<script setup lang="ts">
const props = defineProps<{ value?: string | null }>();

const parsedDate = computed(() => parseStoredDate(props.value));
const dateLabel = computed(() => parsedDate.value?.toLocaleDateString('tr-TR', {
	day: '2-digit',
	month: 'short',
	year: 'numeric',
}) ?? '-');
const timeLabel = computed(() => parsedDate.value?.toLocaleTimeString('tr-TR', {
	hour: '2-digit',
	minute: '2-digit',
}) ?? '');
</script>

<template>
	<div class="min-w-28 leading-tight">
		<p class="font-medium text-slate-700">
			{{ dateLabel }}
		</p>
		<p
			v-if="timeLabel"
			class="mt-1 flex items-center gap-1 text-[11px] text-slate-400"
		>
			<i class="ri-time-line" />
			{{ timeLabel }}
		</p>
	</div>
</template>
