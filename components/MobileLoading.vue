<script setup lang="ts">
withDefaults(defineProps<{ label?: string; description?: string }>(), {
	label: 'İşlem yapılıyor',
	description: 'Lütfen kısa bir süre bekleyin.',
});
</script>

<template>
	<div class="fixed inset-0 z-[80] flex min-h-dvh items-center justify-center bg-slate-100/95 px-6 backdrop-blur-sm">
		<div class="w-full max-w-xs text-center">
			<span class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-2xl text-blue-600 shadow-lg shadow-slate-900/10">
				<i class="ri-loader-4-line animate-spin" />
			</span>
			<p class="mt-4 text-base font-bold text-slate-900">
				{{ label }}
			</p>
			<p class="mt-1 text-sm text-slate-500">
				{{ description }}
			</p>
		</div>
	</div>
</template>
