<script setup lang="ts">
withDefaults(defineProps<{ activeCount?: number }>(), { activeCount: 0 });
defineEmits<{ open: []; clear: [] }>();
</script>

<template>
	<div class="flex h-9 w-40 overflow-hidden rounded-lg border border-slate-300 bg-slate-100">
		<button
			type="button"
			class="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 px-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
			@click="$emit('open')"
		>
			<i class="ri-filter-3-line text-base" />
			<span>Filtreler</span>
			<span
				v-if="activeCount"
				class="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-bold tabular-nums text-white"
			>
				{{ activeCount }}
			</span>
		</button>
		<button
			v-if="activeCount"
			type="button"
			class="flex w-9 shrink-0 cursor-pointer items-center justify-center border-l border-slate-300 text-base text-slate-500 transition hover:bg-red-50 hover:text-red-600"
			aria-label="Filtreleri temizle"
			title="Filtreleri temizle"
			@click="$emit('clear')"
		>
			<i class="ri-close-line" />
		</button>
	</div>
</template>
