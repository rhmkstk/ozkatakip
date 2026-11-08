<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Veriler hazırlanıyor' });
</script>

<template>
	<div class="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6">
		<div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg shadow-slate-900/10">
			<span class="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-lg text-blue-600">
				<i class="ri-loader-4-line animate-spin" />
			</span>
			<div>
				<p class="text-sm font-semibold text-slate-800">
					{{ label }}
				</p>
				<p class="text-[11px] text-slate-400">
					Lütfen kısa bir süre bekleyin
				</p>
			</div>
		</div>
	</div>
</template>
