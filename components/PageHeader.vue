<script lang="ts" setup>
defineProps<{ title?: string; eyebrow?: string }>();
</script>

<template>
	<header class="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
		<div class="min-w-0">
			<p class="app-kicker mb-1">
				{{ eyebrow || 'Özka Takip' }}
			</p>
			<div class="flex items-center gap-3">
				<slot />
				<h1
					v-if="title"
					class="truncate text-xl font-bold tracking-[-0.02em] text-slate-950 sm:text-2xl"
				>
					{{ title }}
				</h1>
			</div>
		</div>
		<div class="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
			<slot name="right" />
		</div>
	</header>
</template>
