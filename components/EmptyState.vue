<script setup lang="ts">
defineProps<{ title?: string; subtitle?: string }>();
</script>

<template>
	<section class="mx-auto my-16 flex max-w-md flex-col items-center px-6 py-8 text-center">
		<div class="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
			<i class="ri-inbox-2-line" />
		</div>
		<h2 class="text-base font-semibold text-slate-900">
			<span v-if="title">{{ title }}</span><slot
				v-else
				name="title"
			/>
		</h2>
		<p class="mt-1.5 text-sm leading-6 text-slate-500">
			<span v-if="subtitle">{{ subtitle }}</span><slot
				v-else
				name="subtitle"
			/>
		</p>
		<div class="mt-5">
			<slot name="footer" />
		</div>
	</section>
</template>
