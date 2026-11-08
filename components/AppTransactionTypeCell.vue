<script setup lang="ts">
import { transactionTypeLabels } from '~/constants';

const props = defineProps<{ value?: string | null }>();
const typeMap: Record<string, { icon: string; className: string }> = {
	inspection: { icon: 'ri-shield-check-line', className: 'bg-blue-50 text-blue-700' },
	fill: { icon: 'ri-refresh-line', className: 'bg-emerald-50 text-emerald-700' },
	change: { icon: 'ri-swap-line', className: 'bg-amber-50 text-amber-700' },
	other: { icon: 'ri-more-line', className: 'bg-slate-100 text-slate-600' },
};
const type = computed(() => typeMap[props.value ?? ''] ?? typeMap.other);
const label = computed(() => transactionTypeLabels[props.value as keyof typeof transactionTypeLabels] || props.value || '-');
</script>

<template>
	<div class="flex items-center gap-2.5 whitespace-nowrap">
		<span
			class="flex size-8 items-center justify-center rounded-lg text-base"
			:class="type.className"
		>
			<i :class="type.icon" />
		</span>
		<span class="font-medium text-slate-700">{{ label }}</span>
	</div>
</template>
