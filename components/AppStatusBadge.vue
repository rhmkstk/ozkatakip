<script setup lang="ts">
import { productStatusTypeLabels } from '~/constants';

const props = defineProps<{ value?: string | null }>();

const statusMap: Record<string, { icon: string; className: string }> = {
	active: { icon: 'ri-checkbox-circle-fill', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
	damaged: { icon: 'ri-error-warning-fill', className: 'bg-red-50 text-red-700 ring-red-200' },
	lost: { icon: 'ri-question-fill', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
	spare: { icon: 'ri-inbox-archive-fill', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
	scrap: { icon: 'ri-delete-bin-6-fill', className: 'bg-slate-800 text-white ring-slate-700' },
};

const status = computed(() => statusMap[props.value ?? ''] ?? statusMap.lost);
const label = computed(() => productStatusTypeLabels[props.value as keyof typeof productStatusTypeLabels] || props.value || '-');
</script>

<template>
	<span
		class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset"
		:class="status.className"
	>
		<i :class="status.icon" />
		{{ label }}
	</span>
</template>
